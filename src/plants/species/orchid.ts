import { createBlade, outlines } from '../geometry';
import {
  blade,
  framing,
  stem,
  type BladeSpec,
  type HeadSpec,
  type LeafSpec,
  type Species,
} from '../form';

const STEM = 0x6f8f5a;
const SPIKE = 0x7a8f62;
const LEAF_BASE = 0x2f6a4c;
const LEAF_TIP = 0x4f9a70;
const WHITE_BASE = 0xefe7ef;
const WHITE_TIP = 0xffffff;
const LIP_YELLOW = 0xe8b418;
const LIP_RED = 0xc8452c;

const FLOWERS = 7;
const FACE_VIEWER = Math.PI / 2;

/**
 * One flower seen face on, where azimuth 0 points down: a dorsal sepal above, two lateral
 * sepals below, two broad petals at the sides, and a three-lobed lip with two tendrils.
 */
function mothFlower(index: number): BladeSpec[] {
  // The lowest flower on the spike opens first.
  const offset = index * 0.04;
  const start = 0.42 + offset * 0.5;
  const timing = { start, openStart: 0.58 + offset * 0.9, openEnd: 0.76 + offset };
  const white = { ...timing, baseColor: WHITE_BASE, tipColor: WHITE_TIP };

  return [
    blade({
      ...white,
      role: 'sepal',
      azimuth: Math.PI,
      spread: 1.45,
      openCurl: 0.1,
      length: 3.6,
      width: 2,
      skew: 1.05,
      power: 0.7,
      openWrap: 0.3,
    }),
    ...[-1, 1].map((side) =>
      blade({
        ...white,
        role: 'sepal',
        azimuth: side * 0.7,
        spread: 1.45,
        openCurl: 0.1,
        length: 3.5,
        width: 1.9,
        skew: 1.05,
        power: 0.7,
        openWrap: 0.3,
      }),
    ),
    ...[-1, 1].map((side) =>
      blade({
        ...white,
        role: 'petal',
        azimuth: side * 1.95,
        spread: 1.5,
        openCurl: 0.05,
        length: 3.8,
        width: 4.2,
        skew: 1.25,
        power: 0.42,
        openWrap: 0.25,
      }),
    ),
    // The lip's side lobes, cupped upwards, with a deep yellow margin.
    ...[-1, 1].map((side) =>
      blade({
        ...timing,
        role: 'petal',
        azimuth: side * 0.75,
        axial: 0.35,
        radial: 0.2,
        spread: 0.8,
        openCurl: -0.7,
        length: 1.3,
        width: 0.9,
        skew: 0.95,
        power: 0.5,
        baseColor: WHITE_BASE,
        tipColor: LIP_YELLOW,
      }),
    ),
    // The lip's narrow centre lobe.
    blade({
      ...timing,
      role: 'petal',
      axial: 0.35,
      radial: 0.3,
      spread: 1.35,
      openCurl: 0.2,
      length: 1.6,
      width: 0.75,
      skew: 1.1,
      power: 0.8,
      baseColor: LIP_RED,
      tipColor: LIP_YELLOW,
    }),
    // Two yellow tendrils from the tip of the centre lobe.
    ...[-1, 1].map((side) =>
      blade({
        ...timing,
        role: 'stamen',
        azimuth: side * 0.12,
        axial: 0.3,
        radial: 1.75,
        spread: 1.5,
        openCurl: -1.6,
        length: 0.9,
        width: 0.07,
        skew: 1,
        power: 0.3,
        baseColor: LIP_YELLOW,
        tipColor: LIP_YELLOW,
      }),
    ),
    // The column at the centre, which holds the flower's reproductive parts.
    blade({
      ...timing,
      role: 'pistil',
      azimuth: Math.PI,
      spread: 0.35,
      openCurl: -0.3,
      length: 0.9,
      width: 0.45,
      skew: 1,
      power: 0.5,
      baseColor: WHITE_TIP,
      tipColor: LIP_YELLOW,
    }),
  ];
}

export const orchid: Species = {
  id: 'orchid',
  commonName: 'Moth orchid',
  scientificName: 'Phalaenopsis amabilis',
  family: 'Orchidaceae',
  habitat: 'Grows on trees in lowland Southeast Asian rainforest',
  height: 'Flower spike to about 60 cm',
  flower: '3 sepals, 2 broad petals and a three-lobed lip on an arching spike',
  niche: {
    temperature: { min: 16, optMin: 22, optMax: 29, max: 34 },
    humidity: { min: 50, optMin: 60, optMax: 80, max: 98 },
    rainfall: { min: 1500, optMin: 2000, optMax: 4500, max: 7000 },
    sunlight: { min: 0, optMin: 0.5, optMax: 2.5, max: 4.5 },
  },
  nicheBasis: {
    temperature: 'published',
    humidity: 'published',
    rainfall: 'published',
    sunlight: 'published',
  },
  sources: [
    {
      label: 'American Orchid Society',
      url: 'https://www.aos.org/orchid-care/care-sheets/phalaenopsis-culture-sheet',
    },
    {
      label: 'NParks Flora and Fauna',
      url: 'https://www.nparks.gov.sg/florafaunaweb/flora/5/8/5881',
    },
    {
      label: 'NASA, rainforest climate',
      url: 'https://science.nasa.gov/kids/earth/mission-biomes/biorainforest',
    },
  ],
  windowColor: 0x241238,
  framing: framing(50, 46, { center: 8, span: 34 }),
  createForm() {
    const crown = stem(
      [
        [-10, 0, 0],
        [-10, 3, 0],
        [-10, 6, 0],
      ],
      [0.9, 0.7],
      { start: 0, end: 0.2, initial: 0.4 },
      STEM,
    );
    const spike = stem(
      [
        [-10, 4, 0.5],
        [-10, 22, 1],
        [-8, 38, 2],
        [0, 50, 3],
        [12, 54, 4],
      ],
      [0.28, 0.12],
      { start: 0.22, end: 0.5 },
      SPIKE,
    );

    const strap = createBlade({ width: 0.36, outline: outlines.strap, droop: 0.55, fold: 0.04 });
    const leaves = Array.from({ length: 6 }, (_, i): LeafSpec => ({
      blade: strap,
      position: crown.curve.getPointAt(0.1 + i * 0.16),
      // Two opposite rows.
      azimuth: 1.1 + (i % 2) * Math.PI,
      pitch: 1.2 - i * 0.06,
      length: 28 - i * 1.5,
      birth: i < 2 ? -0.14 : (i - 1) * 0.06,
      span: 0.14,
      baseColor: LEAF_BASE,
      tipColor: LEAF_TIP,
      veins: 3,
    }));

    const heads: HeadSpec[] = Array.from({ length: FLOWERS }, (_, i) => ({
      position: spike.curve.getPointAt(0.56 + (i / (FLOWERS - 1)) * 0.44),
      rotation: [FACE_VIEWER - 0.12, 0.08 * Math.sin(i * 2.1), 0.12 * Math.sin(i * 1.3)],
      detail: [8, 12],
      glow: 0.75,
      veins: 9,
      blades: mothFlower(i),
    }));

    return { stems: [crown, spike], leaves, heads, bodies: [] };
  },
};
