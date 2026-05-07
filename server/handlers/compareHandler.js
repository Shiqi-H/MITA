/**
 * compareHandler.js
 *
 * Handles cross-turn plant comparison — Task 2.
 *
 * Flow:
 *  1. LLM extracted intent: compare, with comparison_target = "大王莲"
 *  2. Look up plant1 (current hit) from DB
 *  3. Resolve plant2:
 *     a. First search session.visited for the comparison_target name
 *     b. Fallback: search the full plant DB by name/alias
 *     c. If still not found: return a fallback with a search-offer prompt
 *  4. Query both plants' data for the relevant attribute (interest_slot)
 *  5. Generate LLM comparison response
 *  6. Return "comparison" message with both plant data cards
 */

import { findById, findPlant } from '../services/plantDb.js';
import { findVisitedByName, appendHistory } from '../services/session.js';
import { generateCompareResponse } from '../services/llm.js';

/**
 * @param {Object} params
 * @param {string} params.currentPlantId
 * @param {string} params.comparisonTarget  - Plant name from LLM
 * @param {string|null} params.slot         - Attribute to compare
 * @param {Object} session
 * @returns {Promise<Object>}
 */
export async function handleCompare({ currentPlantId, comparisonTarget, slot }, session) {
  const plant1 = findById(currentPlantId);
  if (!plant1) {
    return {
      type: 'error',
      speech: '无法找到当前选中植物的资料，请重新点击。',
    };
  }

  // ── Resolve comparison target
  let plant2 = null;

  // 1. Search visited history first (persistent token)
  const visitedEntry = findVisitedByName(session, comparisonTarget);
  if (visitedEntry) {
    plant2 = findById(visitedEntry.plantId);
  }

  // 2. Fallback: search full database
  if (!plant2) {
    plant2 = findPlant(comparisonTarget);
  }

  // 3. Not found anywhere → fallback response
  if (!plant2) {
    return {
      type: 'fallback',
      plantId: plant1.id,
      options: [],
      speech: `您的历史记录中没有"${comparisonTarget}"，我也没有在数据库中找到这种植物。需要我为您展示${plant1.name}的详细信息吗？`,
    };
  }

  // ── Both plants found — generate comparison
  const speech = await generateCompareResponse(plant1, plant2, slot, session.history);

  appendHistory(session, 'user', `比较 ${plant1.name} 和 ${plant2.name} 的${slotLabel(slot)}`);
  appendHistory(session, 'assistant', speech);

  return {
    type: 'comparison',
    slot: slot ?? 'general',
    plant1: buildCompareCard(plant1, slot),
    plant2: buildCompareCard(plant2, slot),
    speech,
  };
}

/**
 * Build a card data object for the comparison panel.
 * @param {Object} plant
 * @param {string|null} slot
 * @returns {Object}
 */
function buildCompareCard(plant, slot) {
  const base = {
    id: plant.id,
    name: plant.name,
    scientific_name: plant.scientific_name,
    description: plant.description,
    tags: plant.tags,
  };

  if (slot === 'drought') {
    return { ...base, highlight: { label: '耐旱性', value: plant.attributes.drought_tolerance } };
  }
  if (slot === 'toxicity') {
    return { ...base, highlight: { label: '毒性', value: plant.attributes.toxicity } };
  }
  if (slot === 'medicinal') {
    return { ...base, highlight: { label: '药用价值', value: plant.medical_info?.summary ?? '暂无数据' } };
  }
  // General comparison
  return {
    ...base,
    attributes: plant.attributes,
  };
}

function slotLabel(slot) {
  const map = { drought: '耐旱性', toxicity: '毒性', medicinal: '药用价值', botanical: '植物学特征' };
  return map[slot] ?? '综合特征';
}
