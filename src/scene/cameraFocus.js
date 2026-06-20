import { gsap } from 'gsap';
import { els } from '../ui/dom.js';

const FOCUS_DURATION = 0.75;

export function focusPlantInView(plantId) {
  const plantEl = document.getElementById(plantId);
  const cameraEl = els.camera;
  const ThreeCtor = window.AFRAME?.THREE || window.THREE;
  if (!plantEl?.object3D || !cameraEl?.object3D || !ThreeCtor) return;

  const target = getObjectCenter(plantEl.object3D, ThreeCtor);
  const cameraPosition = cameraEl.object3D.getWorldPosition(new ThreeCtor.Vector3());
  const direction = target.sub(cameraPosition).normalize();
  if (!Number.isFinite(direction.x) || !Number.isFinite(direction.y) || !Number.isFinite(direction.z)) return;

  const yaw = Math.atan2(-direction.x, -direction.z);
  const pitch = Math.asin(ThreeCtor.MathUtils.clamp(direction.y, -1, 1));
  rotateCamera(cameraEl, yaw, pitch);
}

function rotateCamera(cameraEl, yaw, pitch) {
  const lookControls = cameraEl.components?.['look-controls'];
  const yawObject = lookControls?.yawObject;
  const pitchObject = lookControls?.pitchObject;

  if (yawObject && pitchObject) {
    gsap.to(yawObject.rotation, {
      y: normalizeAngleNear(yaw, yawObject.rotation.y),
      duration: FOCUS_DURATION,
      ease: 'power2.out',
    });
    gsap.to(pitchObject.rotation, {
      x: pitch,
      duration: FOCUS_DURATION,
      ease: 'power2.out',
    });
    return;
  }

  gsap.to(cameraEl.object3D.rotation, {
    x: pitch,
    y: yaw,
    duration: FOCUS_DURATION,
    ease: 'power2.out',
  });
}

function getObjectCenter(object3D, ThreeCtor) {
  const box = new ThreeCtor.Box3().setFromObject(object3D);
  if (!box.isEmpty()) {
    return box.getCenter(new ThreeCtor.Vector3());
  }
  return object3D.getWorldPosition(new ThreeCtor.Vector3());
}

function normalizeAngleNear(target, current) {
  const twoPi = Math.PI * 2;
  let value = target;
  while (value - current > Math.PI) value -= twoPi;
  while (value - current < -Math.PI) value += twoPi;
  return value;
}
