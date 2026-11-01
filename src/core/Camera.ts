import { PerspectiveCamera } from 'three';

export function createCamera(aspect: number): PerspectiveCamera {
  const camera = new PerspectiveCamera(45, aspect, 0.1, 100);
  camera.position.set(0, 1.5, 5);
  camera.lookAt(0, 1, 0);
  return camera;
}
