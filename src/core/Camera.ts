import { MathUtils, PerspectiveCamera } from 'three';

const FIELD_OF_VIEW = 40;
// Below this width-to-height ratio the camera backs off, so wide plants stay in frame.
const NARROWEST_ASPECT = 0.9;
const LOOK_DOWN = 0.03;

export function createCamera(aspect: number): PerspectiveCamera {
  return new PerspectiveCamera(FIELD_OF_VIEW, aspect, 0.5, 2000);
}

/** Frames a height on the plant, with `span` centimetres filling the screen's height. */
export function frameSubject(
  camera: PerspectiveCamera,
  { center, span }: { center: number; span: number },
): void {
  const fit = Math.max(1, NARROWEST_ASPECT / camera.aspect);
  const halfHeight = Math.tan(MathUtils.degToRad(FIELD_OF_VIEW / 2));
  const distance = ((span / 2) * fit) / halfHeight;
  camera.position.set(0, center + distance * LOOK_DOWN, distance);
  camera.lookAt(0, center, 0);
}

/** How many CSS pixels one centimetre covers at the plant's depth. */
export function pixelsPerCentimetre(
  camera: PerspectiveCamera,
  viewportHeight: number,
  span: number,
): number {
  const fit = Math.max(1, NARROWEST_ASPECT / camera.aspect);
  return viewportHeight / (span * fit);
}
