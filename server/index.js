import { createServer } from 'node:http';
import { config } from './config.js';
import { clarifyHandler } from './handlers/clarifyHandler.js';
import { compareHandler } from './handlers/compareHandler.js';
import { disambiguationHandler, infoHandler, queryHandler, sceneHandler } from './handlers/queryHandler.js';
import { getLlmStatus, startLlmStatusMonitor } from './services/llmStatus.js';

const routes = {
  'GET /api/health': (_req, res) => res.json({ ok: true, model: config.openai.model }),
  'GET /api/llm-status': async (_req, res) => res.json(await getLlmStatus()),
  'POST /api/parse-intent': queryHandler,
  'POST /api/generate-info': infoHandler,
  'POST /api/generate-disambiguation': disambiguationHandler,
  'POST /api/generate-scene': sceneHandler,
  'POST /api/clarify': clarifyHandler,
  'POST /api/compare': compareHandler,
};

const server = createServer(async (request, response) => {
  const routeKey = `${request.method} ${new URL(request.url, `http://${request.headers.host}`).pathname}`;
  const handler = routes[routeKey];

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (!handler) {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  try {
    const body = request.method === 'POST' ? await readJsonBody(request) : {};
    await handler({ body }, { json: (payload) => sendJson(response, 200, payload) });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.listen(config.port, () => {
  console.log(`MITA intent server listening on http://localhost:${config.port}`);
  startLlmStatusMonitor();
});

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json',
  });
  response.end(statusCode === 204 ? '' : JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
    });
    request.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}
