import { Euler, Vector3 } from 'three';
import {
  blade,
  framing,
  GOLDEN_ANGLE,
  stem,
  type BladeSpec,
  type HeadSpec,
  type Species,
  type StemSpec,
} from '../form';

const STEM = 0x7f9a78;
const LEAF_BASE = 0x5c7f70;
const LEAF_TIP = 0x9fc0ac;
const CALYX_BASE = 0x5b3f7c;
const CALYX_TIP = 0x8468a8;
const COROLLA_BASE = 0x6d4bb8;
const COROLLA_TIP = 0xb398f2;

const SHOOTS = 9;
const NODES = 9;
const SPIKE_LENGTH = 6;
const TIERS = 9;
const FLORETS_PER_TIER = 8;

/** Leaves in opposite pairs, each pair turned a quarter from the last, on the lower shoot. */
function leavesOn(height: number, start: number, end: number): BladeSpec[] {
  const blades: BladeSpec[] = [];
  for (let node = 0; node < NODES; node++) {
    const axial = height * (0.04 + node * 0.05);
    const reached = start + (end - start) * (axial / height);
    for (const side of [0, Math.PI]) {
      blades.push(
        blade({
          role: 'leaf',
          azimuth: side + (node * Math.PI) / 2,
          axial,
          start: reached,
          emergeEnd: reached + 0.1,
          openStart: reached + 0.02,
          openEnd: reached + 0.14,
          spread: 0.85,
          openCurl: 0.25,
          length: 2.5,
          width: 0.42,
          skew: 1,
          power: 0.35,
          openWrap: 0.3,
          baseColor: LEAF_BASE,
          tipColor: LEAF_TIP,
        }),
      );
    }
  }
  return blades;
}

/** Tiers of two-lipped flowers around the spike, opening from the bottom upwards. */
function spikeOn(height: number): BladeSpec[] {
  const blades: BladeSpec[] = [];
  for (let tier = 0; tier < TIERS; tier++) {
    const axial = height - SPIKE_LENGTH + (tier / (TIERS - 1)) * SPIKE_LENGTH;
    const start = 0.42 + tier * 0.02;
    const openStart = 0.6 + tier * 0.045;
    for (let i = 0; i < FLORETS_PER_TIER; i++) {
      const azimuth = (i / FLORETS_PER_TIER) * Math.PI * 2 + tier * 0.4;
      const shared = { azimuth, axial, radial: 0.2, start, openStart, openEnd: openStart + 0.13 };
      blades.push(
        blade({
          ...shared,
          role: 'sepal',
          spread: 0.3,
          openCurl: 0,
          length: 0.5,
          width: 0.24,
          skew: 0.8,
          baseColor: CALYX_BASE,
          tipColor: CALYX_TIP,
        }),
        blade({
          ...shared,
          role: 'petal',
          axial: axial + 0.25,
          spread: 0.45,
          openCurl: -0.6,
          length: 0.45,
          width: 0.36,
          skew: 1.1,
          baseColor: COROLLA_BASE,
          tipColor: COROLLA_TIP,
        }),
        blade({
          ...shared,
          role: 'petal',
          axial: axial + 0.2,
          spread: 0.95,
          openCurl: 0.5,
          length: 0.42,
          width: 0.38,
          skew: 1.1,
          baseColor: COROLLA_BASE,
          tipColor: COROLLA_TIP,
        }),
      );
    }
  }
  return blades;
}

export const lavender: Species = {
  id: 'lavender',
  commonName: 'True lavender',
  scientificName: 'Lavandula angustifolia',
  family: 'Lamiaceae',
  habitat: 'Dry, sunny Mediterranean slopes',
  height: 'Up to 60 cm',
  flower: 'Spikes of two-lipped flowers, thin opposite leaves',
  niche: {
    temperature: { min: 7, optMin: 15, optMax: 24, max: 28 },
    humidity: { min: 20, optMin: 35, optMax: 60, max: 75 },
    rainfall: { min: 300, optMin: 500, optMax: 1000, max: 1300 },
    sunlight: { min: 4, optMin: 6, optMax: 12, max: 14 },
  },
  nicheBasis: {
    temperature: 'published',
    humidity: 'derived',
    rainfall: 'published',
    sunlight: 'published',
  },
  sources: [
    { label: 'FAO EcoCrop', url: 'https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=7172' },
    {
      label: 'NC State Extension',
      url: 'https://plants.ces.ncsu.edu/plants/lavandula-angustifolia/',
    },
  ],
  windowColor: 0x1e1642,
  framing: framing(55, 38, { center: 6, span: 22 }),
  createForm() {
    const stems: StemSpec[] = [];
    const heads: HeadSpec[] = [];

    for (let i = 0; i < SHOOTS; i++) {
      const height = i === 0 ? 55 : 36 + 14 * Math.abs(Math.sin(i * 2.3));
      const start = i * 0.03;
      const end = start + 0.32;
      const lean = i === 0 ? 0.01 : 0.12 + i * 0.022;
      const rotation: [number, number, number] = [lean, i * GOLDEN_ANGLE, 0];
      const tip = new Vector3(0, height, 0).applyEuler(new Euler(...rotation, 'YXZ'));
      const base = new Vector3(Math.sin(i * 2.4), 0, Math.cos(i * 2.4)).multiplyScalar(
        i === 0 ? 0 : 1.2,
      );

      stems.push(
        stem(
          [
            [base.x, 0, base.z],
            [base.x + tip.x / 2, tip.y / 2, base.z + tip.z / 2],
            [base.x + tip.x, tip.y, base.z + tip.z],
          ],
          [0.14, 0.05],
          { start, end, initial: i === 0 ? 0.12 : 0.02 },
          STEM,
        ),
      );
      heads.push({
        position: base,
        rotation,
        detail: [1, 3],
        glow: 0.35,
        veins: 0,
        blades: [...leavesOn(height, start, end), ...spikeOn(height)],
      });
    }

    return { stems, leaves: [], heads, bodies: [] };
  },
};
