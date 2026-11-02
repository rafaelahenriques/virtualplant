import { Vector3 } from 'three';
import { createBlade, outlines } from '../geometry';
import { framing, GOLDEN_ANGLE, ring, stem, type LeafSpec, type Species } from '../form';

const SCAPE = 0x6f8f62;
const LEAF_BASE = 0x4a7a55;
const LEAF_TIP = 0x8aa96e;
const SEPAL = 0x3f6a48;
const PETAL_BASE = 0xf2c81e;
const PETAL_TIP = 0xfff2a0;
const ANTHER = 0xe8b820;
const STIGMA = 0x5a6a2e;

export const poppy: Species = {
  id: 'poppy',
  commonName: 'Arctic poppy',
  scientificName: 'Papaver radicatum',
  habitat: 'Gravel, scree and rocky tundra of the high Arctic',
  height: 'Under 15 cm',
  flower: '2 sepals that drop as it opens, 4 yellow or white petals, a nodding bud',
  niche: {
    temperature: { min: -2, optMin: 2, optMax: 11, max: 16 },
    humidity: { min: 50, optMin: 65, optMax: 90, max: 100 },
    rainfall: { min: 60, optMin: 150, optMax: 400, max: 700 },
    sunlight: { min: 2, optMin: 4, optMax: 12, max: 14 },
  },
  nicheBasis: {
    temperature: 'published',
    humidity: 'derived',
    rainfall: 'published',
    sunlight: 'derived',
  },
  sources: [
    { label: 'Flora of North America', url: 'https://floranorthamerica.org/Papaver_radicatum' },
    {
      label: 'NASA, tundra climate',
      url: 'https://science.nasa.gov/kids/earth/mission-biomes/biotundra',
    },
    {
      label: 'UC Museum of Paleontology, tundra',
      url: 'https://ucmp.berkeley.edu/exhibits/biomes/tundra.php',
    },
  ],
  windowColor: 0x10263a,
  framing: framing(15.5, 16, { center: 3, span: 11 }),
  createForm() {
    const scape = stem(
      [
        [0, 0, 0],
        [0.3, 6, 0.1],
        [0.3, 11, 0.2],
        [0, 14, 0.5],
      ],
      [0.09, 0.07],
      { start: 0.22, end: 0.48 },
      SCAPE,
    );

    const lobed = createBlade({ width: 0.3, outline: outlines.lobed, droop: 0.45, segments: 30 });
    const leaves = Array.from({ length: 14 }, (_, i): LeafSpec => ({
      blade: lobed,
      // A basal tuft: every leaf rises from ground level, spiralling round.
      position: new Vector3(0, 0.3 + i * 0.03, 0),
      azimuth: i * GOLDEN_ANGLE,
      pitch: 1.2 - i * 0.05,
      length: 5 + (i % 4) * 0.8,
      birth: i < 3 ? -0.14 : (i - 2) * 0.03,
      span: 0.14,
      baseColor: LEAF_BASE,
      tipColor: LEAF_TIP,
      veins: 3,
    }));

    const top = scape.curve.getPointAt(1);
    const petal = {
      role: 'petal' as const,
      spread: 1,
      openCurl: -0.35,
      length: 3,
      width: 3.8,
      skew: 1.35,
      power: 0.42,
      openWrap: 0.9,
      baseColor: PETAL_BASE,
      tipColor: PETAL_TIP,
    };
    // The bud hangs from the top of the stalk, then lifts as it opens.
    const nod = {
      rotation: [0.55, 0, 0] as [number, number, number],
      budRotation: [2.7, 0, 0] as [number, number, number],
      openAt: [0.52, 0.66] as [number, number],
    };

    return {
      stems: [scape],
      leaves,
      heads: [
        {
          ...nod,
          position: top,
          detail: [8, 12],
          glow: 0.7,
          veins: 9,
          blades: [
            ...ring(
              2,
              {
                role: 'sepal',
                start: 0.38,
                spread: 0.6,
                length: 1.5,
                width: 1.5,
                skew: 1,
                power: 0.6,
                openStart: 0.62,
                // Sepals drop off as the flower opens.
                shedAt: 0.62,
                baseColor: SEPAL,
                tipColor: SEPAL,
              },
              0,
              0,
            ),
            ...ring(2, { ...petal, start: 0.44 }, 0.6, 0.02),
            ...ring(2, { ...petal, start: 0.48 }, 0.6 + Math.PI / 2, 0.02),
          ],
        },
        {
          ...nod,
          position: top,
          detail: [1, 3],
          glow: 0.4,
          veins: 0,
          blades: [
            ...ring(36, {
              role: 'stamen',
              start: 0.64,
              radial: 0.25,
              spread: 0.65,
              openCurl: 0,
              length: 1,
              width: 0.09,
              skew: 1,
              power: 0.3,
              baseColor: PETAL_TIP,
              tipColor: ANTHER,
            }),
            ...ring(5, {
              role: 'pistil',
              start: 0.64,
              axial: 0.75,
              spread: 1.35,
              openCurl: 0,
              length: 0.4,
              width: 0.12,
              skew: 1,
              baseColor: STIGMA,
              tipColor: STIGMA,
            }),
          ],
        },
      ],
      bodies: [],
    };
  },
};
