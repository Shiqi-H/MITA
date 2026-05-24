import { clearSelectedPlant, setSelectedPlant } from '../app/state.js';
import { getDisplayName } from '../app/selectors.js';
import { els } from './dom.js';
import { clearAllHighlights } from './highlight.js';

export function appendVoiceLog(text) {
  const item = document.createElement('li');
  item.textContent = text;
  els.voiceLog.prepend(item);
  while (els.voiceLog.children.length > 20) {
    els.voiceLog.removeChild(els.voiceLog.lastElementChild);
  }
}

export function displayPlant(plant, focusType = 'default') {
  if (!plant) return;
  setSelectedPlant(plant.id);
  els.plantName.textContent = getDisplayName(plant);
  els.plantDescription.textContent = plant.description;
  renderAttributes(plant, focusType);
  els.plantPanel.hidden = false;
  updatePlantPanelMetrics();
}

export function hidePlantPanel() {
  els.plantPanel.hidden = true;
  updatePlantPanelMetrics();
}

export function closePlantPanelAndClearSelection() {
  hidePlantPanel();
  clearSelectedPlant();
  clearAllHighlights();
}

export function hideInteractionPanel() {
  els.interactionPanel.hidden = true;
}

export function showHistoryPanel() {
  els.historyPanel.hidden = false;
}

export function hideHistoryPanel() {
  els.historyPanel.hidden = true;
}

export function showInteractionPanel(title, body, options = {}) {
  els.interactionTitle.textContent = title;
  if (typeof body === 'string') {
    els.interactionBody.textContent = body;
  } else {
    els.interactionBody.replaceChildren(body);
  }
  els.interactionPanel.classList.toggle('medical-panel', options.variant === 'medical');
  if (options.variant === 'medical') {
    updatePlantPanelMetrics();
  }
  els.interactionPanel.hidden = false;
}

export function setFallbackActions(actions) {
  clearFallbackActions();
  const actionGroup = document.createElement('div');
  actionGroup.className = 'fallback-actions';
  actions.forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.addEventListener('click', action.onClick);
    actionGroup.appendChild(button);
  });
  els.interactionBody.appendChild(actionGroup);
}

export function clearFallbackActions() {
  els.interactionBody.querySelectorAll('.fallback-actions').forEach((node) => node.remove());
}

function renderAttributes(plant, focusType) {
  const rows =
    focusType === 'medical'
      ? [
          ['Medicinal value', plant.attributes.medicinalValue],
        ]
      : [
          ['Drought tolerance', plant.attributes.droughtTolerance],
          ['Height', plant.attributes.height],
          ['Lifespan', plant.attributes.lifespan],
          ['Medicinal value', plant.attributes.medicinalValue],
        ];

  els.plantAttributes.innerHTML = rows
    .map(([key, value]) => `<div class="attribute-row"><span>${key}</span><strong>${value}</strong></div>`)
    .join('');
}

export function updatePlantPanelMetrics() {
  window.requestAnimationFrame(() => {
    const plantPanelHeight = els.plantPanel.hidden ? 0 : els.plantPanel.offsetHeight;
    document.documentElement.style.setProperty('--plant-panel-height', `${plantPanelHeight}px`);
  });
}

window.addEventListener('resize', () => {
  if (els.interactionPanel.classList.contains('medical-panel')) {
    updatePlantPanelMetrics();
  }
});

