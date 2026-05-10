export const state = {
  activeSceneId: 'scene-1',
  selectedPlantId: null,
  ambiguityCandidates: [],
  visitedPlantIds: [],
  interactionMode: 'idle',
  voiceFailures: 0,
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
  if (!id || state.visitedPlantIds.includes(id)) return;
  state.visitedPlantIds.push(id);
}

export function setAmbiguityCandidates(candidates) {
  state.ambiguityCandidates = candidates;
  state.interactionMode = candidates.length ? 'ambiguity_pending' : 'idle';
}

export function resetAmbiguity() {
  state.ambiguityCandidates = [];
  state.interactionMode = 'idle';
  state.voiceFailures = 0;
}

export function resetVoiceFailures() {
  state.voiceFailures = 0;
}

export function incrementVoiceFailures() {
  state.voiceFailures += 1;
  return state.voiceFailures;
}
