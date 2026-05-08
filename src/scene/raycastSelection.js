import { getPlant } from '../app/selectors.js';
import { displayPlant, updateHint } from '../ui/panels.js';
import { promptAmbiguity } from '../app/grounding.js';
import { els } from '../ui/dom.js';

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

export function initRaycastSelection() {
  if (els.scene.canvas) {
    bindCanvas(els.scene.canvas);
    return;
  }
  els.scene.addEventListener('loaded', () => bindCanvas(els.scene.canvas), { once: true });
}

function bindCanvas(canvas) {
  if (!canvas) return;
  canvas.addEventListener('click', handleSceneClick);
}

function handleSceneClick(event) {
  if (window.__mitaSkipNextRaycast) {
    window.__mitaSkipNextRaycast = false;
    return;
  }
  if (!event.clientX && !event.clientY) return;

  const scene = els.scene;
  const camera = scene.camera;
  const canvas = scene.renderer?.domElement;
  if (!camera || !canvas) return;

  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const plantObjects = getPlantObjects();
  const hits = raycaster.intersectObjects(plantObjects, true);
  const candidateIds = collectCandidateIds(hits);

  if (candidateIds.length >= 2) {
    promptAmbiguity(candidateIds);
    return;
  }

  if (candidateIds.length === 1) {
    const plant = getPlant(candidateIds[0]);
    if (plant) displayPlant(plant);
    return;
  }

  updateHint('No plant hit. Click directly through a plant model.');
}

function getPlantObjects() {
  return Array.from(els.container.querySelectorAll('[data-plant-id]'))
    .map((entity) => entity.object3D)
    .filter(Boolean);
}

function collectCandidateIds(hits) {
  const ids = [];
  hits.forEach((hit) => {
    const id = findPlantIdFromObject(hit.object);
    if (id && !ids.includes(id)) ids.push(id);
  });
  return ids;
}

function findPlantIdFromObject(object) {
  let current = object;
  while (current) {
    const plantId = current.el?.dataset?.plantId;
    if (plantId) return plantId;
    current = current.parent;
  }
  return null;
}
