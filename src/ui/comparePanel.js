import { getDisplayName } from '../core/selectors.js';
import { els } from './dom.js';

export function renderComparePanel(left, right, attribute = 'droughtTolerance', note = '') {
  const rows = [
    ['Drought tolerance', left.attributes.droughtTolerance, right.attributes.droughtTolerance],
    ['Height', left.attributes.height, right.attributes.height],
    ['Lifespan', left.attributes.lifespan, right.attributes.lifespan],
    ['Medicinal value', left.attributes.medicinalValue, right.attributes.medicinalValue],
  ];

  els.compareBody.innerHTML = `
    ${note ? `<p class="panel-status">${note}</p>` : ''}
    <div class="compare-grid">
      <article class="compare-card">
        <p class="eyebrow">Current target</p>
        <h3>${getDisplayName(left)}</h3>
        <p>${left.description}</p>
      </article>
      <article class="compare-card">
        <p class="eyebrow">Comparison target</p>
        <h3>${getDisplayName(right)}</h3>
        <p>${right.description}</p>
      </article>
    </div>
    <div class="compare-table" data-focus-attribute="${attribute}">
      ${rows.map(([key, a, b]) => `<div class="compare-row"><span>${key}</span><strong>${a}</strong><strong>${b}</strong></div>`).join('')}
    </div>
  `;
  els.comparePanel.hidden = false;
}

export function hideComparePanel() {
  els.comparePanel.hidden = true;
}
