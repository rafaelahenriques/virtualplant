import { WebGLRenderer, type PerspectiveCamera } from 'three';

const MAX_PIXEL_RATIO = 2;

export function createRenderer(container: HTMLElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  return renderer;
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
