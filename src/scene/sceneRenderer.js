import { getAllScenes, getPlant, getScene } from '../app/selectors.js';
import { cancelAmbiguity } from '../app/handlers/ambiguity.js';
import { clearSelectedPlant, setActiveScene, state } from '../app/state.js';
import { createPlantEntity } from './plantRenderer.js';
import { hidePlantPanel } from '../ui/panels.js';
import { hideComparePanel } from '../ui/comparePanel.js';
import { hidePlantListPanel } from '../ui/plantListPanel.js';
import { els } from '../ui/dom.js';
import { gsap } from 'gsap';
 
let sceneIds = [];         
let pagerOpen = false;    
 
export function buildSceneNav() {
  els.sceneNav.innerHTML = '';
 
  sceneIds = getAllScenes().map(([id]) => id);
 
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'scene-nav-arrow';
  prevBtn.textContent = '<';
  prevBtn.setAttribute('aria-label', 'Previous scene');
  prevBtn.addEventListener('click', goToPrevScene);

  const num = document.createElement('button');
  num.type = 'button';
  num.className = 'scene-nav-num';
  num.id = 'scene-nav-num';
  num.addEventListener('click', togglePager);
 
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'scene-nav-arrow';
  nextBtn.textContent = '>';
  nextBtn.setAttribute('aria-label', 'Next scene');
  nextBtn.addEventListener('click', goToNextScene);
 
  const pager = document.createElement('div');
  pager.className = 'scene-nav-pager';
  pager.id = 'scene-nav-pager';
  pager.hidden = true;
  sceneIds.forEach((id, index) => {
    const pageBtn = document.createElement('button');
    pageBtn.type = 'button';
    pageBtn.className = 'scene-nav-page';
    pageBtn.textContent = String(index + 1);
    pageBtn.dataset.scene = id;
    pageBtn.addEventListener('click', () => {
      goToScene(id);
      closePager();
    });
    pager.appendChild(pageBtn);
  });
 
  els.sceneNav.append(prevBtn, num, nextBtn, pager);
  updateNav();
 
  if (!window.__mitaSceneKeyBound) {
    window.__mitaSceneKeyBound = true;
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') goToPrevScene();
      if (e.key === 'ArrowRight') goToNextScene();
    });
  }
}
 
export function goToScene(id) {
  const scene = getScene(id);
  if (!scene) return;
 
  gsap.to(els.fadeOverlay, {
    opacity: 1,
    duration: 0.4,
    onComplete: () => {
      resetSceneTransientUi();
      setActiveScene(id);
      els.sceneTitle.textContent = scene.title;
      els.sky.setAttribute('src', scene.panorama);
      updateNav();
      renderSceneContent(scene);
      gsap.to(els.fadeOverlay, { opacity: 0, duration: 0.4 });
    },
  });
}
function resetSceneTransientUi() {
  cancelAmbiguity();
  clearSelectedPlant();
  hidePlantPanel();
  hideComparePanel();
  hidePlantListPanel();
}

export function updateNav() {
  const index = sceneIds.indexOf(state.activeSceneId);
 
  const num = document.getElementById('scene-nav-num');
  if (num) num.textContent = index >= 0 ? String(index + 1) : '?';
 
  const pager = document.getElementById('scene-nav-pager');
  pager?.querySelectorAll('.scene-nav-page').forEach((btn) => {
    btn.setAttribute('aria-current', String(btn.dataset.scene === state.activeSceneId));
  });
}
 
function currentSceneIndex() {
  return sceneIds.indexOf(state.activeSceneId);
}
 
function goToPrevScene() {
  const i = currentSceneIndex();
  if (i === -1 || sceneIds.length === 0) return;
  const prevIndex = (i - 1 + sceneIds.length) % sceneIds.length;
  goToScene(sceneIds[prevIndex]);
}
 
function goToNextScene() {
  const i = currentSceneIndex();
  if (i === -1 || sceneIds.length === 0) return;
  const nextIndex = (i + 1) % sceneIds.length;
  goToScene(sceneIds[nextIndex]);
}
 
function togglePager() {
  pagerOpen ? closePager() : openPager();
}
 
function openPager() {
  const pager = document.getElementById('scene-nav-pager');
  if (pager) pager.hidden = false;
  pagerOpen = true;
}
 
function closePager() {
  const pager = document.getElementById('scene-nav-pager');
  if (pager) pager.hidden = true;
  pagerOpen = false;
}
 
function renderSceneContent(scene) {
  els.container.innerHTML = '';
  scene.models.map((id) => getPlant(id)).filter(Boolean).forEach((plant) => {
    els.container.appendChild(createPlantEntity(plant));
  });
}
