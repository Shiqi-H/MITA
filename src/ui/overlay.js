/**
 * ui/overlay.js
 * Task 1: Disambiguation overlay — shows floating A/B labels above plants.
 *
 * Renders DOM labels that float over the 3D scene and allows the user to
 * click a button to select a candidate when voice disambiguation fails.
 */

/** @type {HTMLElement|null} */
let overlayEl = null;
// /** @type {Function|null} — call to remove current overlay */
// let _cleanup = null;

/**
 * Show disambiguation labels above hit plants.
 *
 * @param {Array<{id: string, label: string, name: string, positionDesc: string}>} candidates
 * @param {Function} onSelect  - Callback (selectedId: string) => void
 */
export function showDisambiguationOverlay(candidates, onSelect) {
  hideDisambiguationOverlay();

  overlayEl = document.createElement('div');
  overlayEl.id = 'mita-disambig-overlay';
  overlayEl.innerHTML = `
    <div class="disambig-backdrop"></div>
    <div class="disambig-panel">
      <p class="disambig-title">检测到多株植物，请选择：</p>
      <div class="disambig-candidates">
        ${candidates
          .map(
            (c) => `
          <button class="disambig-btn" data-id="${c.id}">
            <span class="disambig-label">${c.label}</span>
            <span class="disambig-name">${c.name}</span>
            <span class="disambig-pos">${c.positionDesc}</span>
          </button>`
          )
          .join('')}
      </div>
      <p class="disambig-hint">或通过语音回答（如"后面那个"/"B"）</p>
    </div>
  `;

  // Click handler for each candidate button
  overlayEl.querySelectorAll('.disambig-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      hideDisambiguationOverlay();
      onSelect(id);
    });
  });

  document.body.appendChild(overlayEl);

  // Highlight the candidate plants in the 3D scene
  // candidates.forEach((c, i) => {
  //   const el = document.querySelector(`#${CSS.escape(c.id)}`);
  //   if (el) {
  //     el.setAttribute('material', `color: ${i === 0 ? '#ffdd57' : '#48c774'}; opacity: 0.6`);
  //     el.setAttribute('data-mita-highlighted', '1');
  //   }
  // });

  // _cleanup = () => {
  //   candidates.forEach((c) => {
  //     const el = document.querySelector(`#${CSS.escape(c.id)}`);
  //     if (el && el.getAttribute('data-mita-highlighted')) {
  //       el.removeAttribute('material');
  //       el.removeAttribute('data-mita-highlighted');
  //     }
  //   });
  // };
}

/**
 * Remove the disambiguation overlay.
 */
export function hideDisambiguationOverlay() {
  overlayEl?.remove();
  overlayEl = null;
//   // _cleanup?.();
//   _cleanup = null;
}
