import { cancelAmbiguity, handleAmbiguityRecognitionFailure, handleQuery } from './app/grounding.js';
import { resetVoiceFailures, state } from './app/state.js';
import { initRaycastSelection } from './scene/raycastSelection.js';
import { buildSceneNav, goToScene, updateNav } from './scene/sceneRenderer.js';
import { initSpeechRecognition, startSpeechRecognition } from './speech/speech.js';
import { hideComparePanel } from './ui/comparePanel.js';
import { els } from './ui/dom.js';
import { closePlantPanelAndClearSelection, hideHistoryPanel, hidePlantPanel, showHistoryPanel } from './ui/panels.js';
import { renderQueryControls } from './ui/queryControls.js';

function initApp() {
  els.panelClose.addEventListener('click', closePlantPanelAndClearSelection);
  els.interactionClose.addEventListener('click', cancelAmbiguity);
  els.compareClose.addEventListener('click', hideComparePanel);
  els.historyClose.addEventListener('click', hideHistoryPanel);
  els.historyTrigger.addEventListener('click', showHistoryPanel);

  renderQueryControls(els.globalQueryControls, {
    placeholder: 'Ask about this plant...',
    onSubmit: handleQuery,
    onSpeak: startSpeechRecognition,
  });

  initSpeechRecognition({
    onTranscript: handleQuery,
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
}

initApp();
