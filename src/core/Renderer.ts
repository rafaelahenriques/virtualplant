import { WebGLRenderer, type PerspectiveCamera, type Scene } from 'three';
import type { ScanRect } from './ScanWindow';

const MAX_PIXEL_RATIO = 2;

export function createRenderer(container: HTMLElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  return renderer;
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

export function fitToContainer(
  container: HTMLElement,
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
): void {
  new ResizeObserver(() => {
    const { clientWidth: width, clientHeight: height } = container;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }).observe(container);
}
