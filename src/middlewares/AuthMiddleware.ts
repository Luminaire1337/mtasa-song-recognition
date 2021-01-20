import { Drash } from '../deps.ts';

export default function AuthMiddleware(request: Drash.Http.Request, response?: Drash.Http.Response): void {
  // TODO: Filter remote requests only
  // throw new Drash.Exceptions.HttpMiddlewareException(400, 'Middleware Test');
}
