import {
  HalfFloatType,
  ShaderMaterial,
  WebGLRenderTarget,
  type Camera,
  type Scene,
  type WebGLRenderer,
} from 'three';
import { FullScreenQuad, Pass } from 'three/addons/postprocessing/Pass.js';
import fullscreenVertex from '../shaders/fullscreen.vert?raw';
import persistenceFragment from '../shaders/persistence.frag?raw';

const ANTIALIAS_SAMPLES = 4;
// Long enough to even out detail that sways across the pixel grid, too short to leave a trail.
const PERSISTENCE_SECONDS = 0.06;

/**
 * Draws the scene, then blends it into the frames before it, as a phosphor screen does. Without
 * this, thin glowing tissue flickers as the animation moves it from one pixel to the next.
 */
export class PersistentRenderPass extends Pass {
  private readonly scene: Scene;
  private readonly camera: Camera;
  private readonly drawn: WebGLRenderTarget;
  private history: WebGLRenderTarget;
  private next: WebGLRenderTarget;
  private readonly material = new ShaderMaterial({
    uniforms: { tCurrent: { value: null }, tPrevious: { value: null }, uKeep: { value: 0 } },
    vertexShader: fullscreenVertex,
    fragmentShader: persistenceFragment,
    depthTest: false,
    depthWrite: false,
  });
  private readonly quad = new FullScreenQuad(this.material);

  constructor(scene: Scene, camera: Camera) {
    super();
    this.needsSwap = false;
    this.scene = scene;
    this.camera = camera;
    const options = { type: HalfFloatType, depthBuffer: false };
    this.drawn = new WebGLRenderTarget(1, 1, { ...options, samples: ANTIALIAS_SAMPLES });
    this.history = new WebGLRenderTarget(1, 1, options);
    this.next = new WebGLRenderTarget(1, 1, options);
  }

  override setSize(width: number, height: number): void {
    for (const target of [this.drawn, this.history, this.next]) target.setSize(width, height);
  }

  override render(
    renderer: WebGLRenderer,
    _writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
    delta: number,
  ): void {
    renderer.setRenderTarget(this.drawn);
    renderer.render(this.scene, this.camera);

    const { uniforms } = this.material;
    uniforms.tCurrent!.value = this.drawn.texture;
    uniforms.tPrevious!.value = this.history.texture;
    uniforms.uKeep!.value = Math.exp(-delta / PERSISTENCE_SECONDS);

    // The glow pass draws onto the read buffer, so the history needs a copy of its own.
    for (const target of [this.next, readBuffer]) {
      renderer.setRenderTarget(target);
      this.quad.render(renderer);
    }
    [this.history, this.next] = [this.next, this.history];
  }

  override dispose(): void {
    for (const target of [this.drawn, this.history, this.next]) target.dispose();
    this.material.dispose();
    this.quad.dispose();
  }
}
