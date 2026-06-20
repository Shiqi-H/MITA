import { generateInfoSpeech, generateSceneSpeech, parseIntent } from '../intent/llmClient.js';
import { speak } from '../speech/speech.js';
import { appendVoiceLog, displayPlant } from '../ui/panels.js';
import { findPlantByNameOrAlias, getCurrentPlant, getCurrentScenePlantIds, getDisplayName, getPlant } from './selectors.js';
import { appendConversationTurn, state } from './state.js';
import {
  cancelAmbiguity,
  findAmbiguityCandidateByName,
  handleAmbiguityReply,
  resolveAmbiguityById,
} from './handlers/ambiguity.js';
import { handleAttributeIntent } from './handlers/attribute.js';
import { handleCompareIntent } from './handlers/compare.js';
import { handleIdentifyIntent } from './handlers/identify.js';
import { selectPlantById } from './handlers/shared.js';

const SPEECH_RECOGNITION_FAILURE_MESSAGE = "Didn't catch that — try again or type your question";

export { cancelAmbiguity, selectPlantById };

export function handleSpeechRecognitionFailure() {
  speak(SPEECH_RECOGNITION_FAILURE_MESSAGE);
}

export async function handleQuery(text) {
  if (!text.trim()) return;
  appendVoiceLog(`User: ${text}`);
  appendConversationTurn(`User: ${text}`);

  const parsed = await parseIntent(text, getIntentContext());

  if (state.ambiguityCandidates.length) {
    handleAmbiguousQuery(parsed, text);
    return;
  }

  if (parsed.intent === 'identify') {
    await handleIdentifyIntent(text);
    return;
  }

  if (parsed.intent === 'compare') {
    await handleCompareIntent(enrichCompareFromState(parsed), text);
    return;
  }

  if (parsed.intent === 'queryAttribute') {
    await handleAttributeIntent(parsed, text);
    return;
  }

  const namedPlant = findPlantByNameOrAlias(text);
  if (namedPlant) {
    displayPlant(namedPlant);
    speak(`${getDisplayName(namedPlant)} information is shown.`);
    return;
  }

  await handleUnknownIntent(text);
}

function getIntentContext() {
  return {
    activeSceneId: state.activeSceneId,
    selectedPlantId: state.selectedPlantId,
    visitedPlantIds: state.visitedPlantIds,
    ambiguityCandidates: state.ambiguityCandidates,
  };
}

function handleAmbiguousQuery(parsed, text) {
  if (parsed.intent === 'resolveAmbiguity') {
    handleAmbiguityReply(parsed);
    return;
  }

  const candidateByName = findAmbiguityCandidateByName(text);
  if (candidateByName) {
    resolveAmbiguityById(candidateByName.id);
    return;
  }

  handleAmbiguityReply(parsed);
}

async function handleUnknownIntent(text) {
  const history = state.conversationHistory.slice(-6);

  const currentPlant = getCurrentPlant();
  if (currentPlant) {
    const speech = await generateInfoSpeech({ plant: currentPlant, question: text, history });
    if (speech) { speak(speech); return; }
  }

  const scenePlants = getCurrentScenePlantIds().map(getPlant).filter(Boolean);
  if (scenePlants.length > 0) {
    const speech = await generateSceneSpeech({ plants: scenePlants, question: text, history });
    if (speech) { speak(speech); return; }
  }

  speak('I could not identify a clear target. Please click the scene or add more detail.');
}

function enrichCompareFromState(parsed) {
  const { leftPlantId, rightPlantId } = state.compareState;
  if (!leftPlantId || !rightPlantId) return parsed;
  if (parsed.target2Referent === 'namedPlant' && parsed.target2Name) return parsed;
  // Only reuse the saved pair when the user is still on the same left plant.
  // If they moved to a different plant, fall back to previousSelection.
  if (state.selectedPlantId !== leftPlantId) return parsed;
  const right = getPlant(rightPlantId);
  if (!right) return parsed;
  return { ...parsed, target2Referent: 'namedPlant', target2Name: getDisplayName(right) };
}
