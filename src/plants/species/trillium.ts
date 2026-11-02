import { createBlade, outlines } from '../geometry';
import { framing, ring, stem, type LeafSpec, type Species } from '../form';

const STEM = 0x5e8a58;
const LEAF_BASE = 0x2c6a48;
const LEAF_TIP = 0x4f9a68;
const SEPAL_BASE = 0x3f7f4f;
const SEPAL_TIP = 0x6fae62;
const PETAL_BASE = 0xeef3df;
const PETAL_TIP = 0xffffff;
const ANTHER = 0xe9c23a;
const STIGMA = 0xf2f4e6;

export const trillium: Species = {
  id: 'trillium',
  commonName: 'White trillium',
  scientificName: 'Trillium grandiflorum',
  habitat: 'Moist, shaded floors of eastern North American forests',
  height: '20 to 45 cm',
  flower: 'Everything in threes: 3 bracts, 3 sepals, 3 white petals',
  niche: {
    temperature: { min: 4, optMin: 10, optMax: 20, max: 26 },
    humidity: { min: 45, optMin: 60, optMax: 90, max: 100 },
    rainfall: { min: 650, optMin: 900, optMax: 1800, max: 2300 },
    sunlight: { min: 0, optMin: 0.5, optMax: 3, max: 5 },
  },
  nicheBasis: {
    temperature: 'derived',
    humidity: 'derived',
    rainfall: 'published',
    sunlight: 'published',
  },
  sources: [
    { label: 'Flora of North America', url: 'http://floranorthamerica.org/Trillium_grandiflorum' },
    {
      label: 'NPS, Great Smoky Mountains climate',
      url: 'https://www.nps.gov/grsm/planyourvisit/weather.htm',
    },
    {
      label: 'NASA, temperate forest climate',
      url: 'https://science.nasa.gov/kids/earth/mission-biomes/biotemperate',
    },
  ],
  windowColor: 0x0c2a22,
  framing: framing(33, 36, { center: 8, span: 28 }),
  createForm() {
    const main = stem(
      [
        [0, 0, 0],
        [0.4, 12, 0],
        [-0.2, 22, 0.2],
        [0, 27, 0.3],
      ],
      [0.3, 0.22],
      { start: 0, end: 0.28, initial: 0.3 },
      STEM,
    );
    const pedicel = stem(
      [
        [0, 27, 0.3],
        [0.2, 30, 0.9],
        [0.3, 33, 2.4],
      ],
      [0.13, 0.1],
      { start: 0.26, end: 0.42 },
      STEM,
    );

    const bract = createBlade({ width: 0.72, outline: outlines.rhombic, droop: 0.32, fold: 0.03 });
    const leaves = [0, 1, 2].map((i): LeafSpec => ({
      blade: bract,
      position: main.curve.getPointAt(1),
      azimuth: 0.35 + (i * Math.PI * 2) / 3,
      pitch: 1.28,
      length: 15,
      birth: 0,
      span: 0.3,
      baseColor: LEAF_BASE,
      tipColor: LEAF_TIP,
      veins: 7,
    }));

    const top = pedicel.curve.getPointAt(1);
    return {
      stems: [main, pedicel],
      leaves,
      heads: [
        {
          position: top,
          rotation: [0.85, 0, 0],
          detail: [8, 14],
          glow: 0.7,
          veins: 9,
          blades: [
            ...ring(
              3,
              {
                role: 'sepal',
                start: 0.38,
                spread: 1.4,
                length: 4,
                width: 1.4,
                skew: 0.9,
                power: 0.9,
                openCurl: 0.2,
                baseColor: SEPAL_BASE,
                tipColor: SEPAL_TIP,
              },
              Math.PI / 3,
              0.02,
            ),
            ...ring(
              3,
              {
                role: 'petal',
                start: 0.45,
                spread: 0.78,
                length: 6.2,
                width: 4.2,
                skew: 1.15,
                power: 0.7,
                // Recurves above the middle into a funnel.
                openCurl: 1.1,
                openWrap: 0.5,
                baseColor: PETAL_BASE,
                tipColor: PETAL_TIP,
              },
              0,
              0.02,
            ),
          ],
        },
        {
          position: top,
          rotation: [0.85, 0, 0],
          detail: [1, 4],
          glow: 0.5,
          veins: 0,
          blades: [
            ...ring(
              6,
              {
                role: 'stamen',
                start: 0.66,
                radial: 0.2,
                spread: 0.3,
                openCurl: 0,
                length: 2,
                width: 0.2,
                skew: 1,
                power: 0.3,
                baseColor: PETAL_BASE,
                tipColor: ANTHER,
              },
              0,
              0.02,
            ),
            ...ring(
              3,
              {
                role: 'pistil',
                start: 0.66,
                spread: 0.5,
                openCurl: 0.5,
                length: 1.1,
                width: 0.16,
                skew: 1,
                baseColor: STIGMA,
                tipColor: STIGMA,
              },
              0,
              0.02,
            ),
          ],
        },
      ],
      bodies: [],
    };
  },
};
