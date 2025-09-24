import { Drash } from 'drash';

export default function AuthMiddleware(request: Drash.Http.Request): void {
  if (request.headers.get('X-API-Key') !== Deno.env.get('API_KEY'))
    throw new Drash.Exceptions.HttpMiddlewareException(401, 'Unauthorized');
}
