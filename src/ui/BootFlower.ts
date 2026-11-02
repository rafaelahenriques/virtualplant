// A flower drawn as dithered squares, sharpening from coarse blocks to fine stipple as a line
// moves down it. It only ever shows the progress it is given.

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// Cell size in pixels, and where its band ends relative to the progress line, as a fraction of
// the flower's height. Above the line it is sharp, and below it each band gets coarser.
const BANDS: [number, number][] = [
  [3, -0.08],
  [6, -0.02],
  [12, 0.06],
  [24, Infinity],
];

// Loose squares around the flower: x, y, and the progress at which each appears.
const STRAY_BLOCKS: [number, number, number][] = [
  [0.06, 0.2, 0.05],
  [0.14, 0.74, 0.25],
  [0.82, 0.12, 0.4],
  [0.92, 0.58, 0.15],
  [0.76, 0.9, 0.55],
  [0.3, 0.05, 0.65],
  [0.05, 0.5, 0.8],
];
const STRAY_BLOCK_SIZE = 12;
const STRAY_BLOCK_LIFE = 0.3;

// Reach, petal count and rotation of each ring, outermost first.
const PETAL_RINGS: [number, number, number][] = [
  [0.98, 8, 0.2],
  [0.76, 8, 0.6],
  [0.54, 6, 1.1],
  [0.32, 5, 0.3],
];

/** Rings of petals seen from above, brighter at each rim and along fine radial veins. */
function flowerIntensity(x: number, y: number): number {
  const radius = Math.hypot(x, y);
  if (radius > 1) return 0;
  const angle = Math.atan2(y, x);

  let intensity = 0;
  for (const [reach, petals, rotation] of PETAL_RINGS) {
    const lobe = Math.abs(Math.cos((angle * petals) / 2 + rotation)) ** 0.55;
    const edge = reach * (0.62 + 0.38 * lobe);
    if (radius <= edge) intensity += 0.1 + 0.42 * (radius / edge) ** 3.2;
  }

  const veins = Math.abs(Math.cos(angle * 42)) ** 10;
  return Math.min(1, intensity * (0.82 + 0.3 * veins) + 0.5 * Math.exp(-((radius / 0.1) ** 2)));
}

export class BootFlower {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private size = 0;
  private drawnAt = -1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D canvas is not available');
    this.context = context;
    this.resize();
  }

  resize(): void {
    this.size = Math.round(this.canvas.clientWidth);
    const ratio = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = this.size * ratio;
    this.canvas.height = this.size * ratio;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.drawnAt = -1;
  }

  /** `progress` runs from 0 to 1. Redraws only when it has moved enough to show. */
  draw(progress: number): void {
    if (Math.abs(progress - this.drawnAt) < 0.004) return;
    this.drawnAt = progress;

    const { context, size } = this;
    context.clearRect(0, 0, size, size);
    context.fillStyle = '#eef1ec';

    let top = 0;
    for (const [cell, offset] of BANDS) {
      const bottom = Math.min(size, Math.max(top, (progress + offset) * size));
      this.drawBand(cell, top, bottom);
      top = bottom;
    }

    for (const [x, y, appearsAt] of STRAY_BLOCKS) {
      if (progress < appearsAt || progress > appearsAt + STRAY_BLOCK_LIFE) continue;
      context.fillRect(
        Math.round(x * size),
        Math.round(y * size),
        STRAY_BLOCK_SIZE,
        STRAY_BLOCK_SIZE,
      );
    }
  }

  private drawBand(cell: number, top: number, bottom: number): void {
    const { context, size } = this;
    const half = size / 2;
    const firstRow = Math.ceil(top / cell);

    for (let row = firstRow; row * cell < bottom; row++) {
      for (let column = 0; column * cell < size; column++) {
        const intensity = flowerIntensity(
          ((column + 0.5) * cell - half) / half,
          ((row + 0.5) * cell - half) / half,
        );
        const threshold = ((BAYER[(row & 3) * 4 + (column & 3)] ?? 0) + 0.5) / BAYER.length;
        if (intensity > threshold) context.fillRect(column * cell, row * cell, cell, cell);
      }
    }
  }
}
