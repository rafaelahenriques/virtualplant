import type { Point, Size } from '../core/math';

/** Maps video pixels to viewport pixels, as if the video covered the viewport edge to edge. */
export function videoToViewport(point: Point, video: Size, viewport: Size): Point {
  const scale = Math.max(viewport.width / video.width, viewport.height / video.height);
  return {
    x: viewport.width / 2 + (point.x - video.width / 2) * scale,
    y: viewport.height / 2 + (point.y - video.height / 2) * scale,
  };
}
