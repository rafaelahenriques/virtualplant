import { Vector3 } from 'three';
import {
  blade,
  framing,
  ring,
  type BladeSpec,
  type BodySpec,
  type HeadSpec,
  type Species,
  type Vec3,
} from '../form';

const BODY_BASE = 0x3f7a5a;
const BODY_TIP = 0x6fa56a;
const SPINE_BASE = 0xd9c48a;
const SPINE_TIP = 0xf6efd8;
const TEPAL_BASE = 0x8a0f55;
const TEPAL_TIP = 0xff58ad;
const FILAMENT = 0xf0c8d8;
const ANTHER = 0xf2c826;
const STIGMA = 0x3fa34d;

const RIBS = 12;
const AREOLES_PER_RIB = 11;
const SPINES_PER_AREOLE = 15;

interface StemPlan {
  position: Vec3;
  lean: number;
  azimuth: number;
  height: number;
  radius: number;
  start: number;
  /** Where a flower sits on it, as an azimuth, if it carries one. */
  flowers: number[];
}

const CLUMP: StemPlan[] = [
  {
    position: [0, 0, 0],
    lean: 0,
    azimuth: 0,
    height: 30,
    radius: 4.2,
    start: 0,
    flowers: [0.5, 2.6],
  },
  {
    position: [6.5, 0, 1.5],
    lean: 0.14,
    azimuth: 1.4,
    height: 24,
    radius: 3.8,
    start: 0.08,
    flowers: [-0.5],
  },
  {
    position: [-6.5, 0, 2],
    lean: 0.16,
    azimuth: -1.3,
    height: 22,
    radius: 3.6,
    start: 0.12,
    flowers: [0.6],
  },
  {
    position: [2.5, 0, 6.5],
    lean: 0.12,
    azimuth: 0.35,
    height: 16,
    radius: 3.4,
    start: 0.16,
    flowers: [0],
  },
  {
    position: [-3, 0, -6],
    lean: 0.12,
    azimuth: 3.6,
    height: 19,
    radius: 3.5,
    start: 0.2,
    flowers: [],
  },
  {
    position: [5, 0, -5],
    lean: 0.15,
    azimuth: 2.4,
    height: 14,
    radius: 3.2,
    start: 0.24,
    flowers: [],
  },
];

function radiusAt(height: number, radius: number, y: number): number {
  const t = y / height;
  return (
    radius *
    Math.sqrt(Math.max(0, 1 - t ** 8)) *
    (0.88 + 0.12 * Math.sin(Math.min(1, t * 3) * 1.57))
  );
}

function createProfile(height: number, radius: number): [number, number][] {
  const profile: [number, number][] = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    // More rings near the top, where the dome curves in.
    const y = height * (1 - (1 - t) ** 1.6);
    profile.push([radiusAt(height, radius, y), y]);
  }
  return profile;
}

/** Clusters of spines along each rib's crest, appearing from the base upwards. */
function spines({ height, radius, start }: StemPlan): BladeSpec[] {
  const blades: BladeSpec[] = [];
  for (let rib = 0; rib < RIBS; rib++) {
    const crest = (rib / RIBS) * Math.PI * 2;
    for (let row = 0; row < AREOLES_PER_RIB; row++) {
      const y = height * (0.05 + (row + (rib % 2) * 0.5) * 0.086);
      const appears = start + 0.05 + 0.3 * (y / height);
      for (let s = 0; s < SPINES_PER_AREOLE; s++) {
        const fan = Math.sin(s * 12.9 + row * 3.1 + rib);
        const isCentral = s < 5;
        blades.push(
          blade({
            role: 'spine',
            azimuth: crest + fan * 0.55,
            axial: y,
            radial: radiusAt(height, radius, y),
            start: appears,
            emergeEnd: appears + 0.08,
            openStart: appears,
            openEnd: appears + 0.1,
            spread: 1.5 + Math.cos(s * 7.7 + row) * 0.65,
            openCurl: 0,
            length: isCentral ? 3 + fan : 1.5 + fan * 0.4,
            width: isCentral ? 0.1 : 0.06,
            skew: 1,
            power: 0.8,
            baseColor: SPINE_BASE,
            tipColor: SPINE_TIP,
          }),
        );
      }
    }
  }
  return blades;
}

/** A flower breaking through the side of the stem near its tip, 6 to 9 cm long and wide. */
function flowerHeads(plan: StemPlan): HeadSpec[] {
  return plan.flowers.flatMap((azimuth, i): HeadSpec[] => {
    const y = plan.height * (0.84 - i * 0.05);
    const r = radiusAt(plan.height, plan.radius, y);
    const position = new Vector3(Math.sin(azimuth) * r, y, Math.cos(azimuth) * r);
    const rotation: Vec3 = [0.75, azimuth, 0];
    const start = 0.42 + i * 0.03;

    const tepal = {
      role: 'tepal' as const,
      axial: 1.2,
      skew: 1.4,
      power: 0.65,
      openCurl: 0.5,
      openWrap: 0.5,
      baseColor: TEPAL_BASE,
      tipColor: TEPAL_TIP,
    };

    return [
      {
        position,
        rotation,
        detail: [6, 12],
        glow: 0.7,
        veins: 3,
        blades: [
          ...ring(11, { ...tepal, start, spread: 0.95, length: 4.6, width: 1.7 }),
          ...ring(11, { ...tepal, start: start + 0.05, spread: 0.65, length: 5, width: 1.7 }, 0.3),
        ],
      },
      {
        position,
        rotation,
        detail: [1, 3],
        glow: 0.4,
        veins: 0,
        blades: [
          ...ring(80, {
            role: 'stamen',
            start: start + 0.2,
            axial: 1.2,
            radial: 0.5,
            spread: 0.42,
            openCurl: 0,
            length: 2,
            width: 0.08,
            skew: 1,
            power: 0.3,
            baseColor: FILAMENT,
            tipColor: ANTHER,
          }),
          // The stigma's green lobes, a mark of this genus.
          ...ring(10, {
            role: 'pistil',
            start: start + 0.2,
            axial: 3,
            spread: 0.8,
            openCurl: 0.4,
            length: 0.8,
            width: 0.16,
            skew: 1,
            baseColor: STIGMA,
            tipColor: STIGMA,
          }),
        ],
      },
    ];
  });
}

export const hedgehog: Species = {
  id: 'hedgehog',
  commonName: "Engelmann's hedgehog cactus",
  scientificName: 'Echinocereus engelmannii',
  habitat: 'Rocky slopes of the Sonoran and Mojave deserts',
  height: '14 to 45 cm, in clumps',
  flower: 'Magenta tepals, yellow anthers and a green stigma on 10 to 13 ribbed stems',
  niche: {
    temperature: { min: 10, optMin: 20, optMax: 34, max: 40 },
    humidity: { min: 8, optMin: 15, optMax: 45, max: 60 },
    rainfall: { min: 75, optMin: 150, optMax: 350, max: 500 },
    sunlight: { min: 7, optMin: 9, optMax: 13, max: 14 },
  },
  nicheBasis: {
    temperature: 'derived',
    humidity: 'published',
    rainfall: 'published',
    sunlight: 'derived',
  },
  sources: [
    {
      label: 'Flora of North America',
      url: 'http://floranorthamerica.org/Echinocereus_engelmannii',
    },
    { label: 'NPS, Sonoran Desert climate', url: 'https://www.nps.gov/im/sodn/ecosystems.htm' },
    { label: 'NPS, Organ Pipe weather', url: 'https://www.nps.gov/orpi/planyourvisit/weather.htm' },
  ],
  windowColor: 0x35102a,
  framing: framing(27, 42, { center: 4, span: 15 }),
  createForm() {
    const bodies: BodySpec[] = CLUMP.map((plan) => ({
      profile: createProfile(plan.height, plan.radius),
      ribs: RIBS,
      ribDepth: 0.2,
      position: new Vector3(...plan.position),
      rotation: [plan.lean, plan.azimuth, 0],
      start: plan.start,
      end: plan.start + 0.4,
      initial: 0.14,
      baseColor: BODY_BASE,
      tipColor: BODY_TIP,
      heads: [
        {
          position: new Vector3(0, 0, 0),
          rotation: [0, 0, 0],
          // Two rows at least: a blade's outline is zero at both ends.
          detail: [1, 2],
          glow: 0.45,
          veins: 0,
          rigid: true,
          blades: spines(plan),
        },
        ...flowerHeads(plan),
      ],
    }));

    return { stems: [], leaves: [], heads: [], bodies };
  },
};
