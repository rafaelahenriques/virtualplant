import type { Point, Size } from './math';

const SIZE_RATIO = 0.38;
const FOLLOW_RATE = 6;

/** A square in CSS pixels, measured from the top left of the viewport. */
export interface ScanRect {
  x: number;
  y: number;
  size: number;
}

/** The square that shows the plant in colour. Eases towards its target to hide tracking jitter. */
export class ScanWindow {
  private center: Point;

  constructor(center: Point) {
    this.center = { ...center };
  }

  /** Both points are fractions of the viewport. */
  update(target: Point, delta: number): void {
    const ease = 1 - Math.exp(-FOLLOW_RATE * delta);
    this.center = {
      x: this.center.x + (target.x - this.center.x) * ease,
      y: this.center.y + (target.y - this.center.y) * ease,
    };
  }

  /** Whole pixels, kept fully inside the viewport. */
  rect(viewport: Size): ScanRect {
    const size = Math.round(Math.min(viewport.width, viewport.height) * SIZE_RATIO);
    const place = (center: number, length: number) =>
      Math.round(Math.min(length - size, Math.max(0, center * length - size / 2)));

    return {
      x: place(this.center.x, viewport.width),
      y: place(this.center.y, viewport.height),
      size,
    };
  }
}
