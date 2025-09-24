import * as path from 'jsr:@std/path';
import { Promise as NodeID3 } from 'npm:node-id3';
import FileOps from '../FileOps.ts';

const TEMP_PATH = Deno.env.get('TEMP_PATH') || '/tmp/songs/';
const TRIM_AUDIO = Deno.env.get('TRIM_AUDIO') === 'true'; // Trimming the audio reduces processing time
const TRIM_OFFSET = parseInt(Deno.env.get('TRIM_OFFSET') || '55', 10); // seconds
const TRIM_LENGTH = parseInt(Deno.env.get('TRIM_LENGTH') || '45', 10); // seconds
const SUPPORTED_FORMATS = ['.mp3', '.ogg'];

export interface IRecognizedData {
  artist: string;
  title: string;
}

export default class SongService {
  private tmpFilePath: string | undefined = undefined;
  private recognizedData: IRecognizedData | undefined = undefined;

  constructor(private path: string) {}

  private async exec(command: string, ...args: string[]): Promise<string> {
    const cmd = new Deno.Command(command, {
      args: args,
    });
    const { code, stdout, stderr } = await cmd.output();
    if (code !== 0) {
      throw new Error(`Command failed with code ${code}: ${stderr}`);
    }
    return new TextDecoder().decode(stdout);
  }

  public async preprocess(): Promise<void> {
    const extname = path.extname(this.path);

    if (!SUPPORTED_FORMATS.includes(extname)) throw new Error('Unsupported audio format.');
    if (!TRIM_AUDIO) return;

    try {
      await FileOps.ensureDirectoryExists(TEMP_PATH);
    } catch (err) {
      console.error(`Could not create temporary directory ${TEMP_PATH}: ${err}`);
      throw new Error('Internal Server Error.');
    }

    this.tmpFilePath = path.join(TEMP_PATH, `${crypto.randomUUID()}${extname}`);

    try {
      await this.exec(
        'ffmpeg',
        '-ss',
        `${TRIM_OFFSET}`,
        '-i',
        this.path,
        '-t',
        `${TRIM_LENGTH}`,
        '-c',
        'copy',
        this.tmpFilePath
      );
      if (!(await FileOps.fileExists(this.tmpFilePath))) throw new Error('Could not trim song.');

      const duration = await this.exec(
        'ffprobe',
        '-i',
        this.tmpFilePath,
        '-show_entries',
        'format=duration',
        '-v',
        'quiet',
        '-of',
        'csv=p=0'
      );

      const ceiledValue = Math.ceil(parseFloat(duration));
      if (!ceiledValue || ceiledValue < TRIM_LENGTH)
        throw new RangeError('Could not trim song or trimmed song part is too short.');
    } catch (err) {
      console.error(`Preprocessing for ${this.path} failed: ${err}`);
      throw new Error('Internal Server Error.');
    }
  }

  public async recognize(): Promise<IRecognizedData> {
    if (TRIM_AUDIO && !this.tmpFilePath) throw new Error('No path was loaded into the SongService.');

    try {
      const execResponse = await this.exec('songrec', 'audio-file-to-recognized-song', this.tmpFilePath || this.path);
      const response = JSON.parse(execResponse);

      if (!response.track) throw new Error('Could not recognize song.');

      this.recognizedData = { artist: response.track.subtitle, title: response.track.title };
    } catch (err) {
      console.error(`Could not recognize song ${this.path}: ${err}`);
      throw new Error('Could not recognize song.');
    }

    return this.recognizedData;
  }

  public async writeMetadata(): Promise<void> {
    if (!this.recognizedData) throw new Error('No metadata was found to write.');

    try {
      await NodeID3.update(this.recognizedData, this.path);
    } catch (err) {
      console.error(`Could not tag songfile ${this.path}: ${err}`);
      throw new Error('Could not tag the songfile.');
    }
  }

  public async cleanup(): Promise<void> {
    if (!TRIM_AUDIO || !this.tmpFilePath || !(await FileOps.fileExists(this.tmpFilePath))) return;

    await Deno.remove(this.tmpFilePath);
    this.tmpFilePath = undefined;
  }
}
