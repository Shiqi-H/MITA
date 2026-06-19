export const state = {
  activeSceneId: 'scene-1',
  selectedPlantId: null,
  ambiguityCandidates: [],
  visitedPlantIds: [],
  voiceFailures: 0,
  conversationHistory: [],
  compareState: { leftPlantId: null, rightPlantId: null },
};

export function setActiveScene(id) {
  state.activeSceneId = id;
}

export function setSelectedPlant(id) {
  state.selectedPlantId = id;
  recordVisitedPlant(id);
}

export function clearSelectedPlant() {
  state.selectedPlantId = null;
}

export function recordVisitedPlant(id) {
  if (!id || state.visitedPlantIds.at(-1) === id) return;
  state.visitedPlantIds.push(id);
}

export function setAmbiguityCandidates(candidates) {
  state.ambiguityCandidates = candidates;
}

export function resetAmbiguity() {
  state.ambiguityCandidates = [];
  state.voiceFailures = 0;
}

export function resetVoiceFailures() {
  state.voiceFailures = 0;
}

export function incrementVoiceFailures() {
  state.voiceFailures += 1;
  return state.voiceFailures;
}

export function appendConversationTurn(text) {
  state.conversationHistory.push(text);
  if (state.conversationHistory.length > 20) state.conversationHistory.shift();
}

export function setCompareState(leftPlantId, rightPlantId) {
  state.compareState = { leftPlantId, rightPlantId };
}
