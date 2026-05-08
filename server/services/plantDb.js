import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

let plantCache = null;

export function getPlants() {
  if (!plantCache) {
    const serverDir = dirname(fileURLToPath(import.meta.url));
    const plantPath = resolve(serverDir, '..', '..', 'src', 'data', 'plants.json');
    plantCache = JSON.parse(readFileSync(plantPath, 'utf8'));
  }
  return plantCache;
}

export function getPlantContext() {
  return Object.values(getPlants()).map((plant) => ({
    id: plant.id,
    displayName: plant.displayName,
    aliases: plant.aliases,
    attributes: plant.attributes,
  }));
}
