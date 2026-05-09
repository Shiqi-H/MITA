let rafId = null;

export function showDisambiguationOverlay({ candidates, layer, scene, onSelect }) {
  hideDisambiguationOverlay(layer);
  if (!layer || !scene) return;

  const markerMap = new Map();
  layer.hidden = false;
  layer.setAttribute('aria-hidden', 'false');

  candidates.forEach((candidate) => {
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'disambig-floating-marker';
    marker.textContent = candidate.marker;
    marker.setAttribute('aria-label', `Select plant ${candidate.marker}`);
    marker.addEventListener('click', () => onSelect(candidate.id));
    layer.appendChild(marker);
    markerMap.set(candidate.id, marker);
  });

  const updateMarkers = () => {
    const camera = scene.camera;
    const canvas = scene.renderer?.domElement;
    if (!camera || !canvas) {
      rafId = requestAnimationFrame(updateMarkers);
      return;
    }

    candidates.forEach((candidate) => {
      const marker = markerMap.get(candidate.id);
      const entity = document.getElementById(candidate.id);
      if (!marker || !entity?.object3D) return;

      const projected = projectToScreen(entity.object3D, camera, canvas);
      marker.style.opacity = projected.visible ? '1' : '0';
      marker.style.left = `${projected.x}px`;
      marker.style.top = `${projected.y - 42}px`;
    });

    rafId = requestAnimationFrame(updateMarkers);
  };

  rafId = requestAnimationFrame(updateMarkers);
}

export function hideDisambiguationOverlay(layer) {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (!layer) return;
  layer.replaceChildren();
  layer.hidden = true;
  layer.setAttribute('aria-hidden', 'true');
}

function projectToScreen(object3D, camera, canvas) {
  const ThreeCtor = window.AFRAME?.THREE || window.THREE;
  if (!ThreeCtor) return { x: 0, y: 0, visible: false };

  const position = getObjectCenter(object3D, ThreeCtor);
  const ndc = position.project(camera);
  const rect = canvas.getBoundingClientRect();

  return {
    x: ((ndc.x + 1) / 2) * rect.width + rect.left,
    y: ((-ndc.y + 1) / 2) * rect.height + rect.top,
    visible: ndc.z >= -1 && ndc.z <= 1,
  };
}

function getObjectCenter(object3D, ThreeCtor) {
  const box = new ThreeCtor.Box3().setFromObject(object3D);
  if (!box.isEmpty()) {
    return box.getCenter(new ThreeCtor.Vector3());
  }
  return object3D.getWorldPosition(new ThreeCtor.Vector3());
}
