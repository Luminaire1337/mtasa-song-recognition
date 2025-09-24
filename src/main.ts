import { Drash } from 'drash';

import AuthMiddleware from './middlewares/AuthMiddleware.ts';

import RecognizeResource from './resources/RecognizeResource.ts';

if (!Deno.env.get('API_KEY')) throw new ReferenceError('API_KEY environment variable is not set.');

const server = new Drash.Http.Server({
  middleware: {
    before_request: [AuthMiddleware],
  },
  resources: [RecognizeResource],
  response_output: 'application/json',
});

await server.run({ hostname: '0.0.0.0', port: 3000 });
console.log('Server running on port 3000.');
