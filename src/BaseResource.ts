import { Drash } from './deps.ts';

export default class BaseResource extends Drash.Http.Resource {
  protected errorResponse(statusCode: number, error: string): Drash.Http.Response {
    this.response.status_code = statusCode;
    this.response.body = {
      success: false,
      error,
    };
    return this.response;
  }

  protected successResponse(statusCode: number, response: Record<string, unknown>): Drash.Http.Response {
    this.response.status_code = statusCode;
    this.response.body = {
      success: true,
      ...response,
    };
    return this.response;
  }
}
