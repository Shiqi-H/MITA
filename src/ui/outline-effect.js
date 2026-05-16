import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass }    from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass }     from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass }     from 'three/examples/jsm/postprocessing/OutputPass.js';

const selectedObjects = [];
 
let outlinePassRef = null; 
let composerRef    = null;

export function registerOutlineComponent() {
  if (!window.AFRAME) {
    console.warn('[outline] A-Frame not loaded yet.');
    return;
  }
  if (window.AFRAME.components['outline-effect']) {
    return;
  }
 
  window.AFRAME.registerComponent('outline-effect', {
    schema: {
      color:    { type: 'color',  default: '#ffee58' },
      thickness:{ type: 'number', default: 3 },
      strength: { type: 'number', default: 4 },
      glow:     { type: 'number', default: 0.6 },
    },
 
    init() {
      const sceneEl = this.el;

	   const setup = () => this._setupComposer();
      if (sceneEl.hasLoaded) setup();
      else sceneEl.addEventListener('loaded', setup, { once: true });
    },
	_setupComposer() {
      const sceneEl = this.el;
      const renderer = sceneEl.renderer;
      const scene    = sceneEl.object3D;
      const camera   = sceneEl.camera;
 
      if (!renderer || !scene || !camera) {
        console.warn('[outline] renderer / scene / camera missing, abort.');
        return;
      }
 
      const size = renderer.getSize(new window.THREE.Vector2());
 
      const composer = new EffectComposer(renderer);
      composer.setSize(size.x, size.y);

	  composer.addPass(new RenderPass(scene, camera));

	   const outlinePass = new OutlinePass(
        new window.THREE.Vector2(size.x, size.y),
        scene,
        camera
      );
      outlinePass.edgeStrength    = this.data.strength; 
	  outlinePass.edgeGlow        = this.data.glow;
      outlinePass.edgeThickness   = this.data.thickness;	
	  outlinePass.visibleEdgeColor.set(this.data.color);
	  outlinePass.visibleEdgeColor.set(this.data.color);
      outlinePass.hiddenEdgeColor.set(this.data.color);
	  outlinePass.selectedObjects = selectedObjects;
      composer.addPass(outlinePass);

	  composer.addPass(new OutputPass());
 
      this._composer    = composer;
      this._outlinePass = outlinePass;
      composerRef       = composer;
      outlinePassRef    = outlinePass;

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
        outlinePass.resolution.set(newSize.x, newSize.y);
      });
 
      console.log('[outline] EffectComposer ready.');
    },
 
    update() {
      if (!this._outlinePass) return;
      this._outlinePass.edgeStrength  = this.data.strength;
      this._outlinePass.edgeGlow      = this.data.glow;
      this._outlinePass.edgeThickness = this.data.thickness;
      this._outlinePass.visibleEdgeColor.set(this.data.color);
      this._outlinePass.hiddenEdgeColor.set(this.data.color);
    },
  });
}

/**
 * * @param {THREE.Object3D} object3D
 * @param {string} [color]
  */ 

export function addToOutline(object3D, color) {
  if (!object3D) return;
  if (!selectedObjects.includes(object3D)) {
    selectedObjects.push(object3D);
  }
  if (color && outlinePassRef) {
    outlinePassRef.visibleEdgeColor.set(color);
    outlinePassRef.hiddenEdgeColor.set(color);
  }
}

/**
 * @param {THREE.Object3D} object3D
 */
export function removeFromOutline(object3D) {
  const i = selectedObjects.indexOf(object3D);
  if (i !== -1) selectedObjects.splice(i, 1);
}
 
export function clearOutline() {
  selectedObjects.length = 0;
}
