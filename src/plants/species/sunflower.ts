import { createBlade, outlines } from '../geometry';
import {
  blade,
  framing,
  GOLDEN_ANGLE,
  reachedAt,
  ring,
  stem,
  type BladeSpec,
  type LeafSpec,
  type Species,
} from '../form';

const STEM = 0x7d9a4c;
const LEAF_BASE = 0x3f7a3a;
const LEAF_TIP = 0x7fae4e;
const PHYLLARY = 0x5d8a3e;
const RAY_BASE = 0xf0a412;
const RAY_TIP = 0xffd92e;
const DISC_BASE = 0x2f1c0e;
const DISC_OUTER = 0xc9861c;
const DISC_INNER = 0x4a2d12;
const RECEPTACLE = 0x3a2a14;

const DISC_RADIUS = 7;
// Published counts run 150 to over 1000, and a Fibonacci number shows the spirals clearly.
const DISC_FLORETS = 610;

/** Florets on the golden angle, which makes the head's spirals. They open from the rim inwards. */
function discFlorets(): BladeSpec[] {
  return Array.from({ length: DISC_FLORETS }, (_, i) => {
    const t = Math.sqrt((i + 0.5) / DISC_FLORETS);
    const start = 0.5 + 0.3 * (1 - t);
    return blade({
      role: 'floret',
      azimuth: i * GOLDEN_ANGLE,
      radial: DISC_RADIUS * t,
      axial: 1.1 * (1 - t * t),
      start,
      emergeEnd: start + 0.1,
      openStart: start + 0.05,
      openEnd: start + 0.2,
      spread: 0.1 + 0.5 * t,
      openCurl: 0,
      length: 0.8,
      width: 0.2,
      skew: 1,
      power: 0.3,
      baseColor: DISC_BASE,
      tipColor: t > 0.65 ? DISC_OUTER : DISC_INNER,
    });
  });
}

export const sunflower: Species = {
  id: 'sunflower',
  commonName: 'Common sunflower',
  scientificName: 'Helianthus annuus',
  family: 'Asteraceae',
  habitat: 'Open prairie and plains in full sun',
  height: '100 to 300 cm',
  flower: '17 to 30 ray florets around 150 to 1000 or more disc florets',
  niche: {
    temperature: { min: 5, optMin: 17, optMax: 34, max: 45 },
    humidity: { min: 20, optMin: 35, optMax: 70, max: 85 },
    rainfall: { min: 300, optMin: 600, optMax: 1000, max: 1600 },
    sunlight: { min: 5, optMin: 7, optMax: 14, max: 14 },
  },
  nicheBasis: {
    temperature: 'published',
    humidity: 'derived',
    rainfall: 'published',
    sunlight: 'derived',
  },
  sources: [
    { label: 'FAO EcoCrop', url: 'https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=1191' },
    { label: 'Flora of North America', url: 'http://beta.floranorthamerica.org/Helianthus_annuus' },
  ],
  windowColor: 0x2c1a08,
  framing: framing(120, 52, { center: 8, span: 28 }),
  createForm() {
    const main = stem(
      [
        [0, 0, 0],
        [1, 40, 0.5],
        [-0.5, 85, 0.5],
        [0, 120, 3],
      ],
      [1.5, 0.85],
      { start: 0, end: 0.42, initial: 0.1 },
      STEM,
    );

    const seedLeaf = createBlade({ width: 0.5, outline: outlines.ovate, droop: 0.2 });
    const trueLeaf = createBlade({
      width: 0.82,
      // A long leaf stalk, then a broad heart-shaped blade.
      outline: (v) => (v < 0.2 ? 0.04 : outlines.cordate((v - 0.2) / 0.8)),
      droop: 0.5,
    });

    const leaves: LeafSpec[] = [0, Math.PI].map((azimuth) => ({
      blade: seedLeaf,
      position: main.curve.getPointAt(0.08),
      azimuth: azimuth + 0.4,
      pitch: 1.2,
      length: 5,
      birth: -0.14,
      span: 0.14,
      baseColor: LEAF_BASE,
      tipColor: LEAF_TIP,
      veins: 4,
    }));
    for (let i = 0; i < 10; i++) {
      const along = 0.14 + i * 0.075;
      leaves.push({
        blade: trueLeaf,
        position: main.curve.getPointAt(along),
        // The lowest leaves come in opposite pairs, the rest spiral up the stem.
        azimuth: i < 2 ? (i * Math.PI) / 2 + (i % 2) * Math.PI : i * GOLDEN_ANGLE,
        pitch: 1.2 - i * 0.04,
        length: 34 - i * 1.6,
        birth: reachedAt(main, along),
        span: 0.13,
        baseColor: LEAF_BASE,
        tipColor: LEAF_TIP,
        veins: 6,
      });
    }

    const top = main.curve.getPointAt(1);
    return {
      stems: [main],
      leaves,
      heads: [
        {
          position: top,
          rotation: [1.05, 0, 0],
          detail: [6, 10],
          glow: 0.5,
          veins: 5,
          blades: [
            ...ring(24, {
              role: 'sepal',
              start: 0.4,
              radial: DISC_RADIUS * 0.85,
              spread: 1.5,
              openStart: 0.5,
              openCurl: 0.3,
              length: 2.4,
              width: 1.1,
              skew: 1,
              power: 0.8,
              baseColor: PHYLLARY,
              tipColor: PHYLLARY,
            }),
            ...ring(21, {
              role: 'petal',
              start: 0.5,
              radial: DISC_RADIUS,
              axial: 0.3,
              spread: 1.42,
              openCurl: 0.15,
              length: 5.2,
              width: 1.9,
              skew: 1.25,
              power: 0.55,
              openWrap: 0.3,
              baseColor: RAY_BASE,
              tipColor: RAY_TIP,
            }),
          ],
        },
        {
          position: top,
          rotation: [1.05, 0, 0],
          detail: [1, 2],
          glow: 0.3,
          veins: 0,
          rigid: true,
          blades: discFlorets(),
        },
      ],
      bodies: [
        {
          // The solid base the florets stand on, slightly domed.
          profile: [
            [0.5, -1.4],
            [5, -0.9],
            [DISC_RADIUS + 0.5, -0.1],
            [DISC_RADIUS + 0.3, 0.3],
            [4, 1],
            [0, 1.1],
          ],
          ribs: 0,
          ribDepth: 0,
          position: top,
          rotation: [1.05, 0, 0],
          start: 0.36,
          end: 0.72,
          initial: 0.1,
          baseColor: RECEPTACLE,
          tipColor: DISC_BASE,
          heads: [],
        },
      ],
    };
  },
};
