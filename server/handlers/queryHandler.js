/**
 * queryHandler.js
 *
 * Handles the "query" message type — the primary entry point for Task 1 & Task 3.
 *
 * Flow:
 *  1. Receive { hits[], text, sessionId, visited[] }
 *  2. If hits.length > 1 → ambiguity detected (Task 1 branch)
 *     → Sort by depth (z-axis), generate A/B candidates
 *     → Return "disambiguate" message + TTS question
 *  3. If hits.length === 1 → single target
 *     → Parse intent with LLM
 *     → If compare intent → delegate to compareHandler
 *     → If query_attribute with interest_slot → Task 3 (dynamic card)
 *     → Otherwise → default info card
 */

import {
  parseIntent,
  generateInfoResponse,
  generateDisambiguationQuestion,
  generateFallbackResponse,
} from '../services/llm.js';
import { findById, findPlant, toCandidate } from '../services/plantDb.js';
import {
  recordVisit,
  appendHistory,
  setPendingDisambiguation,
} from '../services/session.js';
import { handleCompare } from './compareHandler.js';

/**
 * Map interest_slot to cardType for the frontend renderer.
 * @type {Record<string, string>}
 */
const SLOT_TO_CARD = {
  medicinal: 'medical',
  botanical: 'botanical',
  toxicity: 'default',
  drought: 'default',
  feng_shui: 'default',
};

/**
 * Slots that are considered valid for database lookup.
 */
const VALID_SLOTS = ['medicinal', 'botanical', 'toxicity', 'drought', 'feng_shui'];

/**
 * @param {Object} msg   - Parsed WebSocket message from client
 * @param {Object} session
 * @returns {Promise<Object>} - Response message to send back to client
 */
export async function handleQuery(msg, session) {
  const { hits = [], text = '', hitPositions = {} } = msg;

  // ──────────────────────────────────────────
  // TASK 1: Ambiguity — multiple raycaster hits
  // ──────────────────────────────────────────
  if (hits.length > 1) {
    // Sort candidates by depth: the hit closest to camera (smallest z) = "front"
    const sorted = [...hits].sort((a, b) => {
      const za = hitPositions[a]?.z ?? 0;
      const zb = hitPositions[b]?.z ?? 0;
      return za - zb; // ascending → front first
    });

    const candidates = sorted.map((id, index) => {
      const plant = findById(id);
      const label = String.fromCharCode(65 + index); // A, B, C…
      const positionDesc = index === 0 ? '前面' : index === sorted.length - 1 ? '后面' : '中间';
      return {
        id,
        label,
        name: plant ? plant.name : id,
        positionDesc,
        summary: plant ? toCandidate(plant) : null,
      };
    });

    // Store candidate IDs in session so clarifyHandler can resolve them
    setPendingDisambiguation(session, sorted);

    // Generate TTS clarification question
    const speech = await generateDisambiguationQuestion(candidates);

    return {
      type: 'disambiguate',
      candidates: candidates.map(({ id, label, name, positionDesc, summary }) => ({
        id,
        label,
        name,
        positionDesc,
        summary,
      })),
      speech,
    };
  }

  // ──────────────────────────────────────────
  // Single hit — parse intent
  // ──────────────────────────────────────────
  if (hits.length === 0) {
    return {
      type: 'error',
      speech: '我没有检测到您点击了哪株植物，请重新点击一下。',
    };
  }

  const targetId = hits[0];
  const plant = findById(targetId);

  if (!plant) {
    return {
      type: 'error',
      speech: `抱歉，我没有找到关于 ${targetId} 的资料。`,
    };
  }

  // Record visit in session
  recordVisit(session, plant.id, plant.name);

  // Parse intent
  const intent = await parseIntent(text, hits, session.visited, session.history);

  // ── TASK 2: Compare intent → delegate
  if (intent.intent === 'compare' && intent.comparison_target) {
    return handleCompare(
      { currentPlantId: targetId, comparisonTarget: intent.comparison_target, slot: intent.interest_slot },
      session
    );
  }

  // ── TASK 3 / General: query_info or query_attribute
  const slot = VALID_SLOTS.includes(intent.interest_slot) ? intent.interest_slot : null;

  // Check if requested slot has data
  if (slot === 'feng_shui' && !plant.feng_shui_info) {
    const availableSlots = ['medicinal', 'botanical'].filter((s) => {
      if (s === 'medicinal') return !!plant.medical_info?.summary;
      if (s === 'botanical') return !!plant.botanical_info;
      return false;
    });
    const speech = await generateFallbackResponse(plant, '风水', availableSlots.map(labelOf));
    return {
      type: 'fallback',
      plantId: plant.id,
      options: availableSlots,
      speech,
    };
  }

  // Determine card type for frontend renderer
  const cardType = slot ? (SLOT_TO_CARD[slot] ?? 'default') : 'default';

  // Generate TTS response
  const speech = await generateInfoResponse(plant, slot, session.history);

  // Record assistant turn in history
  appendHistory(session, 'user', text);
  appendHistory(session, 'assistant', speech);

  return {
    type: 'response',
    cardType,
    plantId: plant.id,
    data: buildCardData(plant, slot),
    speech,
  };
}

/**
 * Build card data payload according to the requested slot.
 * @param {Object} plant
 * @param {string|null} slot
 * @returns {Object}
 */
function buildCardData(plant, slot) {
  const base = {
    id: plant.id,
    name: plant.name,
    scientific_name: plant.scientific_name,
    description: plant.description,
    tags: plant.tags,
  };

  if (slot === 'medicinal') {
    return { ...base, medical_info: plant.medical_info, attributes: plant.attributes };
  }
  if (slot === 'botanical') {
    return { ...base, botanical_info: plant.botanical_info, attributes: plant.attributes };
  }
  // Default: show general attributes
  return { ...base, attributes: plant.attributes };
}

/** Human-readable label for interest slots. */
function labelOf(slot) {
  const map = { medicinal: '药用价值', botanical: '植物学特征', toxicity: '毒性', drought: '耐旱性', feng_shui: '风水' };
  return map[slot] ?? slot;
}
