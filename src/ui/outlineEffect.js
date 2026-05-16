import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass }    from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OutputPass }     from 'three/examples/jsm/postprocessing/OutputPass.js';

const SLOT_COLORS = ['#ffee58', '#48c774', '#3e8ed0','#fff59d'];

const slots = SLOT_COLORS.map((color) => ({
  color,
  pass: null,
  selectedObjects: [],
}));

export function registerOutlineComponent() {
  if (!window.AFRAME) return;
  if (window.AFRAME.components['outline-effect']) return;

  window.AFRAME.registerComponent('outline-effect', {
    schema: {
      thickness: { type: 'number', default: 3 },
      strength:  { type: 'number', default: 5 },
      glow:      { type: 'number', default: 0.8 },
    },

    init() {
      const sceneEl = this.el;
      if (sceneEl.hasLoaded) {
        this.setup();
      } else {
        sceneEl.addEventListener('loaded', () => this.setup(), { once: true });
      }
    },

    setup() {
      const renderer = this.el.renderer;
      const scene    = this.el.object3D;
      const camera   = this.el.camera;
      if (!renderer || !scene || !camera) return;

      const size = renderer.getSize(new window.THREE.Vector2());

      const composer = new EffectComposer(renderer);
      composer.setSize(size.x, size.y);
      composer.addPass(new RenderPass(scene, camera));

      slots.forEach((slot, index) => {
  const pass = new OutlinePass(
    new window.THREE.Vector2(size.x, size.y),
    scene,
    camera,
  );
  
  const isHover = index === 3;
  pass.edgeStrength    = isHover ? 2 : this.data.strength;
  pass.edgeGlow        = isHover ? 0.3 : this.data.glow;
  pass.edgeThickness   = isHover ? 1.5 : this.data.thickness;
  pass.visibleEdgeColor.set(slot.color);
  pass.hiddenEdgeColor.set(slot.color);
  pass.selectedObjects = slot.selectedObjects;
  composer.addPass(pass);
  slot.pass = pass;
});

      composer.addPass(new OutputPass());

      
      const origRender = renderer.render.bind(renderer);
      let composing = false;
      renderer.render = (s, c) => {
        if (composing) return origRender(s, c);
        composing = true;
        composer.render();
        composing = false;
      };

      window.addEventListener('resize', () => {
        const newSize = renderer.getSize(new window.THREE.Vector2());
        composer.setSize(newSize.x, newSize.y);
        slots.forEach((slot) => slot.pass?.resolution.set(newSize.x, newSize.y));
      });
    },
  });
}

function findSlot(color) {
  if (!color) return slots[0];
  const THREE = window.THREE;
  const target = new THREE.Color(color).getHex();
  return slots.find((s) => new THREE.Color(s.color).getHex() === target) || slots[0];
}

export function addToOutline(object3D, color) {
  if (!object3D) return;
  removeFromOutline(object3D);
  const slot = findSlot(color);
  if (!slot.selectedObjects.includes(object3D)) {
    slot.selectedObjects.push(object3D);
  }
}

export function removeFromOutline(object3D) {
  slots.forEach((slot) => {
    const i = slot.selectedObjects.indexOf(object3D);
    if (i !== -1) slot.selectedObjects.splice(i, 1);
  });
}

export function clearOutline() {
  slots.forEach((slot) => {
    slot.selectedObjects.length = 0;
  });
}