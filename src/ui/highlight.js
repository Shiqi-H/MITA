import { addToOutline, removeFromOutline, clearOutline } from './outlineEffect.js';


export const DISAMBIG_COLORS = ['#ffee58', '#48c774', '#3e8ed0'];

const highlighted = new Map();

export function highlightPlant(plantId, color) {
  const el = document.getElementById(plantId);
  if (!el) return;

  const apply = () => {
    if (!el.object3D) return;
    addToOutline(el.object3D, color);
    highlighted.set(plantId, el.object3D);
  };

  
  if (el.getObject3D && el.getObject3D('mesh')) {
    apply();
  } else {
    el.addEventListener('model-loaded', apply, { once: true });
  }
}

export function unhighlightPlant(plantId) {
  const obj = highlighted.get(plantId);
  if (obj) {
    removeFromOutline(obj);
    highlighted.delete(plantId);
  }
}

export function clearAllHighlights() {
  clearOutline();
  highlighted.clear();
}

export function highlightOnly(plantId) {
  for (const id of [...highlighted.keys()]) {
    if (id !== plantId) unhighlightPlant(id);
  }
  unhighlightPlant(plantId);
  highlightPlant(plantId);
}