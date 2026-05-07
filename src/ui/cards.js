/**
 * ui/cards.js
 * Renders information cards in the sidebar panel.
 *
 * Card types:
 *   - 'default'    → general plant info (description + attributes)
 *   - 'medical'    → medical/pharmacological info panel (Task 3)
 *   - 'botanical'  → botanical characteristics panel (Task 3)
 *   - 'comparison' → side-by-side two-plant comparison (Task 2)
 *
 * All cards are injected into #mita-sidebar.
 */

/** Get or create the sidebar container */
function getSidebar() {
  let sidebar = document.getElementById('mita-sidebar');
  if (!sidebar) {
    sidebar = document.createElement('div');
    sidebar.id = 'mita-sidebar';
    document.body.appendChild(sidebar);
  }
  return sidebar;
}

/** Close / clear the sidebar */
export function closeCard() {
  const sb = document.getElementById('mita-sidebar');
  if (sb) sb.innerHTML = '';
  sb?.classList.remove('visible');
}

/**
 * Render a plant info card (default / medical / botanical).
 * @param {'default'|'medical'|'botanical'} cardType
 * @param {Object} data  - Plant data from server
 */
export function renderInfoCard(cardType, data) {
  const sidebar = getSidebar();
  sidebar.classList.add('visible');

  if (cardType === 'medical') {
    sidebar.innerHTML = buildMedicalCard(data);
  } else if (cardType === 'botanical') {
    sidebar.innerHTML = buildBotanicalCard(data);
  } else {
    sidebar.innerHTML = buildDefaultCard(data);
  }

  attachCloseHandler(sidebar);
}

/**
 * Render a two-plant comparison panel (Task 2).
 * @param {Object} plant1
 * @param {Object} plant2
 * @param {string} slot
 */
export function renderComparisonCard(plant1, plant2, slot) {
  const sidebar = getSidebar();
  sidebar.classList.add('visible');
  sidebar.innerHTML = buildComparisonCard(plant1, plant2, slot);
  attachCloseHandler(sidebar);
}

/**
 * Render a fallback card offering alternative options.
 * @param {Object} data  - { speech, options: string[] }
 * @param {Function} onOptionSelect - (optionSlot: string) => void
 */
export function renderFallbackCard(data, onOptionSelect) {
  const sidebar = getSidebar();
  sidebar.classList.add('visible');

  const slotLabels = { medicinal: '药用价值', botanical: '植物学特征', toxicity: '毒性', drought: '耐旱性' };

  sidebar.innerHTML = `
    <div class="card card--fallback">
      <button class="card-close">✕</button>
      <p class="card-fallback-msg">${escHtml(data.speech)}</p>
      ${
        data.options?.length > 0
          ? `<div class="card-options">
              ${data.options.map((opt) => `<button class="card-opt-btn" data-slot="${opt}">${slotLabels[opt] ?? opt}</button>`).join('')}
             </div>`
          : ''
      }
    </div>
  `;

  sidebar.querySelectorAll('.card-opt-btn').forEach((btn) => {
    btn.addEventListener('click', () => onOptionSelect(btn.dataset.slot));
  });

  attachCloseHandler(sidebar);
}

// ─────────────────────────────────────────────
// Template builders
// ─────────────────────────────────────────────

function buildDefaultCard(data) {
  const attrs = data.attributes || {};
  return `
    <div class="card card--default">
      <button class="card-close">✕</button>
      <h2 class="card-name">${escHtml(data.name)}</h2>
      <p class="card-scientific">${escHtml(data.scientific_name)}</p>
      <p class="card-desc">${escHtml(data.description)}</p>
      <table class="card-attrs">
        ${Object.entries(attrs)
          .map(([k, v]) => `<tr><td class="attr-key">${escHtml(k)}</td><td class="attr-val">${escHtml(String(v))}</td></tr>`)
          .join('')}
      </table>
      ${renderTags(data.tags)}
    </div>
  `;
}

function buildMedicalCard(data) {
  const med = data.medical_info || {};
  return `
    <div class="card card--medical">
      <button class="card-close">✕</button>
      <div class="card-header-medical">
        <span class="card-badge card-badge--medical">药用</span>
        <h2 class="card-name">${escHtml(data.name)}</h2>
        <p class="card-scientific">${escHtml(data.scientific_name)}</p>
      </div>
      <section class="card-section">
        <h3>药用摘要</h3>
        <p>${escHtml(med.summary ?? '暂无数据')}</p>
      </section>
      ${
        med.active_compounds?.length > 0
          ? `<section class="card-section">
               <h3>主要活性成分</h3>
               <ul>${med.active_compounds.map((c) => `<li>${escHtml(c)}</li>`).join('')}</ul>
             </section>`
          : ''
      }
      ${
        med.caution
          ? `<section class="card-section card-section--warning">
               <h3>⚠️ 注意事项</h3>
               <p>${escHtml(med.caution)}</p>
             </section>`
          : ''
      }
      ${renderTags(data.tags)}
    </div>
  `;
}

function buildBotanicalCard(data) {
  return `
    <div class="card card--botanical">
      <button class="card-close">✕</button>
      <div class="card-header-botanical">
        <span class="card-badge card-badge--botanical">植物学</span>
        <h2 class="card-name">${escHtml(data.name)}</h2>
        <p class="card-scientific">${escHtml(data.scientific_name)}</p>
      </div>
      <section class="card-section">
        <h3>植物学特征</h3>
        <p>${escHtml(data.botanical_info ?? '暂无数据')}</p>
      </section>
      <table class="card-attrs">
        ${Object.entries(data.attributes || {})
          .map(([k, v]) => `<tr><td class="attr-key">${escHtml(k)}</td><td class="attr-val">${escHtml(String(v))}</td></tr>`)
          .join('')}
      </table>
      ${renderTags(data.tags)}
    </div>
  `;
}

function buildComparisonCard(plant1, plant2, slot) {
  const slotLabels = { drought: '耐旱性', toxicity: '毒性', medicinal: '药用价值', botanical: '植物学特征', general: '综合对比' };
  return `
    <div class="card card--comparison">
      <button class="card-close">✕</button>
      <h2 class="card-compare-title">植物对比：${slotLabels[slot] ?? slot}</h2>
      <div class="compare-grid">
        ${buildCompareColumn(plant1)}
        <div class="compare-vs">VS</div>
        ${buildCompareColumn(plant2)}
      </div>
    </div>
  `;
}

function buildCompareColumn(plant) {
  const highlight = plant.highlight;
  const attrs = plant.attributes || {};
  return `
    <div class="compare-col">
      <h3 class="compare-plant-name">${escHtml(plant.name)}</h3>
      <p class="compare-scientific">${escHtml(plant.scientific_name)}</p>
      ${
        highlight
          ? `<div class="compare-highlight">
               <span class="compare-highlight-label">${escHtml(highlight.label)}</span>
               <span class="compare-highlight-value">${escHtml(highlight.value)}</span>
             </div>`
          : `<p class="compare-desc">${escHtml(plant.description)}</p>`
      }
      ${renderTags(plant.tags)}
    </div>
  `;
}

function renderTags(tags) {
  if (!tags?.length) return '';
  return `<div class="card-tags">${tags.map((t) => `<span class="card-tag">${escHtml(t)}</span>`).join('')}</div>`;
}

function attachCloseHandler(sidebar) {
  sidebar.querySelector('.card-close')?.addEventListener('click', closeCard);
}

/** Basic HTML escaping to prevent XSS */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
