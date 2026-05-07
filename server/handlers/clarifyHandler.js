/**
 * clarifyHandler.js
 *
 * Handles the "clarify" message type — Task 1 disambiguation resolution.
 *
 * Flow:
 *  1. User responds to a disambiguation question (voice: "后面那个" / "B" / direct click)
 *  2. Frontend sends { type: "clarify", sessionId, selectedId?, text? }
 *  3. This handler resolves the final plant from pending candidates and returns
 *     the same response format as a normal single-hit query.
 */

import { parseIntent, generateInfoResponse } from '../services/llm.js';
import { findById } from '../services/plantDb.js';
import {
  recordVisit,
  appendHistory,
  clearPendingDisambiguation,
} from '../services/session.js';

/**
 * @param {Object} msg   - { selectedId?, text?, sessionId }
 * @param {Object} session
 * @returns {Promise<Object>}
 */
export async function handleClarify(msg, session) {
  const { selectedId, text = '' } = msg;
  const pending = session.pendingDisambiguation;

  if (!pending || pending.length === 0) {
    return {
      type: 'error',
      speech: '没有待确认的植物，请先点击一株植物。',
    };
  }

  let resolvedId = null;

  // ── Direct ID provided (user clicked a label button on the UI)
  if (selectedId && pending.includes(selectedId)) {
    resolvedId = selectedId;
  }

  // ── Voice-based resolution: parse intent to extract position_hint or label
  if (!resolvedId && text) {
    const intent = await parseIntent(text, pending, session.visited, session.history);

    if (intent.position_hint === 'back' || intent.position_hint === 'right') {
      // "后面的" / "右边的" → last candidate (furthest from camera)
      resolvedId = pending[pending.length - 1];
    } else if (intent.position_hint === 'front' || intent.position_hint === 'left') {
      // "前面的" → first candidate (closest to camera)
      resolvedId = pending[0];
    } else if (intent.referent) {
      // "B" or a plant name
      const label = intent.referent.trim().toUpperCase();
      const labelIndex = label.charCodeAt(0) - 65; // 'A'=0, 'B'=1 …
      if (!isNaN(labelIndex) && labelIndex >= 0 && labelIndex < pending.length) {
        resolvedId = pending[labelIndex];
      } else {
        // Try matching by name substring
        resolvedId = pending.find((id) => {
          const plant = findById(id);
          return plant && plant.name.includes(intent.referent);
        }) ?? null;
      }
    }
  }

  // ── Fallback: two consecutive failures — surface click-button prompt
  if (!resolvedId) {
    return {
      type: 'clarify_retry',
      speech: '我还没理解您的意思，请直接点击屏幕上的标签来选择植物。',
      pending,
    };
  }

  // ── Successfully resolved
  clearPendingDisambiguation(session);

  const plant = findById(resolvedId);
  if (!plant) {
    return {
      type: 'error',
      speech: `抱歉，无法找到您选择的植物资料。`,
    };
  }

  recordVisit(session, plant.id, plant.name);

  const speech = await generateInfoResponse(plant, null, session.history);
  appendHistory(session, 'user', text || `选择了${plant.name}`);
  appendHistory(session, 'assistant', speech);

  return {
    type: 'response',
    cardType: 'default',
    plantId: plant.id,
    data: {
      id: plant.id,
      name: plant.name,
      scientific_name: plant.scientific_name,
      description: plant.description,
      attributes: plant.attributes,
      tags: plant.tags,
    },
    speech,
  };
}
