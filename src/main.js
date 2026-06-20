import { cancelAmbiguity, handleAmbiguityRecognitionFailure, handleQuery } from './app/grounding.js';
import { resetVoiceFailures, state } from './app/state.js';
import { startLlmStatusConsoleMonitor } from './intent/llmStatusClient.js';
import { initRaycastSelection } from './scene/raycastSelection.js';
import { buildSceneNav, goToScene, updateNav } from './scene/sceneRenderer.js';
import { initSpeechRecognition, startSpeechRecognition, stopNarration } from './speech/speech.js';
import { initAudioBar } from './ui/audioBar.js';
import { hideComparePanel } from './ui/comparePanel.js';
import { els } from './ui/dom.js';
import { closePlantPanelAndClearSelection, hideHistoryPanel, hidePlantPanel, showHistoryPanel } from './ui/panels.js';
import { hidePlantListPanel, togglePlantListPanel } from './ui/plantListPanel.js';
import { renderQueryControls } from './ui/queryControls.js';
import { registerOutlineComponent } from './ui/outlineEffect.js';

function initApp() {
  els.panelClose.addEventListener('click', () => {
    closePlantPanelAndClearSelection();
  });
  els.interactionClose.addEventListener('click', () => {
    stopNarration();
    cancelAmbiguity();
  });
  els.compareClose.addEventListener('click', () => {
    stopNarration();
    hideComparePanel();
  });
  els.historyClose.addEventListener('click', hideHistoryPanel);
  els.historyTrigger.addEventListener('click', showHistoryPanel);
  els.plantListClose.addEventListener('click', hidePlantListPanel);
  els.plantListTrigger.addEventListener('click', togglePlantListPanel);

  renderQueryControls(els.globalQueryControls, {
    placeholder: 'Ask about this plant...',
    onSubmit: handleQuery,
    onSpeak: startSpeechRecognition,
  });
  initAudioBar(els.audioBar);

  initSpeechRecognition({
    onRecognitionFailure: handleAmbiguityRecognitionFailure,
  });

  resetVoiceFailures();
  buildSceneNav();
  initRaycastSelection();
  goToScene(state.activeSceneId);
  updateNav();
  hidePlantPanel();
  hideComparePanel();
  hideHistoryPanel();
  hidePlantListPanel();
  startLlmStatusConsoleMonitor();
}

registerOutlineComponent();

initApp();
