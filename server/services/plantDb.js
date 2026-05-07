import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../data/plants.json');

/** @type {{ plants: PlantRecord[] }} */
const db = JSON.parse(readFileSync(DB_PATH, 'utf-8'));

/**
 * @typedef {Object} PlantRecord
 * @property {string} id
 * @property {string} name
 * @property {string} scientific_name
 * @property {string[]} aliases
 * @property {string} description
 * @property {Object} attributes
 * @property {Object} medical_info
 * @property {string} botanical_info
 * @property {string|null} feng_shui_info
 * @property {string[]} tags
 */

/**
 * Find a plant by its ID (case-insensitive).
 * @param {string} id
 * @returns {PlantRecord|null}
 */
export function findById(id) {
  return db.plants.find(
    (p) => p.id.toLowerCase() === id.toLowerCase()
  ) ?? null;
}

/**
 * Find a plant by name or alias (fuzzy, case-insensitive).
 * @param {string} nameOrAlias
 * @returns {PlantRecord|null}
 */
export function findByName(nameOrAlias) {
  const query = nameOrAlias.trim().toLowerCase();
  return (
    db.plants.find((p) =>
      p.aliases.some((a) => a.toLowerCase().includes(query)) ||
      p.name.toLowerCase().includes(query) ||
      p.scientific_name.toLowerCase().includes(query)
    ) ?? null
  );
}

/**
 * Find a plant by either ID or name/alias.
 * @param {string} idOrName
 * @returns {PlantRecord|null}
 */
export function findPlant(idOrName) {
  return findById(idOrName) ?? findByName(idOrName);
}

/**
 * Get multiple plants by ID array.
 * @param {string[]} ids
 * @returns {PlantRecord[]}
 */
export function findMany(ids) {
  return ids.map(findById).filter(Boolean);
}

/**
 * Return a minimal summary of a plant for disambiguation labels.
 * @param {PlantRecord} plant
 * @returns {{ id: string, name: string, scientific_name: string, description: string }}
 */
export function toCandidate(plant) {
  return {
    id: plant.id,
    name: plant.name,
    scientific_name: plant.scientific_name,
    description: plant.description,
  };
}
