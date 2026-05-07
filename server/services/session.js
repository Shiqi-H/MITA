import { randomUUID } from 'crypto';

/**
 * @typedef {Object} VisitedEntry
 * @property {string} plantId
 * @property {string} plantName
 * @property {number} timestamp
 */

/**
 * @typedef {Object} Session
 * @property {string} id
 * @property {VisitedEntry[]} visited   - All entities the user has interacted with
 * @property {Object[]} history         - Conversation turns [{role, content}]
 * @property {string|null} pendingDisambiguation - Plant IDs awaiting user choice
 * @property {number} createdAt
 * @property {number} lastActiveAt
 */

/** @type {Map<string, Session>} */
const sessions = new Map();

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create a session.
 * @param {string} [sessionId]
 * @returns {Session}
 */
export function getOrCreateSession(sessionId) {
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    session.lastActiveAt = Date.now();
    return session;
  }
  const id = sessionId || randomUUID();
  /** @type {Session} */
  const session = {
    id,
    visited: [],
    history: [],
    pendingDisambiguation: null,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

/**
 * Add a plant to the session's visited list (deduplicates, moves to front).
 * @param {Session} session
 * @param {string} plantId
 * @param {string} plantName
 */
export function recordVisit(session, plantId, plantName) {
  // Remove existing entry if present
  session.visited = session.visited.filter((e) => e.plantId !== plantId);
  // Prepend as most-recent
  session.visited.unshift({ plantId, plantName, timestamp: Date.now() });
}

/**
 * Append a conversation turn to session history.
 * @param {Session} session
 * @param {'user'|'assistant'} role
 * @param {string} content
 */
export function appendHistory(session, role, content) {
  session.history.push({ role, content });
  // Keep only the last 20 turns to control token usage
  if (session.history.length > 20) {
    session.history = session.history.slice(-20);
  }
}

/**
 * Find a previously visited plant by name/alias within a session.
 * @param {Session} session
 * @param {string} nameHint  - Name hint from LLM extraction
 * @returns {VisitedEntry|null}
 */
export function findVisitedByName(session, nameHint) {
  if (!nameHint) return null;
  const query = nameHint.trim().toLowerCase();
  return (
    session.visited.find((e) => e.plantName.toLowerCase().includes(query)) ??
    null
  );
}

/**
 * Store candidate IDs pending disambiguation.
 * @param {Session} session
 * @param {string[]} candidateIds
 */
export function setPendingDisambiguation(session, candidateIds) {
  session.pendingDisambiguation = candidateIds;
}

/**
 * Clear pending disambiguation state.
 * @param {Session} session
 */
export function clearPendingDisambiguation(session) {
  session.pendingDisambiguation = null;
}

// Periodic cleanup of expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActiveAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);
