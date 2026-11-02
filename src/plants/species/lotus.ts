import { Vector3 } from 'three';
import { createPeltateLeaf } from '../geometry';
import { framing, ring, stem, type LeafSpec, type Species, type StemSpec } from '../form';

const STALK = 0x7a9a5e;
const LEAF_BASE = 0x2f7a68;
const LEAF_TIP = 0x4f9f78;
const TEPAL_BASE = 0xfbe3e8;
const TEPAL_TIP = 0xe0447e;
const OUTER_BASE = 0xa8c48a;
const FILAMENT = 0xf7e6a8;
const ANTHER = 0xf2be2a;
const POD_BASE = 0xb9c76a;
const POD_TIP = 0xd9d05a;

interface LeafPlan {
  tip: [number, number, number];
  radius: number;
  start: number;
}

const LEAF_PLANS: LeafPlan[] = [
  // The first leaf floats low on the water, then later ones stand higher.
  { tip: [-13, 9, 6], radius: 11, start: -0.2 },
  { tip: [26, 42, 4], radius: 20, start: 0.04 },
  { tip: [-28, 66, -6], radius: 26, start: 0.12 },
  { tip: [24, 84, -10], radius: 24, start: 0.2 },
];

export const lotus: Species = {
  id: 'lotus',
  commonName: 'Sacred lotus',
  scientificName: 'Nelumbo nucifera',
  habitat: 'Warm, still water in ponds and wetlands of Asia',
  height: '90 to 180 cm above the water',
  flower: 'Many tepals around a flat-topped seed pod, round leaves held at the centre',
  niche: {
    temperature: { min: 10, optMin: 25, optMax: 30, max: 40 },
    humidity: { min: 40, optMin: 55, optMax: 90, max: 100 },
    rainfall: { min: 700, optMin: 2000, optMax: 2800, max: 4000 },
    sunlight: { min: 4, optMin: 6, optMax: 13, max: 14 },
  },
  nicheBasis: {
    temperature: 'published',
    humidity: 'derived',
    rainfall: 'published',
    sunlight: 'published',
  },
  sources: [
    { label: 'FAO EcoCrop', url: 'https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=2359' },
    { label: 'NC State Extension', url: 'https://plants.ces.ncsu.edu/plants/nelumbo-nucifera/' },
    {
      label: 'Flora of China',
      url: 'http://www.efloras.org/florataxon.aspx?flora_id=2&taxon_id=200007079',
    },
  ],
  windowColor: 0x06302f,
  framing: framing(108, 62, { center: 16, span: 44 }),
  createForm() {
    const stalk = stem(
      [
        [0, 0, 0],
        [2, 45, 1],
        [-1, 85, 2],
        [1, 108, 4],
      ],
      [0.6, 0.42],
      { start: 0.08, end: 0.45 },
      STALK,
    );

    const peltate = createPeltateLeaf();
    const stems: StemSpec[] = [stalk];
    const leaves: LeafSpec[] = LEAF_PLANS.map(({ tip, radius, start }, i) => {
      const petiole = stem(
        [[0, 0, 0], [tip[0] * 0.25, tip[1] * 0.55, tip[2] * 0.25], tip],
        [0.4, 0.28],
        { start, end: start + 0.22 },
        STALK,
      );
      stems.push(petiole);
      return {
        blade: peltate,
        position: new Vector3(...tip),
        azimuth: i * 1.7,
        pitch: 0.22,
        length: radius,
        birth: start + 0.12,
        span: 0.16,
        baseColor: LEAF_BASE,
        tipColor: LEAF_TIP,
        veins: 18,
      };
    });

    const top = stalk.curve.getPointAt(1);
    const tepal = {
      role: 'tepal' as const,
      skew: 1.3,
      power: 0.72,
      openCurl: -0.55,
      openWrap: 0.9,
      baseColor: TEPAL_BASE,
      tipColor: TEPAL_TIP,
    };

    return {
      stems,
      leaves,
      heads: [
        {
          position: top,
          rotation: [0.42, 0, 0],
          detail: [8, 14],
          glow: 0.5,
          veins: 11,
          blades: [
            ...ring(5, {
              ...tepal,
              start: 0.4,
              spread: 1.45,
              length: 5,
              width: 3.2,
              baseColor: OUTER_BASE,
            }),
            ...ring(9, { ...tepal, start: 0.45, spread: 1.28, length: 11, width: 6.4 }),
            ...ring(9, { ...tepal, start: 0.5, spread: 1, length: 11, width: 6.2 }, 0.35),
            ...ring(8, { ...tepal, start: 0.55, spread: 0.72, length: 10, width: 5.6 }, 0.7),
            ...ring(6, { ...tepal, start: 0.6, spread: 0.46, length: 9, width: 5 }, 1.05),
          ],
        },
        {
          position: top,
          rotation: [0.42, 0, 0],
          detail: [1, 4],
          glow: 0.35,
          veins: 0,
          blades: ring(150, {
            role: 'stamen',
            start: 0.7,
            radial: 2.6,
            spread: 0.85,
            openCurl: 0,
            length: 3,
            width: 0.16,
            skew: 1,
            power: 0.3,
            baseColor: FILAMENT,
            tipColor: ANTHER,
          }),
        },
      ],
      bodies: [
        {
          // The receptacle: an inverted cone with a flat top, 5 to 10 cm across.
          profile: [
            [0.5, 0],
            [1.1, 1],
            [2.1, 2.3],
            [3, 3.1],
            [3.2, 3.4],
            [2.4, 3.6],
            [0, 3.65],
          ],
          ribs: 0,
          ribDepth: 0,
          position: top,
          rotation: [0.42, 0, 0],
          start: 0.5,
          end: 0.85,
          initial: 0.3,
          baseColor: POD_BASE,
          tipColor: POD_TIP,
          heads: [],
        },
      ],
    };
  },
};
