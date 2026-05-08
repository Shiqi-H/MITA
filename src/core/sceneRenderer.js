import { getAllScenes, getPlant, getScene, formatVec3 } from './selectors.js';
import { setActiveScene, state } from './state.js';
import { createPlantEntity } from './plantRenderer.js';
import { displayPlant, hidePlantPanel, setLoading, updateHint } from '../ui/panels.js';
import { els } from '../ui/dom.js';

export function buildSceneNav() {
  getAllScenes().forEach(([id, scene]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.scene = id;
    button.textContent = scene.label;
    button.setAttribute('aria-label', `Go to ${scene.title}`);
    button.addEventListener('click', () => goToScene(id));
    els.sceneNav.appendChild(button);
  });
}

export function goToScene(id) {
  const scene = getScene(id);
  if (!scene) return;
  setActiveScene(id);
  setLoading(true);
  hidePlantPanel();
  els.sceneTitle.textContent = scene.title;
  els.sky.setAttribute('src', scene.panorama);
  updateNav();
  renderSceneContent(scene);
  setLoading(false);
  updateHint(`Scene ${scene.label} loaded. Click a plant or hotspot to start.`);
}

export function updateNav() {
  els.sceneNav.querySelectorAll('button').forEach((button) => {
    button.setAttribute('aria-current', String(button.dataset.scene === state.activeSceneId));
  });
}

function renderSceneContent(scene) {
  els.container.innerHTML = '';
  renderSceneLinks(scene.links);
  scene.models.map((id) => getPlant(id)).filter(Boolean).forEach((plant) => {
    els.container.appendChild(createPlantEntity(plant));
  });
  renderHotspots(scene.hotspots);
}

function renderSceneLinks(links) {
  links.forEach((link) => {
    const arrow = document.createElement('a-image');
    arrow.setAttribute('src', '#arrow-img');
    arrow.setAttribute('position', formatVec3(link.position));
    arrow.setAttribute('rotation', formatVec3(link.rotation));
    arrow.setAttribute('scale', '0.82 0.82 0.82');
    arrow.setAttribute('class', 'clickable scene-link');
    arrow.setAttribute('animation__hover', 'property: scale; startEvents: mouseenter; to: 1 1 1; dur: 160');
    arrow.setAttribute('animation__leave', 'property: scale; startEvents: mouseleave; to: 0.82 0.82 0.82; dur: 160');
    arrow.addEventListener('click', (event) => {
      event.stopPropagation();
      window.__mitaSkipNextRaycast = true;
      goToScene(link.target);
    });
    els.container.appendChild(arrow);
  });
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
