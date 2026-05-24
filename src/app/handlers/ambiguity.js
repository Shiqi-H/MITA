import { generateDisambiguationSpeech } from '../../intent/llmClient.js';
import { getMarkerForIndex } from '../../intent/intentParser.js';
import { speak } from '../../speech/speech.js';
import { els } from '../../ui/dom.js';
import { DISAMBIG_COLORS, clearAllHighlights, highlightPlant } from '../../ui/highlight.js';
import { clearFallbackActions, hideInteractionPanel, showInteractionPanel } from '../../ui/panels.js';
import { showDisambiguationOverlay } from '../../ui/overlay.js';
import { findPlantByNameOrAlias, getDisplayName, getPlant } from '../selectors.js';
import { incrementVoiceFailures, resetAmbiguity, setAmbiguityCandidates, state } from '../state.js';
import {
  AMBIGUITY_FALLBACK_PLACEHOLDER,
  DEFAULT_QUERY_PLACEHOLDER,
  awaitGeneratedSpeech,
  clearCandidateHighlights,
  selectPlantById,
  setQueryPlaceholder,
  speakPlantInfo,
} from './shared.js';

export function promptAmbiguity(candidateIds) {
  setQueryPlaceholder(DEFAULT_QUERY_PLACEHOLDER);

  const candidates = candidateIds
    .map((id) => getPlant(id))
    .filter(Boolean)
    .map((plant, index) => ({
      id: plant.id,
      plant,
      marker: getMarkerForIndex(index),
    }));

  setAmbiguityCandidates(candidates);
  clearCandidateHighlights();
  candidates.forEach((candidate, index) => {
    highlightPlant(candidate.id, DISAMBIG_COLORS[index % DISAMBIG_COLORS.length]);
  });
  showDisambiguationOverlay({
    candidates,
    layer: els.disambiguationLayer,
    scene: els.scene,
    onSelect: resolveAmbiguityById,
  });

  const letters = candidates.map(({ marker }) => marker).join(' / ');
  const body = document.createElement('div');
  const intro = document.createElement('p');
  intro.textContent = 'Multiple plants were detected. Choose one candidate, or type/speak its letter, then submit.';

  const choices = document.createElement('div');
  choices.className = 'ambiguity-choices';
  candidates.forEach(({ id, marker }) => {
    const plant = getPlant(id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ambiguity-choice';
    button.innerHTML = `
      <span>${marker}</span>
      <strong>${getDisplayName(plant)}</strong>
    `;
    button.addEventListener('click', () => resolveAmbiguityById(id));
    choices.appendChild(button);
  });

  body.append(intro, choices);
  showInteractionPanel('Referential Ambiguity', body);
  const generatedSpeech = awaitGeneratedSpeech(
    generateDisambiguationSpeech(candidates),
    `Multiple plants were detected. Choose ${letters.replaceAll(' / ', ', ')} or speak a letter, then submit it.`,
  );
  generatedSpeech.then(speak);
}

export async function resolveAmbiguityById(id) {
  const plant = getPlant(id);
  if (!plant) return;
  selectPlantById(id);
  await speakPlantInfo(plant, 'Introduce this selected plant.');
}

export function handleAmbiguityReply(parsed) {
  const candidates = state.ambiguityCandidates;
  if (!candidates.length) return;

  const candidate = candidates.find((item) => parsed.marker && item.marker === parsed.marker);

  if (candidate) {
    resolveAmbiguityById(candidate.id);
    return;
  }

  const failures = incrementVoiceFailures();
  applyAmbiguityFailure(failures);
}

export function handleAmbiguityRecognitionFailure() {
  if (!state.ambiguityCandidates.length) return;
  const failures = incrementVoiceFailures();
  applyAmbiguityFailure(failures);
}

export function findAmbiguityCandidateByName(text) {
  const namedPlant = findPlantByNameOrAlias(text);
  if (!namedPlant) return null;
  return state.ambiguityCandidates.find((candidate) => candidate.id === namedPlant.id) ?? null;
}

export function cancelAmbiguity() {
  resetAmbiguity();
  clearCandidateHighlights();
  clearAllHighlights();
  clearFallbackActions();
  hideInteractionPanel();
  setQueryPlaceholder(DEFAULT_QUERY_PLACEHOLDER);
}

function applyAmbiguityFailure(failures) {
  const letters = state.ambiguityCandidates.map(({ marker }) => marker).join(', ');
  speak(`I could not match that answer. Please choose ${letters}.`);
  if (failures >= 2) {
    setQueryPlaceholder(AMBIGUITY_FALLBACK_PLACEHOLDER);
  }
}
