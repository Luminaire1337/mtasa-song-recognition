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

  // deno-lint-ignore no-explicit-any
  protected successResponse(statusCode: number, response: Record<string, any>): Drash.Http.Response {
    this.response.status_code = statusCode;
    this.response.body = {
      success: true,
      ...response,
    };
    return this.response;
  }
}
