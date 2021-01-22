import { exec, fs, OutputMode, path, v4 } from '../deps.ts';

const TEMP_PATH = `/tmp_songs/`;
const TRIM_AUDIO = false; // Trimming the audio reduces processing time
const TRIM_OFFSET = 55; // seconds
const TRIM_LENGTH = 45; // seconds
const SUPPORTED_FORMATS = ['.mp3', '.ogg'];

export interface IRecognizedData {
  artist: string;
  title: string;
}

export default class SongService {
  private tmpFilePath: string | undefined = undefined;
  private recognizedData: IRecognizedData | undefined = undefined;

  constructor(private path: string) {}

  public async preprocess(): Promise<void> {
    const extname = path.extname(this.path);

    if (!SUPPORTED_FORMATS.includes(extname)) throw new Error('Unsupported audio format.');
    if (!TRIM_AUDIO) return;

    this.tmpFilePath = path.join(TEMP_PATH, `${v4.generate()}${extname}`);

    try {
      await exec(`ffmpeg -ss ${TRIM_OFFSET} -i ${this.path} -t ${TRIM_LENGTH} -c copy ${this.tmpFilePath}`);
      if (!(await fs.exists(this.tmpFilePath))) throw new Error('Could not trim song. (1)');

      // https://github.com/gpasq/deno-exec#does-piping-work
      const duration = await exec(`bash -c "ffprobe -i ${this.tmpFilePath} -show_format -v quiet | sed -n 's/duration=//p'"`, {
        output: OutputMode.Capture,
      });

      const ceiledValue = Math.ceil(parseFloat(duration.output));
      if (!ceiledValue || ceiledValue < TRIM_LENGTH)
        throw new RangeError('Could not trim song or trimmed song part is too short. (2)');
    } catch (err) {
      console.error(err);
      throw new Error('Internal Server Error (1)');
    }
  }

  public async recognize(): Promise<IRecognizedData> {
    if (TRIM_AUDIO && !this.tmpFilePath) throw new Error('No path was loaded into the SongService.');

    try {
      const execResponse = await exec(`songrec audio-file-to-recognized-song ${this.tmpFilePath || this.path}`, {
        output: OutputMode.Capture,
      });
      const response = JSON.parse(execResponse.output);

      if (!response.track) throw new Error('Could not recognize song.');

      this.recognizedData = { artist: response.track.subtitle, title: response.track.title };
    } catch (err) {
      console.error(err);
      throw new Error('Could not recognize song.');
    }

    return this.recognizedData;
  }

  public async writeMetadata(): Promise<void> {
    if (!this.recognizedData) throw new Error('No metadata was found to write.');

    try {
      const response = await exec(
        `kid3-cli -c "set artist '${SongService.sanitize(this.recognizedData.artist)}'" -c "set title '${SongService.sanitize(
          this.recognizedData.title
        )}'" -c "save" ${this.path}`
      );
    } catch (err) {
      console.log(err);
      throw new Error('Could not tag the songfile.');
    }
  }

  public async cleanup(): Promise<void> {
    if (!TRIM_AUDIO || !this.tmpFilePath || !(await fs.exists(this.tmpFilePath))) return;

    await Deno.remove(this.tmpFilePath);
    this.tmpFilePath = undefined;
  }

  private static sanitize(arg: string): string {
    return arg.replaceAll("'", "\\'");
  }
}
