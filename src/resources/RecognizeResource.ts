import { Drash } from 'drash';
import * as path from 'jsr:@std/path';
import FileOps from '../FileOps.ts';

import BaseResource from '../BaseResource.ts';

import SongService, { IRecognizedData } from '../services/SongService.ts';

const RESOURCES_DIRECTORY = Deno.env.get('RESOURCES_DIRECTORY') || '/usr/src/resources/';

export default class RecognizeResource extends BaseResource {
  static paths = ['/v1/recognize'];

  public async PUT(): Promise<Drash.Http.Response> {
    const relativeSongPath = this.request.getUrlQueryParam('relativeSongPath');

    if (!relativeSongPath) return this.errorResponse(400, 'relativeSongPath query parameter is missing.');

    const fullPath = path.join(RESOURCES_DIRECTORY, decodeURIComponent(relativeSongPath));

    if (!fullPath.startsWith(RESOURCES_DIRECTORY) || fullPath === RESOURCES_DIRECTORY)
      return this.errorResponse(400, 'Invalid path.');
    if (!(await FileOps.fileExists(fullPath))) return this.errorResponse(404, 'MTA resource was not found.');

    const song = new SongService(fullPath);
    let recognizedData: IRecognizedData;

    try {
      await song.preprocess();
      recognizedData = await song.recognize();
      await song.writeMetadata();
    } catch (err: unknown) {
      if (err instanceof Error) {
        return this.errorResponse(500, err.message);
      }
      return this.errorResponse(500, 'Internal Server Error.');
    } finally {
      await song.cleanup();
    }

    return this.successResponse(200, recognizedData);
  }
}
