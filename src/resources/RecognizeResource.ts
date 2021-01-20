import { Drash } from '../deps.ts';

export default class RecognizeResource extends Drash.Http.Resource {
  static paths = ['/v1/recognize/:mtaresource'];

  public GET() {
    this.response.body = {
      ping: 'pong',
    };
    return this.response;
  }
}
