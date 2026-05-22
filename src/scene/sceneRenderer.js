import { getAllScenes, getPlant, getScene, formatVec3 } from '../app/selectors.js';
import { clearSelectedPlant, setActiveScene, state } from '../app/state.js';
import { createPlantEntity } from './plantRenderer.js';
import { displayPlant, hidePlantPanel } from '../ui/panels.js';
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
      setActiveScene(id);
      clearSelectedPlant();
      hidePlantPanel();
      els.sceneTitle.textContent = scene.title;
      els.sky.setAttribute('src', scene.panorama);
      updateNav();
      renderSceneContent(scene);
      gsap.to(els.fadeOverlay, { opacity: 0, duration: 0.4 });
    },
  });
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
  if (i <= 0) return;
  goToScene(sceneIds[i - 1]);
}
 
function goToNextScene() {
  const i = currentSceneIndex();
  if (i === -1 || i >= sceneIds.length - 1) return; 
  goToScene(sceneIds[i + 1]);
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
  renderHotspots(scene.hotspots);
}
 
function renderHotspots(hotspots) {
  hotspots.forEach((hotspot) => {
    if (hotspot.candidateIds.length !== 1) return;
    const hotspotEntity = document.createElement('a-sphere');
    hotspotEntity.setAttribute('radius', '0.12');
    hotspotEntity.setAttribute('color', hotspot.mode === 'compare' ? '#9dd7e6' : '#95d06a');
    hotspotEntity.setAttribute('opacity', '0.45');
    hotspotEntity.setAttribute('position', formatVec3(hotspot.position));
    hotspotEntity.setAttribute('class', 'clickable hotspot');
    hotspotEntity.addEventListener('click', (event) => {
      event.stopPropagation();
      window.__mitaSkipNextRaycast = true;
      const plant = getPlant(hotspot.candidateIds[0]);
      if (plant) displayPlant(plant);
    });
    els.container.appendChild(hotspotEntity);
  });
}