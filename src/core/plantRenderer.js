import { formatVec3, scaleBy } from './selectors.js';

export function createPlantEntity(plant) {
  const entity = document.createElement('a-entity');
  if (plant.model) {
    entity.setAttribute('gltf-model', plant.model);
  } else {
    applyFallbackGeometry(entity, plant);
  }

  entity.setAttribute('position', formatVec3(plant.position));
  entity.setAttribute('scale', formatVec3(plant.scale));
  entity.setAttribute('id', plant.id);
  entity.setAttribute('class', 'clickable plant-model');
  entity.setAttribute('data-plant-id', plant.id);
  entity.setAttribute('animation__hover', `property: scale; startEvents: mouseenter; to: ${scaleBy(plant.scale, 1.09)}; dur: 180`);
  entity.setAttribute('animation__leave', `property: scale; startEvents: mouseleave; to: ${formatVec3(plant.scale)}; dur: 180`);
  return entity;
}

export function renderPlantPoiMarker(container, plant, marker, onClick) {
  const markerEntity = document.createElement('a-entity');
  const [x, , z] = plant.position;
  markerEntity.setAttribute('position', `${x} -0.15 ${z}`);
  markerEntity.setAttribute('data-candidate', 'true');

  const disc = document.createElement('a-circle');
  disc.setAttribute('radius', '0.18');
  disc.setAttribute('color', '#f8fbf5');
  disc.setAttribute('opacity', '0.96');
  disc.setAttribute('material', 'shader: flat');
  disc.setAttribute('class', 'clickable poi-marker');
  disc.addEventListener('click', (event) => {
    event.stopPropagation();
    window.__mitaSkipNextRaycast = true;
    onClick();
  });

  const text = document.createElement('a-text');
  text.setAttribute('value', marker);
  text.setAttribute('align', 'center');
  text.setAttribute('color', '#101814');
  text.setAttribute('width', '1.2');
  text.setAttribute('position', '0 0 0.01');
  text.setAttribute('font', 'kelsonsans');

  markerEntity.appendChild(disc);
  markerEntity.appendChild(text);
  container.appendChild(markerEntity);
}

function applyFallbackGeometry(entity, plant) {
  const color = plant.id === 'giant_lotus' ? '#9dd7e6' : plant.id === 'ginkgo' ? '#e0cf63' : '#7bc67e';
  const primitive = plant.id === 'giant_lotus' ? 'cylinder' : 'sphere';
  entity.setAttribute('geometry', `primitive: ${primitive}; radius: 0.4; height: 0.08`);
  entity.setAttribute('material', `color: ${color}; shader: flat; opacity: 0.9`);
}
