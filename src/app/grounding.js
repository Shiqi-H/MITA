import { generateCompareSpeech, generateDisambiguationSpeech, generateInfoSpeech, parseIntent } from '../intent/llmClient.js';
import {
  findPlantByNameOrAlias,
  getCurrentScenePlantIds,
  findVisitedPlantByNameOrAlias,
  getCurrentPlant,
  getPreviousSelectedPlant,
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
} from '../ui/panels.js';
import { highlightPlant, highlightOnly, clearAllHighlights, DISAMBIG_COLORS } from '../ui/highlight.js';
import { showSelectionRequiredFallback, showUnsupportedInterestFallback } from '../ui/fallbackPanel.js';
import { els } from '../ui/dom.js';
import { hideDisambiguationOverlay, showDisambiguationOverlay } from '../ui/overlay.js';
import { getVisiblePlantIds } from '../scene/visiblePlants.js';

const DEFAULT_QUERY_PLACEHOLDER = 'Ask about this plant...';
const AMBIGUITY_FALLBACK_PLACEHOLDER = 'Please click on the plant you want.';

export async function handleQuery(text) {
  if (!text.trim()) return;
  appendVoiceLog(`User: ${text}`);

  const context = {
    activeSceneId: state.activeSceneId,
    selectedPlantId: state.selectedPlantId,
    visitedPlantIds: state.visitedPlantIds,
    ambiguityCandidates: state.ambiguityCandidates,
  };
  const parsed = await parseIntent(text, context);

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
    handleCompareIntent(parsed, text);
    return;
  }

  if (parsed.intent === 'queryAttribute') {
    handleAttributeIntent(parsed, text);
    return;
  }

  const namedPlant = findPlantByNameOrAlias(text);
  if (namedPlant) {
    displayPlant(namedPlant);
    speak(`${getDisplayName(namedPlant)} information is shown.`);
    return;
  }

  handleUnknownIntent();
}

export function promptAmbiguity(candidateIds) {
  setQueryPlaceholder(DEFAULT_QUERY_PLACEHOLDER);

  const candidates = candidateIds
    .map((id) => getPlant(id))
    .filter(Boolean)
    .map((plant, index) => ({
      id: plant.id,
      plant,
      marker: String.fromCharCode(65 + index),
    }));

  setAmbiguityCandidates(candidates);
clearCandidateHighlights();
candidates.forEach((c, i) => {
  highlightPlant(c.id, DISAMBIG_COLORS[i % DISAMBIG_COLORS.length]);
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
  intro.textContent = 'Multiple plants were detected. Choose one candidate, or type/say its letter.';

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
    `Multiple plants were detected. Type or say ${letters.replaceAll(' / ', ', ')}.`,
  );
  generatedSpeech.then(speak);
}

export async function resolveAmbiguityById(id) {
  const plant = getPlant(id);
  if (!plant) return;
  selectPlantById(id);
  const generatedSpeech = await generateInfoSpeech({ plant, question: 'Introduce this selected plant.' });
  speak(generatedSpeech || `Selected ${getDisplayName(plant)}. Here is the plant information.`);
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
  applyAmbiguityFailure(failures);
}

export function handleAmbiguityRecognitionFailure() {
  if (!state.ambiguityCandidates.length) return;
  const failures = incrementVoiceFailures();
  applyAmbiguityFailure(failures);
}

function applyAmbiguityFailure(failures) {
  const letters = state.ambiguityCandidates.map(({ marker }) => marker).join(', ');
  speak(`I could not match that answer. Please choose ${letters}.`);
  if (failures >= 2) {
    setQueryPlaceholder(AMBIGUITY_FALLBACK_PLACEHOLDER);
  }
}

export function clearCandidateHighlights() {
  hideDisambiguationOverlay(els.disambiguationLayer);
}

function handleIdentifyIntent() {
  const visiblePlantIds = getVisiblePlantIds({
    container: els.container,
    camera: els.scene.camera,
  });
  const scenePlantIds = getCurrentScenePlantIds();

  if (visiblePlantIds.length >= 2) {
    promptAmbiguity(visiblePlantIds);
    return;
  }

  if (scenePlantIds.length >= 2) {
    promptAmbiguity(scenePlantIds);
    return;
  }

  if (visiblePlantIds.length === 1) {
    selectPlantById(visiblePlantIds[0], { announce: true });
    return;
  }

  showSelectionRequiredFallback();
  speak('I cannot see a plant clearly. Please move the view or click a plant.');
}

async function handleCompareIntent(parsed, text = '') {
  const left = resolvePlantReferent(parsed.target1 || 'currentSelection', parsed.target1Name || '');
  if (!left) {
    showSelectionRequiredFallback();
    speak('Please select a plant first.');
    return;
  }

  const namedTargetFromText = findPlantByNameOrAlias(text);
  const target2Referent = namedTargetFromText ? 'namedPlant' : parsed.target2Referent || 'previousSelection';
  const targetText = namedTargetFromText ? getDisplayName(namedTargetFromText) : parsed.target2Name || '';
  const right = resolvePlantReferent(target2Referent, targetText);
  const attribute = parsed.attribute || 'droughtTolerance';

  if (attribute !== 'droughtTolerance') {
    speak('Comparison for that attribute is not supported yet. I can compare drought tolerance.');
    return;
  }

  if (!right) {
    if (target2Referent === 'previousSelection') {
      showInteractionPanel('Previous plant not found', 'Please select at least two different plants before comparing with the previous selection.');
      speak('Please select at least two different plants before comparing with the previous selection.');
      return;
    }

    showInteractionPanel('Comparison target not found', `I could not find ${targetText}. Please select another plant or use a known plant name.`);
    speak(`I could not find ${targetText}.`);
    return;
  }

  const note = target2Referent === 'previousSelection'
    ? 'Compared with the previously selected plant.'
    : findVisitedPlantByNameOrAlias(targetText)
    ? ''
    : `${getDisplayName(right)} was not in your visited history, so I used the plant database instead.`;

  displayPlant(left, 'compare');
  renderComparePanel(left, right, attribute, note);
  const generatedSpeech = await generateCompareSpeech({
    left,
    right,
    attribute,
    history: state.visitedPlantIds,
  });
  speak(generatedSpeech || getCompareFallbackSpeech(left, right));
}

async function handleAttributeIntent(parsed, text = '') {
  const plant = resolveAttributeTarget(parsed, text);
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
    const generatedSpeech = await generateInfoSpeech({
      plant,
      question: 'What is the medicinal value of this plant?',
      interest: parsed.interest,
      history: state.visitedPlantIds,
    });
    speak(generatedSpeech || `${getDisplayName(plant)} medicinal value: ${plant.medicalInfo}`);
    return;
  }

  showUnsupportedInterestFallback({
    onMedical: () => handleAttributeIntent({ ...parsed, interest: 'medicinalValue' }, text),
    onBotanical: () => {
      displayPlant(plant);
      speak(`${getDisplayName(plant)} botanical features are shown.`);
    },
  });
  speak('I do not have that information. I can show medicinal value or botanical features.');
}

function resolveAttributeTarget(parsed, text) {
  const parsedTarget = parsed.targetPlantName ? findPlantByNameOrAlias(parsed.targetPlantName) : null;
  if (parsedTarget) return parsedTarget;
  const textTarget = findPlantByNameOrAlias(text);
  if (textTarget) return textTarget;
  return resolvePlantReferent(parsed.referent || 'currentSelection', parsed.targetPlantName || '');
}

function resolvePlantReferent(referent, targetText = '') {
  if (referent === 'previousSelection') return getPreviousSelectedPlant();
  if (referent === 'namedPlant') {
    return findVisitedPlantByNameOrAlias(targetText) || findPlantByNameOrAlias(targetText);
  }
  return getCurrentPlant();
}

function getCompareFallbackSpeech(left, right) {
  return `${getDisplayName(left)} and ${getDisplayName(right)} are compared by drought tolerance.`;
}

function awaitGeneratedSpeech(promise, fallback) {
  return promise.then((speechText) => speechText || fallback);
}

function handleUnknownIntent() {
  speak('I could not identify a clear target. Please click the scene or add more detail.');
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

export function cancelAmbiguity() {
  resetAmbiguity();
  clearCandidateHighlights();
  clearAllHighlights();
  clearFallbackActions();
  hideInteractionPanel();
  setQueryPlaceholder(DEFAULT_QUERY_PLACEHOLDER);
}
function findAmbiguityCandidateByName(text) {
  const namedPlant = findPlantByNameOrAlias(text);
  if (!namedPlant) return null;
  return state.ambiguityCandidates.find((candidate) => candidate.id === namedPlant.id) ?? null;
}

function setQueryPlaceholder(text) {
  const input = els.globalQueryControls?.querySelector('input');
  if (input) input.placeholder = text;
}
