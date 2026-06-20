import { getCurrentScenePlantIds, getDisplayName, getPlant } from '../app/selectors.js';
import { state } from '../app/state.js';
import { selectPlantById } from '../app/handlers/shared.js';
import { focusPlantInView } from '../scene/cameraFocus.js';
import { els } from './dom.js';

export function showPlantListPanel() {
  renderPlantListPanel();
  els.plantListPanel.hidden = false;
}

export function hidePlantListPanel() {
  els.plantListPanel.hidden = true;
}

export function togglePlantListPanel() {
  if (els.plantListPanel.hidden) {
    showPlantListPanel();
  } else {
    hidePlantListPanel();
  }
}

export function renderPlantListPanel() {
  const plants = getCurrentScenePlantIds().map(getPlant).filter(Boolean);
  if (plants.length === 0) {
    els.plantListBody.replaceChildren(createEmptyState());
    return;
  }
  els.plantListBody.replaceChildren(...plants.map(createPlantCard));
}

function createEmptyState() {
  const empty = document.createElement('p');
  empty.className = 'plant-list-empty';
  empty.textContent = 'No plants in this scene.';
  return empty;
}

function createPlantCard(plant) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'plant-list-card';
  card.dataset.plantId = plant.id;
  card.setAttribute('aria-label', `Focus ${getDisplayName(plant)}`);
  card.classList.toggle('is-active', plant.id === state.selectedPlantId);

  const image = createPlantImage(plant);
  const content = document.createElement('div');

  const name = document.createElement('h3');
  name.textContent = getDisplayName(plant);

  const description = document.createElement('p');
  description.textContent = plant.description;

  const meta = document.createElement('div');
  meta.className = 'plant-list-meta';
  addMeta(meta, `Height: ${plant.attributes?.height}`);
  addMeta(meta, `Life: ${plant.attributes?.lifespan}`);
  addMeta(meta, `Drought: ${plant.attributes?.droughtTolerance}`);

  content.append(name, description, meta);
  card.append(image, content);
  card.addEventListener('click', () => {
    focusPlantInView(plant.id);
    selectPlantById(plant.id);
    renderPlantListPanel();
  });

  return card;
}

function createPlantImage(plant) {
  if (!plant.images?.medical) {
    const placeholder = document.createElement('div');
    placeholder.className = 'plant-list-image-placeholder';
    placeholder.textContent = 'Plant';
    return placeholder;
  }

  const image = document.createElement('img');
  image.src = plant.images.medical;
  image.alt = getDisplayName(plant);
  image.loading = 'lazy';
  return image;
}

function addMeta(container, value) {
  if (!value) return;
  const item = document.createElement('span');
  item.textContent = value;
  container.appendChild(item);
}
