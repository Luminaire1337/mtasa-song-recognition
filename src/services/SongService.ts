import { OutputMode } from 'https://deno.land/x/exec@0.0.5/mod.ts';
import { exec, fs, path, v4 } from '../deps.ts';

const TEMP_PATH = `/tmp_songs/`;
const TRIM_OFFSET = 60; // seconds
const TRIM_LENGTH = 10; // seconds

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
    if (!this.tmpFilePath) throw new Error('No path was loaded into the SongService.');

    try {
      const execResponse = await exec(`songrec audio-file-to-recognized-song ${this.tmpFilePath}`, {
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
    
  }

  public async cleanup(): Promise<void> {
    if (!this.tmpFilePath) return;

    await Deno.remove(this.tmpFilePath);
    this.tmpFilePath = undefined;
  }
}
