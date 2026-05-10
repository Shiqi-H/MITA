import { clearSelectedPlant, resetVoiceFailures, setSelectedPlant } from '../app/state.js';
import { getDisplayName } from '../app/selectors.js';
import { els } from './dom.js';

let loadingTimer = null;

export function setLoading(isLoading) {
  window.clearTimeout(loadingTimer);
  if (isLoading) {
    els.loadingIndicator.classList.add('is-visible');
    return;
  }
  loadingTimer = window.setTimeout(() => {
    els.loadingIndicator.classList.remove('is-visible');
  }, 250);
}

export function appendVoiceLog(text) {
  const item = document.createElement('li');
  item.textContent = text;
  els.voiceLog.prepend(item);
  while (els.voiceLog.children.length > 20) {
    els.voiceLog.removeChild(els.voiceLog.lastElementChild);
  }
}

export function updateHint(text) {
  els.hint.textContent = text;
}

export function displayPlant(plant, focusType = 'default') {
  if (!plant) return;
  setSelectedPlant(plant.id);
  els.plantName.textContent = getDisplayName(plant);
  els.plantDescription.textContent = plant.description;
  renderAttributes(plant, focusType);
  els.plantPanel.hidden = false;
}

export function hidePlantPanel() {
  els.plantPanel.hidden = true;
}

export function closePlantPanelAndClearSelection() {
  hidePlantPanel();
  clearSelectedPlant();
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

export function showInteractionPanel(title, body) {
  els.interactionTitle.textContent = title;
  if (typeof body === 'string') {
    els.interactionBody.textContent = body;
  } else {
    els.interactionBody.replaceChildren(body);
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

export function resetVoiceUi() {
  resetVoiceFailures();
  clearFallbackActions();
  updateHint('Voice input cleared.');
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

