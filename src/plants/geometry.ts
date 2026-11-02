import {
  BufferGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix4,
  PlaneGeometry,
  Vector3,
  Color,
  type Curve,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BladeSpec } from './form';

export const STEM_RADIAL_SEGMENTS = 8;

/** Leaf outlines: the blade's width as a fraction of its maximum, from base to tip. */
export const outlines = {
  lanceolate: (v: number) => Math.sin(Math.PI * v ** 0.8),
  ovate: (v: number) => Math.sin(Math.PI * v ** 0.65) ** 0.8,
  /** Heart-shaped: widest close to the base. */
  cordate: (v: number) => Math.sin(Math.PI * v ** 0.5) ** 0.7,
  /** Parallel-sided, like an orchid leaf or a lavender needle. */
  strap: (v: number) => Math.sin(Math.PI * v ** 0.9) ** 0.35,
  /** Diamond-shaped with its widest point below the middle, like a trillium bract. */
  rhombic: (v: number) => (v < 0.4 ? v / 0.4 : (1 - v) / 0.6) ** 0.75,
  /** Deeply cut into lobes, like an arctic poppy leaf. */
  lobed: (v: number) => Math.sin(Math.PI * v ** 0.85) * (0.45 + 0.55 * Math.abs(Math.cos(v * 13))),
};

interface BladeOptions {
  /** Maximum width as a fraction of length. */
  width: number;
  outline: (v: number) => number;
  droop?: number;
  /** How far the midrib sits below the margins. */
  fold?: number;
  segments?: number;
}

/** A leaf blade of length 1: base at the origin, tip along +Y, drooping along +Z. */
export function createBlade({
  width,
  outline,
  droop = 0.25,
  fold = 0.02,
  segments = 16,
}: BladeOptions): BufferGeometry {
  const columns = 4;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= segments; row++) {
    const v = row / segments;
    const half = (width / 2) * Math.max(0, outline(v));
    for (let column = 0; column <= columns; column++) {
      const u = column / columns;
      const across = 2 * u - 1;
      positions.push(across * half, v, droop * v * v - fold * (1 - Math.abs(across)));
      uvs.push(u, v);
      if (row < segments && column < columns) {
        const a = row * (columns + 1) + column;
        const b = a + columns + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Twice-divided by three: a stalk, three branches, nine leaflets, as on a peony. */
export function createBiternateLeaf(): BufferGeometry {
  const leaflet = createBlade({ width: 0.34, outline: outlines.lanceolate, droop: 0.2 });
  const stalk = createBlade({ width: 0.012, outline: () => 1, droop: 0 });

  const place = (geometry: BufferGeometry, x: number, y: number, angle: number, scale: number) =>
    geometry.clone().applyMatrix4(
      new Matrix4()
        .makeRotationZ(angle)
        .scale(new Vector3(scale, scale, scale))
        .setPosition(x, y, 0),
    );

  const parts = [place(stalk, 0, 0, 0, 0.5)];
  for (const side of [-1, 0, 1]) {
    const branchAngle = side * 0.75;
    const branchLength = 0.22;
    parts.push(place(stalk, 0, 0.5, branchAngle, branchLength));

    const forkX = -Math.sin(branchAngle) * branchLength;
    const forkY = 0.5 + Math.cos(branchAngle) * branchLength;
    for (const offset of [-0.7, 0, 0.7]) {
      const scale = offset === 0 ? 0.42 : 0.34;
      parts.push(place(leaflet, forkX, forkY, branchAngle + offset, scale));
    }
  }

  const merged = mergeGeometries(parts);
  merged.computeVertexNormals();
  return merged;
}

/** A round leaf held at its centre, cupped upwards, radius 1. Lies in the XZ plane. */
export function createPeltateLeaf(cup = 0.22, wave = 0.05): BufferGeometry {
  const rings = 10;
  const segments = 40;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= rings; i++) {
    const r = i / rings;
    for (let j = 0; j <= segments; j++) {
      const theta = (j / segments) * Math.PI * 2;
      const y = cup * r * r + wave * r * r * r * Math.sin(theta * 5);
      positions.push(Math.sin(theta) * r, y, Math.cos(theta) * r);
      // Kept away from 0 and 1 so the x-ray rim, meant for blade margins, stays off.
      uvs.push(0.2 + 0.6 * (j / segments), r);
      if (i < rings && j < segments) {
        const a = i * (segments + 1) + j;
        const b = a + segments + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** A tapering tube whose triangles run from base to tip, so a draw range reveals it as it grows. */
export function createStemGeometry(
  curve: Curve<Vector3>,
  [baseRadius, tipRadius]: [number, number],
  segments: number,
): BufferGeometry {
  const frames = curve.computeFrenetFrames(segments, false);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const point = new Vector3();
  const normal = new Vector3();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, point);
    const radius = baseRadius + (tipRadius - baseRadius) * t;
    for (let j = 0; j < STEM_RADIAL_SEGMENTS; j++) {
      const theta = (j / STEM_RADIAL_SEGMENTS) * Math.PI * 2;
      normal
        .copy(frames.normals[i] as Vector3)
        .multiplyScalar(Math.cos(theta))
        .addScaledVector(frames.binormals[i] as Vector3, Math.sin(theta));
      positions.push(
        point.x + normal.x * radius,
        point.y + normal.y * radius,
        point.z + normal.z * radius,
      );
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(0.5, t);
      if (i < segments) {
        const next = (j + 1) % STEM_RADIAL_SEGMENTS;
        const a = i * STEM_RADIAL_SEGMENTS;
        const b = a + STEM_RADIAL_SEGMENTS;
        indices.push(a + j, a + next, b + j, a + next, b + next, b + j);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

/** A solid of revolution with optional ribs: a cactus stem, or a lotus seed pod. */
export function createBodyGeometry(
  profile: [number, number][],
  ribs: number,
  ribDepth: number,
): BufferGeometry {
  const segments = ribs > 0 ? ribs * 8 : 32;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const height = profile[profile.length - 1]?.[1] ?? 1;

  profile.forEach(([radius, y], i) => {
    for (let j = 0; j < segments; j++) {
      const theta = (j / segments) * Math.PI * 2;
      // Crests sit where the sine is 0, at azimuths 2πk / ribs.
      const groove = ribs > 0 ? Math.abs(Math.sin((ribs * theta) / 2)) ** 1.5 : 0;
      const r = radius * (1 - ribDepth * groove);
      positions.push(Math.sin(theta) * r, y, Math.cos(theta) * r);
      uvs.push(0.5, y / height);
      if (i < profile.length - 1) {
        const next = (j + 1) % segments;
        const a = i * segments;
        const b = a + segments;
        indices.push(a + j, a + next, b + j, a + next, b + next, b + j);
      }
    }
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const planes = new Map<string, PlaneGeometry>();

function planeFor([across, along]: [number, number]): PlaneGeometry {
  const key = `${across}x${along}`;
  let plane = planes.get(key);
  if (!plane) {
    plane = new PlaneGeometry(1, 1, across, along);
    planes.set(key, plane);
  }
  return plane;
}

/**
 * One blade shape instanced for every part of a flower head. Its form at each growth stage is
 * computed in petal.vert from these attributes, so a whole head is a single draw call.
 */
export function createHeadGeometry(
  blades: BladeSpec[],
  detail: [number, number],
): InstancedBufferGeometry {
  const plane = planeFor(detail);
  const geometry = new InstancedBufferGeometry();
  geometry.setIndex(plane.getIndex());
  geometry.setAttribute('position', plane.getAttribute('position'));
  geometry.setAttribute('uv', plane.getAttribute('uv'));
  geometry.instanceCount = blades.length;

  const attribute = (name: string, size: number, read: (blade: BladeSpec) => number[]) =>
    geometry.setAttribute(
      name,
      new InstancedBufferAttribute(Float32Array.from(blades.flatMap(read)), size),
    );

  attribute('aPlacement', 3, (b) => [b.azimuth, b.axial, b.radial]);
  attribute('aTiming', 4, (b) => [b.start, b.emergeEnd, b.openStart, b.openEnd]);
  attribute('aForm', 4, (b) => [b.spread, b.openCurl, b.length, b.width]);
  attribute('aShape', 4, (b) => [b.skew, b.power, b.openWrap, b.shedAt]);
  attribute('aBaseColor', 3, (b) => new Color(b.baseColor).toArray());
  attribute('aTipColor', 3, (b) => new Color(b.tipColor).toArray());

  return geometry;
}
