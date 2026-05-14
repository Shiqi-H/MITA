import plants from '../data/plants.json';
import scenes from '../data/scenes.json';
import { state } from './state.js';

export function getPlant(id) {
  return plants[id] ?? null;
}

export function getScene(id) {
  return scenes[id] ?? null;
}

export function getAllPlants() {
  return Object.values(plants);
}

export function getAllScenes() {
  return Object.entries(scenes);
}

export function getCurrentPlant() {
  return state.selectedPlantId ? getPlant(state.selectedPlantId) : null;
}

export function getPreviousSelectedPlant() {
  const currentId = state.selectedPlantId;
  if (!currentId) return null;

  for (let index = state.visitedPlantIds.length - 2; index >= 0; index -= 1) {
    const id = state.visitedPlantIds[index];
    const plant = id && id !== currentId ? getPlant(id) : null;
    if (plant) return plant;
  }

  return null;
}

export function getCurrentScenePlantIds() {
  return getScene(state.activeSceneId)?.models ?? [];
}

export function formatVec3(values) {
  return values.join(' ');
}

export function scaleBy(values, factor) {
  return values.map((value) => Number(value) * factor).join(' ');
}

export function getDisplayName(plant) {
  return plant?.displayName ?? plant?.id ?? '';
}

export function findPlantByNameOrAlias(text) {
  const needle = normalize(text);
  if (!needle) return null;
  return getAllPlants().find((plant) => plantMatches(plant, needle)) ?? null;
}

export function findVisitedPlantByNameOrAlias(text) {
  const needle = normalize(text);
  if (!needle) return null;
  return state.visitedPlantIds
    .map((id) => getPlant(id))
    .find((plant) => plant && plantMatches(plant, needle)) ?? null;
}

export function normalize(text) {
  return String(text ?? '').trim().toLowerCase();
}

function plantMatches(plant, needle) {
  const names = [plant.displayName, plant.id, ...plant.aliases].map(normalize);
  return names.some((name) => name && (needle.includes(name) || name.includes(needle)));
}
