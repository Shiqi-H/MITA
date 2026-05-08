import { cancelAmbiguity, handleQuery } from './core/grounding.js';
import { initRaycastSelection } from './core/raycastSelection.js';
import { buildSceneNav, goToScene, updateNav } from './core/sceneRenderer.js';
import { initSpeechRecognition, startSpeechRecognition } from './core/speech.js';
import { resetVoiceFailures, state } from './core/state.js';
import { hideComparePanel } from './ui/comparePanel.js';
import { els } from './ui/dom.js';
import { hideInteractionPanel, hidePlantPanel, updateHint } from './ui/panels.js';
import { renderQueryControls } from './ui/queryControls.js';

function initApp() {
  els.panelClose.addEventListener('click', hidePlantPanel);
  els.interactionClose.addEventListener('click', cancelAmbiguity);
  els.compareClose.addEventListener('click', hideComparePanel);

  renderQueryControls(els.interactionQueryControls, {
    placeholder: 'Type or say A, B, C...',
    onSubmit: handleQuery,
    onSpeak: startSpeechRecognition,
  });
  renderQueryControls(els.plantQueryControls, {
    placeholder: 'Ask about this plant...',
    onSubmit: handleQuery,
    onSpeak: startSpeechRecognition,
  });

  initSpeechRecognition({
    onTranscript: handleQuery,
  });

  resetVoiceFailures();
  buildSceneNav();
  initRaycastSelection();
  goToScene(state.activeSceneId);
  updateNav();
  hidePlantPanel();
  hideComparePanel();
  updateHint('Drag to look around. Click plants or hotspots, then ask in English.');
}

initApp();
