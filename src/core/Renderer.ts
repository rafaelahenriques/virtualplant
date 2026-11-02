import {
  HalfFloatType,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
  type PerspectiveCamera,
  type Scene,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { PersistentRenderPass } from './PersistentRenderPass';
import type { ScanRect } from './ScanWindow';

const MAX_PIXEL_RATIO = 2;
// The x-ray is soft and glowing, so it doesn't need every pixel of a high-density screen. This
// roughly halves the time each frame takes, and the slower the frames, the worse the flicker.
const XRAY_PIXEL_RATIO = 1.25;
const BLOOM_STRENGTH = 0.38;
const BLOOM_RADIUS = 0.75;
const BLOOM_THRESHOLD = 0.08;

export const screenPixelRatio = (): number => Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
const xrayPixelRatio = (): number => Math.min(window.devicePixelRatio, XRAY_PIXEL_RATIO);

export function createRenderer(container: HTMLElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(screenPixelRatio());
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  return renderer;
}

/** Draws the scene with a soft glow, for the x-ray look. The colour window goes on top. */
export function createGlowComposer(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
): EffectComposer {
  const { x: width, y: height } = renderer.getDrawingBufferSize(new Vector2());
  const composer = new EffectComposer(
    renderer,
    new WebGLRenderTarget(width, height, { type: HalfFloatType, depthBuffer: false }),
  );
  composer.setPixelRatio(xrayPixelRatio());
  composer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
  composer.addPass(new PersistentRenderPass(scene, camera));
  composer.addPass(
    new UnrealBloomPass(
      new Vector2(width / 2, height / 2),
      BLOOM_STRENGTH,
      BLOOM_RADIUS,
      BLOOM_THRESHOLD,
    ),
  );
  composer.addPass(new OutputPass());
  return composer;
}

/** Renders over what is already on screen, but only inside the given square. */
export function renderInRect(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  rect: ScanRect,
): void {
  // The scissor is measured from the bottom left.
  const bottom = renderer.domElement.clientHeight - rect.y - rect.size;
  renderer.setScissor(rect.x, bottom, rect.size, rect.size);
  renderer.setScissorTest(true);
  renderer.render(scene, camera);
  renderer.setScissorTest(false);
}

/**
 * Also rereads the pixel ratio, which changes with browser zoom or a move to another screen. Uses
 * the window's resize event because it fires before the frame is drawn. A ResizeObserver fires
 * after, and resizing clears the canvas, so the page would show a blank frame.
 */
export function fitToContainer(
  container: HTMLElement,
  renderer: WebGLRenderer,
  composer: EffectComposer,
  camera: PerspectiveCamera,
): void {
  window.addEventListener('resize', () => {
    const { clientWidth: width, clientHeight: height } = container;
    renderer.setPixelRatio(screenPixelRatio());
    renderer.setSize(width, height);
    composer.setPixelRatio(xrayPixelRatio());
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
}
