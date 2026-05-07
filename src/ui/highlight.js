/**
 * ui/highlight.js
 * Highlight / un-highlight a plant model in the A-Frame scene.
 *
 * Uses A-Frame's material component to add a colored tint.
 * Stores original material so it can be restored.
 */

/** @type {Map<string, string|null>} plantId → original material string */
const originalMaterials = new Map();

/**
 * Highlight a plant by ID (yellow glow).
 * @param {string} plantId
 * @param {string} [color]  - CSS colour string, default '#ffee58'
 */
export function highlightPlant(plantId, color = '#ffee58') {
  const el = document.querySelector(`#${CSS.escape(plantId)}`);
  if (!el) return;

  if (!originalMaterials.has(plantId)) {
    originalMaterials.set(plantId, el.getAttribute('material'));
  }
  el.setAttribute('material', `color: ${color}; emissive: ${color}; emissiveIntensity: 0.4`);
}

/**
 * Remove highlight from a plant, restoring its original material.
 * @param {string} plantId
 */
export function unhighlightPlant(plantId) {
  const el = document.querySelector(`#${CSS.escape(plantId)}`);
  if (!el) return;

  const original = originalMaterials.get(plantId);
  if (original) {
    el.setAttribute('material', original);
  } else {
    el.removeAttribute('material');
  }
  originalMaterials.delete(plantId);
}

/**
 * Clear all active highlights.
 */
export function clearAllHighlights() {
  for (const id of originalMaterials.keys()) {
    unhighlightPlant(id);
  }
}
