import { createBiternateLeaf } from '../geometry';
import { framing, GOLDEN_ANGLE, reachedAt, ring, stem, type LeafSpec, type Species } from '../form';

const STEM = 0x6f8f4e;
const LEAF_BASE = 0x2f6b45;
const LEAF_TIP = 0x6fae6a;
const SEPAL_BASE = 0x4c7f4a;
const SEPAL_TIP = 0x9db96b;
const PETAL_BASE = 0xe2598b;
const PETAL_TIP = 0xfbd6e0;
const STAMEN_BASE = 0xf4e6a0;
const ANTHER = 0xf2c230;

export const peony: Species = {
  id: 'peony',
  commonName: 'Chinese peony',
  scientificName: 'Paeonia lactiflora',
  family: 'Paeoniaceae',
  habitat: 'Temperate East Asia, needs winter chill',
  height: '30 to 90 cm',
  flower: '7 to 20 petals, nine leaflets per leaf, many yellow stamens',
  niche: {
    temperature: { min: 6, optMin: 12, optMax: 22, max: 28 },
    humidity: { min: 30, optMin: 45, optMax: 75, max: 90 },
    rainfall: { min: 450, optMin: 600, optMax: 1200, max: 1600 },
    sunlight: { min: 3, optMin: 5, optMax: 10, max: 13 },
  },
  nicheBasis: {
    temperature: 'derived',
    humidity: 'derived',
    rainfall: 'derived',
    sunlight: 'published',
  },
  sources: [
    {
      label: 'NC State Extension',
      url: 'https://plants.ces.ncsu.edu/plants/paeonia-herbaceous-types/',
    },
    { label: 'Royal Horticultural Society', url: 'https://www.rhs.org.uk/plants/12123/wd/details' },
    {
      label: 'NASA, temperate forest climate',
      url: 'https://science.nasa.gov/kids/earth/mission-biomes/biotemperate',
    },
  ],
  windowColor: 0x4a0f2e,
  framing: framing(70, 46, { center: 10, span: 34 }),
  createForm() {
    const main = stem(
      [
        [0, 0, 0],
        [1.5, 25, 0.5],
        [-1, 50, 1],
        [0.5, 70, 3],
      ],
      [0.5, 0.28],
      { start: 0, end: 0.4, initial: 0.2 },
      STEM,
    );
    const top = main.curve.getPointAt(1);

    const blade = createBiternateLeaf();
    const leaves = Array.from({ length: 7 }, (_, i): LeafSpec => {
      const along = 0.16 + i * 0.1;
      return {
        blade,
        position: main.curve.getPointAt(along),
        azimuth: i * GOLDEN_ANGLE,
        pitch: 1.15 - i * 0.08,
        length: 30 - i * 2.2,
        birth: i === 0 ? -0.14 : reachedAt(main, along),
        span: 0.14,
        baseColor: LEAF_BASE,
        tipColor: LEAF_TIP,
        veins: 6,
      };
    });

    return {
      stems: [main],
      leaves,
      heads: [
        {
          position: top,
          rotation: [0.75, 0, 0],
          detail: [8, 14],
          glow: 0.55,
          veins: 7,
          blades: [
            ...ring(4, {
              role: 'sepal',
              start: 0.4,
              spread: 1.7,
              length: 2.4,
              width: 2,
              skew: 1.1,
              baseColor: SEPAL_BASE,
              tipColor: SEPAL_TIP,
            }),
            ...ring(7, {
              role: 'petal',
              start: 0.46,
              spread: 1.3,
              length: 6.5,
              width: 5.2,
              baseColor: PETAL_BASE,
              tipColor: PETAL_TIP,
            }),
            ...ring(
              6,
              {
                role: 'petal',
                start: 0.52,
                spread: 0.95,
                length: 5.6,
                width: 4.6,
                baseColor: PETAL_BASE,
                tipColor: PETAL_TIP,
              },
              0.5,
            ),
          ],
        },
        {
          position: top,
          rotation: [0.75, 0, 0],
          detail: [1, 4],
          glow: 0.4,
          veins: 0,
          blades: [
            ...ring(60, {
              role: 'stamen',
              start: 0.68,
              radial: 0.4,
              spread: 0.75,
              openCurl: 0,
              length: 1.8,
              width: 0.12,
              skew: 1,
              power: 0.3,
              baseColor: STAMEN_BASE,
              tipColor: ANTHER,
            }),
            ...ring(4, {
              role: 'pistil',
              start: 0.68,
              spread: 0.2,
              openCurl: 0,
              length: 1,
              width: 0.5,
              skew: 1,
              baseColor: SEPAL_TIP,
              tipColor: PETAL_BASE,
            }),
          ],
        },
      ],
      bodies: [],
    };
  },
};
