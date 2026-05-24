import { getDisplayName } from '../app/selectors.js';
import { showInteractionPanel } from './panels.js';

export function renderMedicalPanel(plant) {
  const layout = document.createElement('div');
  layout.className = 'medical-layout';
  layout.innerHTML = `
    <img src="${plant.images.medical}" alt="${getDisplayName(plant)} medicinal reference">
    <div>
      <h3>${getDisplayName(plant)}</h3>
      <p>${plant.medicalInfo}</p>
    </div>
  `;
  showInteractionPanel('Medicinal value', layout, { variant: 'medical' });
}
