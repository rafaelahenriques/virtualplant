import { InstancedBufferAttribute, InstancedBufferGeometry, PlaneGeometry } from 'three';

interface Whorl {
  count: number;
  /** Growth stage at which this ring starts to form. */
  start: number;
  /** Angle from the flower's axis, in radians, once fully open. */
  spread: number;
  length: number;
  width: number;
}

// Outermost first. Each ring forms later than the one around it and opens less far.
const WHORLS: Whorl[] = [
  { count: 6, start: 0.4, spread: 1.95, length: 0.36, width: 0.2 }, // sepals
  { count: 9, start: 0.48, spread: 1.6, length: 0.7, width: 0.5 },
  { count: 9, start: 0.56, spread: 1.25, length: 0.62, width: 0.46 },
  { count: 8, start: 0.64, spread: 0.9, length: 0.5, width: 0.38 },
  { count: 6, start: 0.72, spread: 0.5, length: 0.38, width: 0.3 },
  { count: 48, start: 0.8, spread: 0.55, length: 0.24, width: 0.014 }, // stamens
];

const ATTRIBUTES = [
  ['aAzimuth', 'azimuth'],
  ['aStart', 'start'],
  ['aSpread', 'spread'],
  ['aLength', 'length'],
  ['aWidth', 'width'],
] as const;

/**
 * One petal shape instanced for every ring. Its form at each growth stage is computed in
 * petal.vert from these per-petal attributes, so the whole flower is a single draw call.
 */
export function createFlowerGeometry(): InstancedBufferGeometry {
  const petals = WHORLS.flatMap((whorl, ring) =>
    Array.from({ length: whorl.count }, (_, i) => {
      // Small repeatable offsets stop the rings looking machine-made.
      const variation = Math.sin(i * 7.3 + ring * 2.1);
      return {
        azimuth: (i / whorl.count) * Math.PI * 2 + ring * 0.7 + variation * 0.12,
        start: whorl.start,
        spread: whorl.spread * (1 + variation * 0.06),
        length: whorl.length * (1 + variation * 0.08),
        width: whorl.width,
      };
    }),
  );

  const plane = new PlaneGeometry(1, 1, 8, 14);
  const geometry = new InstancedBufferGeometry();
  geometry.setIndex(plane.getIndex());
  geometry.setAttribute('position', plane.getAttribute('position'));
  geometry.setAttribute('uv', plane.getAttribute('uv'));
  geometry.instanceCount = petals.length;

  for (const [name, key] of ATTRIBUTES) {
    const values = Float32Array.from(petals, (petal) => petal[key]);
    geometry.setAttribute(name, new InstancedBufferAttribute(values, 1));
  }

  return geometry;
}
