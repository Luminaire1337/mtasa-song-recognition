import { Drash } from './deps.ts';

import AuthMiddleware from './middlewares/AuthMiddleware.ts';

import RecognizeResource from './resources/RecognizeResource.ts';

const server = new Drash.Http.Server({
  middleware: {
    before_request: [AuthMiddleware],
  },
  resources: [RecognizeResource],
  response_output: 'application/json',
});

await server.run({ hostname: '0.0.0.0', port: 3000 });
console.log('Server running on port 3000.');
