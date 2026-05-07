/**
 * server/index.js
 * Express + WebSocket server entry point.
 *
 * WebSocket message protocol (JSON):
 *
 * CLIENT → SERVER:
 *   { type: "query",   sessionId, hits: string[], hitPositions: {[id]: {x,y,z}}, text: string, visited: VisitedEntry[] }
 *   { type: "clarify", sessionId, selectedId?: string, text?: string }
 *   { type: "ping" }
 *
 * SERVER → CLIENT:
 *   { type: "disambiguate", candidates: [...], speech: string }
 *   { type: "response",     cardType: string, plantId: string, data: {...}, speech: string }
 *   { type: "comparison",   slot: string, plant1: {...}, plant2: {...}, speech: string }
 *   { type: "fallback",     plantId: string, options: string[], speech: string }
 *   { type: "clarify_retry", speech: string, pending: string[] }
 *   { type: "error",        speech: string }
 *   { type: "pong" }
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config.js';
import { getOrCreateSession } from './services/session.js';
import { handleQuery } from './handlers/queryHandler.js';
import { handleClarify } from './handlers/clarifyHandler.js';

const app = express();
app.use(express.json());

// ── Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── HTTP server (WebSocket upgrades share this)
const httpServer = createServer(app);

// ── WebSocket server
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[ws] Client connected: ${clientIp}`);

  ws.on('message', async (rawData) => {
    let msg;

    // ── Parse incoming JSON
    try {
      msg = JSON.parse(rawData.toString());
    } catch {
      send(ws, { type: 'error', speech: '消息格式错误，请发送有效的 JSON。' });
      return;
    }

    // ── Keep-alive ping
    if (msg.type === 'ping') {
      send(ws, { type: 'pong' });
      return;
    }

    // ── Get or create session
    const session = getOrCreateSession(msg.sessionId);

    // Sync visited list from client if provided (client is the source of truth for visited)
    if (Array.isArray(msg.visited) && msg.visited.length > 0) {
      // Merge client-side visited into server session without duplicating
      for (const entry of msg.visited) {
        if (
          entry.plantId &&
          entry.plantName &&
          !session.visited.find((e) => e.plantId === entry.plantId)
        ) {
          session.visited.push(entry);
        }
      }
    }

    let response;

    try {
      switch (msg.type) {
        case 'query':
          response = await handleQuery(msg, session);
          break;

        case 'clarify':
          response = await handleClarify(msg, session);
          break;

        default:
          response = {
            type: 'error',
            speech: `未知消息类型：${msg.type}`,
          };
      }
    } catch (err) {
      console.error(`[ws] Handler error (type=${msg.type}):`, err.message);
      response = {
        type: 'error',
        speech: '系统内部发生错误，请稍后再试。',
      };
    }

    // Always include the sessionId so client can persist it
    response.sessionId = session.id;
    send(ws, response);
  });

  ws.on('close', () => {
    console.log(`[ws] Client disconnected: ${clientIp}`);
  });

  ws.on('error', (err) => {
    console.error(`[ws] Socket error: ${err.message}`);
  });
});

/**
 * Send a JSON message to a WebSocket client safely.
 * @param {import('ws').WebSocket} ws
 * @param {Object} payload
 */
function send(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

// ── Start listening
httpServer.listen(config.port, () => {
  console.log(`[server] MITA backend running on http://localhost:${config.port}`);
  console.log(`[server] WebSocket endpoint: ws://localhost:${config.port}`);
});
