import { Drash, fs } from '../deps.ts';

import BaseResource from '../BaseResource.ts';

export default class RecognizeResource extends BaseResource {
  static paths = ['/v1/recognize/:mtaresource'];

  public async PUT(): Promise<Drash.Http.Response> {
    // TODO: Do we need extra security here so the user can't escape the resource folder?
    // (shouldn't really matter tho, since it's running in a container and requests come from the gameserver only...)
    if (!(await fs.exists(`/mta_resources/${this.request.getPathParam('mtaresource')}`)))
      return this.errorResponse(404, 'MTA resource was not found.');

    return this.successResponse(200, {
      ping: 'pong',
    });
  }
}
