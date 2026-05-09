const frustum = new THREE.Frustum();
const projectionMatrix = new THREE.Matrix4();
const box = new THREE.Box3();
const center = new THREE.Vector3();

export function getVisiblePlantIds({ container, camera }) {
  if (!container || !camera) return [];

  camera.updateMatrixWorld();
  camera.updateProjectionMatrix?.();
  projectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(projectionMatrix);

  return Array.from(container.querySelectorAll('[data-plant-id]'))
    .map((entity) => getVisiblePlantCandidate(entity, camera))
    .filter(Boolean)
    .sort((a, b) => a.screenX - b.screenX)
    .map((candidate) => candidate.id);
}

function getVisiblePlantCandidate(entity, camera) {
  const object = entity.object3D;
  if (!object || !object.visible) return null;

  object.updateMatrixWorld(true);
  box.setFromObject(object);

  if (!box.isEmpty() && frustum.intersectsBox(box)) {
    box.getCenter(center);
    return toCandidate(entity.dataset.plantId, center, camera);
  }

  object.getWorldPosition(center);
  return frustum.containsPoint(center)
    ? toCandidate(entity.dataset.plantId, center, camera)
    : null;
}

function toCandidate(id, worldCenter, camera) {
  const projected = worldCenter.clone().project(camera);
  return {
    id,
    screenX: projected.x,
  };
}
