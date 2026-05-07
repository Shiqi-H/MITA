/**
 * ws-client.js
 * WebSocket client with auto-reconnect and message routing.
 *
 * Usage:
 *   import { wsClient } from './ws-client.js';
 *   wsClient.on('response', (msg) => { ... });
 *   wsClient.send({ type: 'query', ... });
 */

const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
const RECONNECT_DELAY_MS = 3000;
const PING_INTERVAL_MS = 25000;

class WSClient extends EventTarget {
  constructor() {
    super();
    this._ws = null;
    this._sessionId = sessionStorage.getItem('mita_session_id') || null;
    this._queue = [];
    this._pingTimer = null;
    this._connect();
  }

  get sessionId() {
    return this._sessionId;
  }

  _connect() {
    this._ws = new WebSocket(WS_URL);

    this._ws.addEventListener('open', () => {
      console.log('[ws] Connected');
      this._startPing();
      // Flush queued messages
      while (this._queue.length > 0) {
        this._ws.send(this._queue.shift());
      }
      this.dispatchEvent(new CustomEvent('connected'));
    });

    this._ws.addEventListener('message', (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        console.warn('[ws] Non-JSON message received:', event.data);
        return;
      }

      if (msg.type === 'pong') return;

      // Persist session ID
      if (msg.sessionId && msg.sessionId !== this._sessionId) {
        this._sessionId = msg.sessionId;
        sessionStorage.setItem('mita_session_id', msg.sessionId);
      }

      this.dispatchEvent(new CustomEvent(msg.type, { detail: msg }));
      this.dispatchEvent(new CustomEvent('message', { detail: msg }));
    });

    this._ws.addEventListener('close', () => {
      console.log(`[ws] Disconnected. Reconnecting in ${RECONNECT_DELAY_MS}ms…`);
      this._stopPing();
      this.dispatchEvent(new CustomEvent('disconnected'));
      setTimeout(() => this._connect(), RECONNECT_DELAY_MS);
    });

    this._ws.addEventListener('error', (err) => {
      console.error('[ws] Error:', err);
    });
  }

  /**
   * Register a handler for a specific message type.
   * @param {string} type
   * @param {Function} handler  - Receives the full message object
   * @returns {Function} Unsubscribe function
   */
  on(type, handler) {
    const listener = (e) => handler(e.detail);
    this.addEventListener(type, listener);
    return () => this.removeEventListener(type, listener);
  }

  /**
   * Send a message to the server, queuing if not yet connected.
   * Automatically injects sessionId and visited list.
   * @param {Object} payload
   * @param {VisitedEntry[]} [visited]
   */
  send(payload, visited = []) {
    const msg = JSON.stringify({
      ...payload,
      sessionId: this._sessionId,
      visited,
    });

    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(msg);
    } else {
      this._queue.push(msg);
    }
  }

  _startPing() {
    this._pingTimer = setInterval(() => {
      if (this._ws?.readyState === WebSocket.OPEN) {
        this._ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, PING_INTERVAL_MS);
  }

  _stopPing() {
    clearInterval(this._pingTimer);
  }
}

export const wsClient = new WSClient();
