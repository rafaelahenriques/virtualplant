import { CatmullRomCurve3, Vector3, type BufferGeometry } from 'three';
import type { ClimateFactor } from '../ecosystem/Environment';
import type { Niche } from '../ecosystem/Suitability';

// All plant dimensions are in centimetres, taken from botanical descriptions, so a plant's
// proportions are its real ones. The camera does the framing.

export type Vec3 = [number, number, number];

/** What an instanced blade is, which the tests check against published counts. */
export type BladeRole =
  'petal' | 'sepal' | 'tepal' | 'stamen' | 'pistil' | 'floret' | 'leaf' | 'spine';

export interface BladeSpec {
  role: BladeRole;
  /** Direction around the axis, in radians. 0 points along local +Z. */
  azimuth: number;
  /** Where its base sits, along and away from the axis. */
  axial: number;
  radial: number;
  /** Growth stages at which it pushes out, then opens. */
  start: number;
  emergeEnd: number;
  openStart: number;
  openEnd: number;
  /** Angle from the axis once open, in radians. */
  spread: number;
  /** How far the tip bends when open: positive outwards, negative inwards. */
  openCurl: number;
  length: number;
  width: number;
  /** Outline: skew above 1 puts the widest point past the middle, power below 1 rounds it. */
  skew: number;
  power: number;
  /** Cup across the blade when open, in radians. */
  openWrap: number;
  /** Growth stage at which it drops off, as poppy sepals do. */
  shedAt: number;
  baseColor: number;
  tipColor: number;
}

type BladeInput = Partial<BladeSpec> &
  Pick<BladeSpec, 'role' | 'start' | 'spread' | 'length' | 'width' | 'baseColor' | 'tipColor'>;

/** The whole flower stays a closed bud until this growth stage, unless a blade says otherwise. */
const FLOWER_OPENS_AT = 0.6;

export function blade(input: BladeInput): BladeSpec {
  return {
    azimuth: 0,
    axial: 0,
    radial: 0,
    emergeEnd: input.start + 0.16,
    openStart: Math.max(FLOWER_OPENS_AT, input.start + 0.1),
    openEnd: 1,
    openCurl: 0.5,
    skew: 1.6,
    power: 0.6,
    openWrap: 0.6,
    shedAt: 2,
    ...input,
  };
}

/** Small repeatable offsets stop a ring looking machine-made. */
export const variation = (i: number, seed = 0): number => Math.sin(i * 7.3 + seed * 2.1);

/** Evenly spaced blades around the axis, offset by `phase`. */
export function ring(count: number, input: BladeInput, phase = 0, jitter = 0.08): BladeSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const offset = variation(i, phase);
    return blade({
      ...input,
      azimuth: (i / count) * Math.PI * 2 + phase + offset * jitter,
      spread: input.spread * (1 + offset * jitter * 0.5),
      length: input.length * (1 + offset * jitter),
    });
  });
}

export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export interface StemSpec {
  curve: CatmullRomCurve3;
  radius: [number, number];
  /** Growth stages over which it extends. */
  start: number;
  end: number;
  /** Fraction already there at its start, so a seedling has a shoot. */
  initial: number;
  color: number;
}

export function stem(
  points: Vec3[],
  radius: [number, number],
  timing: { start: number; end: number; initial?: number },
  color: number,
): StemSpec {
  return {
    curve: new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z))),
    radius,
    start: timing.start,
    end: timing.end,
    initial: timing.initial ?? 0,
    color,
  };
}

/** The growth stage at which a stem reaches a point along its length. */
export function reachedAt({ start, end, initial }: StemSpec, along: number): number {
  return start + (end - start) * Math.max(0, (along - initial) / (1 - initial));
}

export interface LeafSpec {
  blade: BufferGeometry;
  position: Vector3;
  azimuth: number;
  /** Angle from straight up once unfurled, in radians. */
  pitch: number;
  length: number;
  birth: number;
  span: number;
  baseColor: number;
  tipColor: number;
  veins: number;
}

export interface HeadSpec {
  position: Vector3;
  /** Euler angles in radians. `budRotation` applies until `openAt`, as for a nodding poppy bud. */
  rotation: Vec3;
  budRotation?: Vec3;
  openAt?: [number, number];
  blades: BladeSpec[];
  /** Plane subdivisions per blade: fewer for hundreds of tiny florets. */
  detail: [number, number];
  /** X-ray brightness, lower where many blades overlap. */
  glow: number;
  veins: number;
}

export interface BodySpec {
  /** Radius and height along the body, bottom to top. */
  profile: [number, number][];
  ribs: number;
  ribDepth: number;
  position: Vector3;
  rotation: Vec3;
  /** Growth stages over which it reaches full size, and the fraction it starts at. */
  start: number;
  end: number;
  initial: number;
  baseColor: number;
  tipColor: number;
  /** Heads carried on the body, positioned relative to it. */
  heads: HeadSpec[];
}

export interface PlantForm {
  stems: StemSpec[];
  leaves: LeafSpec[];
  heads: HeadSpec[];
  bodies: BodySpec[];
}

export interface Framing {
  /** Height the camera centres on and how many centimetres fill the screen's height. */
  seedling: { center: number; span: number };
  bloom: { center: number; span: number };
}

/** Puts the flower in the upper part of the frame, where the scan window starts. */
export function framing(
  flowerHeight: number,
  bloomSpan: number,
  seedling: { center: number; span: number },
): Framing {
  return { seedling, bloom: { center: flowerHeight - bloomSpan * 0.16, span: bloomSpan } };
}

export interface Source {
  label: string;
  url: string;
}

export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  habitat: string;
  /** Short facts in the words of the sources. */
  height: string;
  flower: string;
  niche: Niche;
  /**
   * Published: the numbers come straight from the sources. Derived: the sources describe the
   * habitat or give another measure, and the range is worked out from that habitat's climate.
   */
  nicheBasis: Record<ClimateFactor, 'published' | 'derived'>;
  sources: Source[];
  /** Tint behind the plant inside the scan window. */
  windowColor: number;
  framing: Framing;
  createForm: () => PlantForm;
}
