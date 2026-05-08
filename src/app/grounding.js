import { parseIntent } from '../intent/llmClient.js';
import {
  findPlantByNameOrAlias,
  findVisitedPlantByNameOrAlias,
  getCurrentPlant,
  getDisplayName,
  getPlant,
} from './selectors.js';
import {
  incrementVoiceFailures,
  resetAmbiguity,
  resetVoiceFailures,
  setAmbiguityCandidates,
  state,
} from './state.js';
import { speak } from '../speech/speech.js';
import { renderComparePanel } from '../ui/comparePanel.js';
import { renderMedicalPanel } from '../ui/medicalPanel.js';
import {
  appendVoiceLog,
  clearFallbackActions,
  displayPlant,
  hideInteractionPanel,
  showInteractionPanel,
  updateHint,
} from '../ui/panels.js';
import { showSelectionRequiredFallback, showUnsupportedInterestFallback } from '../ui/fallbackPanel.js';
import { els } from '../ui/dom.js';
import { renderPlantPoiMarker } from '../scene/plantRenderer.js';

export async function handleQuery(text) {
  if (!text.trim()) return;
  appendVoiceLog(`STT: ${text}`);

  const context = {
    activeSceneId: state.activeSceneId,
    selectedPlantId: state.selectedPlantId,
    visitedPlantIds: state.visitedPlantIds,
    ambiguityCandidates: state.ambiguityCandidates,
  };
  const parsed = await parseIntent(text, context);
  if (parsed.parserFallback) appendVoiceLog('Intent parser fallback: local rules used.');

  if (state.ambiguityCandidates.length && parsed.intent === 'resolveAmbiguity') {
    handleAmbiguityReply(parsed);
    return;
  }

  if (state.ambiguityCandidates.length) {
    const candidateByName = findAmbiguityCandidateByName(text);
    if (candidateByName) {
      resolveAmbiguityById(candidateByName.id);
      return;
    }
    handleAmbiguityReply(parsed);
    return;
  }

  if (parsed.intent === 'identify') {
    handleIdentifyIntent();
    return;
  }

  if (parsed.intent === 'compare') {
    handleCompareIntent(parsed);
    return;
  }

  if (parsed.intent === 'queryAttribute') {
    handleAttributeIntent(parsed);
    return;
  }

  const namedPlant = findPlantByNameOrAlias(text);
  if (namedPlant) {
    displayPlant(namedPlant);
    speak(`${getDisplayName(namedPlant)} information is shown.`);
    updateHint(`Focused referent: ${getDisplayName(namedPlant)}.`);
    return;
  }

  handleUnknownIntent();
}

export function promptAmbiguity(candidateIds) {
  const candidates = candidateIds
    .map((id) => getPlant(id))
    .filter(Boolean)
    .map((plant, index) => ({
      id: plant.id,
      marker: String.fromCharCode(65 + index),
    }));

  setAmbiguityCandidates(candidates);
  clearCandidateHighlights();
  candidates.forEach(({ id, marker }) => {
    const plant = getPlant(id);
    renderPlantPoiMarker(els.container, plant, marker, () => resolveAmbiguityById(plant.id));
  });

  const letters = candidates.map(({ marker }) => marker).join(' / ');
  const body = document.createElement('div');
  body.innerHTML = `
    <p>Multiple plants were detected. Type or say one of these letters.</p>
    <div class="ambiguity-letters">${letters}</div>
  `;
  showInteractionPanel('Referential Ambiguity', body);
  speak(`Multiple plants were detected. Type or say ${letters.replaceAll(' / ', ', ')}.`);
  updateHint('Ambiguity pending. Choose a letter marker.');
}

export function resolveAmbiguityById(id) {
  const plant = getPlant(id);
  if (!plant) return;
  resetAmbiguity();
  clearCandidateHighlights();
  clearFallbackActions();
  hideInteractionPanel();
  displayPlant(plant);
  speak(`Selected ${getDisplayName(plant)}. Here is the plant information.`);
  updateHint(`Selected ${getDisplayName(plant)}.`);
}

export function handleAmbiguityReply(parsed) {
  const candidates = state.ambiguityCandidates;
  if (!candidates.length) return;

  const candidate =
    candidates.find((item) => parsed.marker && item.marker === parsed.marker);

  if (candidate) {
    resolveAmbiguityById(candidate.id);
    return;
  }

  const failures = incrementVoiceFailures();
  const letters = candidates.map(({ marker }) => marker).join(', ');
  speak(`I could not match that answer. Please choose ${letters}.`);
  if (failures >= 2) updateHint(`Choose one of these markers: ${letters}.`);
}

export function clearCandidateHighlights() {
  els.container.querySelectorAll('[data-candidate="true"]').forEach((node) => node.remove());
}

function handleIdentifyIntent() {
  if (state.activeSceneId === 'scene-1') {
    promptAmbiguity(['lavender', 'nephrolepis']);
    return;
  }

  const current = getCurrentPlant();
  if (current) {
    displayPlant(current);
    speak(`${getDisplayName(current)} information is shown.`);
    updateHint(`Focused referent: ${getDisplayName(current)}.`);
    return;
  }

  showSelectionRequiredFallback();
  speak('Please select a plant first.');
}

function handleCompareIntent(parsed) {
  const left = getCurrentPlant();
  if (!left) {
    showSelectionRequiredFallback();
    speak('Please select a plant first.');
    return;
  }

  const targetText = parsed.target2Name || 'giant water lily';
  const visitedMatch = findVisitedPlantByNameOrAlias(targetText);
  const globalMatch = findPlantByNameOrAlias(targetText);
  const right = visitedMatch || globalMatch;

  if (!right) {
    showInteractionPanel('Comparison target not found', `I could not find ${targetText}. Please select another plant or use a known plant name.`);
    speak(`I could not find ${targetText}.`);
    return;
  }

  const note = visitedMatch
    ? ''
    : `${getDisplayName(right)} was not in your visited history, so I used the plant database instead.`;

  displayPlant(left, 'compare');
  renderComparePanel(left, right, parsed.attribute, note);
  speak(`Yes. ${getDisplayName(left)} is more drought tolerant than ${getDisplayName(right)}.`);
  updateHint(`Compare panel opened: ${getDisplayName(left)} versus ${getDisplayName(right)}.`);
}

function handleAttributeIntent(parsed) {
  const plant = getCurrentPlant();
  if (!plant) {
    showSelectionRequiredFallback();
    speak('Please select a plant first.');
    return;
  }

  if (parsed.interest === 'medicinalValue') {
    resetVoiceFailures();
    clearFallbackActions();
    displayPlant(plant, 'medical');
    renderMedicalPanel(plant);
    speak(`${getDisplayName(plant)} medicinal value: ${plant.medicalInfo}`);
    updateHint('Medical focus panel rendered.');
    return;
  }

  showUnsupportedInterestFallback({
    onMedical: () => handleAttributeIntent({ interest: 'medicinalValue' }),
    onBotanical: () => {
      displayPlant(plant);
      speak(`${getDisplayName(plant)} botanical features are shown.`);
    },
  });
  speak('I do not have that information. I can show medicinal value or botanical features.');
}

function handleUnknownIntent() {
  const failures = incrementVoiceFailures();
  speak('I could not identify a clear target. Please click the scene or add more detail.');
  updateHint('No clear intent found. Try: What is this?');
  if (failures >= 2) {
    updateHint('Click a plant in the 3D scene, or ask about a selected plant.');
  }
}

export function cancelAmbiguity() {
  resetAmbiguity();
  clearCandidateHighlights();
  clearFallbackActions();
  hideInteractionPanel();
  updateHint('Ambiguity selection canceled.');
}

function findAmbiguityCandidateByName(text) {
  const namedPlant = findPlantByNameOrAlias(text);
  if (!namedPlant) return null;
  return state.ambiguityCandidates.find((candidate) => candidate.id === namedPlant.id) ?? null;
}
