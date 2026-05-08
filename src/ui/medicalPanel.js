import { getDisplayName } from '../core/selectors.js';
import { showInteractionPanel } from './panels.js';

export function renderMedicalPanel(plant) {
  const layout = document.createElement('div');
  layout.className = 'medical-layout';
  layout.innerHTML = `
    <img src="${plant.images.medical}" alt="${getDisplayName(plant)} medicinal reference">
    <div>
      <p class="eyebrow">Medicinal value</p>
      <h3>${getDisplayName(plant)}</h3>
      <p>${plant.medicalInfo}</p>
      <p class="panel-status">Recorded value: ${plant.attributes.medicinalValue}</p>
    </div>
  `;
  showInteractionPanel('Medicinal Focus', layout);
}
