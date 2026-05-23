import { parseIntent } from '../intent/llmClient.js';
import { speak } from '../speech/speech.js';
import { appendVoiceLog, displayPlant } from '../ui/panels.js';
import { findPlantByNameOrAlias, getDisplayName } from './selectors.js';
import { state } from './state.js';
import {
  cancelAmbiguity,
  findAmbiguityCandidateByName,
  handleAmbiguityRecognitionFailure,
  handleAmbiguityReply,
  resolveAmbiguityById,
} from './handlers/ambiguity.js';
import { handleAttributeIntent } from './handlers/attribute.js';
import { handleCompareIntent } from './handlers/compare.js';
import { handleIdentifyIntent } from './handlers/identify.js';
import { selectPlantById } from './handlers/shared.js';

export { cancelAmbiguity, handleAmbiguityRecognitionFailure, selectPlantById };

export async function handleQuery(text) {
  if (!text.trim()) return;
  appendVoiceLog(`User: ${text}`);

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
    await handleCompareIntent(parsed, text);
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

  handleUnknownIntent();
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

function handleUnknownIntent() {
  speak('I could not identify a clear target. Please click the scene or add more detail.');
}
