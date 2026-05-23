import { generateInfoSpeech } from '../../intent/llmClient.js';
import { speak } from '../../speech/speech.js';
import { highlightOnly } from '../../ui/highlight.js';
import { clearFallbackActions, displayPlant, hideInteractionPanel } from '../../ui/panels.js';
import { els } from '../../ui/dom.js';
import { hideDisambiguationOverlay } from '../../ui/overlay.js';
import {
  findPlantByNameOrAlias,
  findVisitedPlantByNameOrAlias,
  getCurrentPlant,
  getDisplayName,
  getPlant,
  getPreviousSelectedPlant,
} from '../selectors.js';
import { resetAmbiguity, state } from '../state.js';

export const DEFAULT_QUERY_PLACEHOLDER = 'Ask about this plant...';
export const AMBIGUITY_FALLBACK_PLACEHOLDER = 'Please click on the plant you want.';

export function setQueryPlaceholder(text) {
  const input = els.globalQueryControls?.querySelector('input');
  if (input) input.placeholder = text;
}

export async function speakPlantInfo(plant, question = '') {
  const generatedSpeech = await generateInfoSpeech({
    plant,
    question,
    history: state.visitedPlantIds,
  });
  speak(generatedSpeech || `${getDisplayName(plant)} information is shown.`);
}

export function resolvePlantReferent(referent, targetText = '') {
  if (referent === 'previousSelection') return getPreviousSelectedPlant();
  if (referent === 'namedPlant') {
    return findVisitedPlantByNameOrAlias(targetText) || findPlantByNameOrAlias(targetText);
  }
  return getCurrentPlant();
}

export function selectPlantById(id, { announce = false } = {}) {
  const plant = getPlant(id);
  if (!plant) return;

  resetAmbiguity();
  clearCandidateHighlights();
  clearFallbackActions();
  hideInteractionPanel();
  setQueryPlaceholder(DEFAULT_QUERY_PLACEHOLDER);
  highlightOnly(id);
  displayPlant(plant);

  if (announce) speak(`${getDisplayName(plant)} information is shown.`);
}

export function clearCandidateHighlights() {
  hideDisambiguationOverlay(els.disambiguationLayer);
}

export function awaitGeneratedSpeech(promise, fallback) {
  return promise.then((speechText) => speechText || fallback);
}
