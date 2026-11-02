import { describe, expect, it } from 'vitest';
import type { BladeRole, BladeSpec, HeadSpec, PlantForm } from '../form';
import { hedgehog } from './hedgehog';
import { lavender } from './lavender';
import { lotus } from './lotus';
import { orchid } from './orchid';
import { peony } from './peony';
import { poppy } from './poppy';
import { sunflower } from './sunflower';
import { trillium } from './trillium';

// These hold each plant to the counts and sizes in its botanical description.

const allHeads = (form: PlantForm): HeadSpec[] => [
  ...form.heads,
  ...form.bodies.flatMap((body) => body.heads),
];

const allBlades = (form: PlantForm): BladeSpec[] => allHeads(form).flatMap((head) => head.blades);

const count = (blades: BladeSpec[], role: BladeRole): number =>
  blades.filter((blade) => blade.role === role).length;

describe('trillium', () => {
  const form = trillium.createForm();
  const blades = allBlades(form);

  it('has everything in threes', () => {
    expect(form.leaves).toHaveLength(3);
    expect(count(blades, 'sepal')).toBe(3);
    expect(count(blades, 'petal')).toBe(3);
    expect(count(blades, 'stamen')).toBe(6);
    expect(count(blades, 'pistil')).toBe(3);
  });

  it('has bracts of 12 to 20 cm', () => {
    for (const leaf of form.leaves) {
      expect(leaf.length).toBeGreaterThanOrEqual(12);
      expect(leaf.length).toBeLessThanOrEqual(20);
    }
  });

  it('has sepals of 2 to 5.5 cm', () => {
    for (const blade of blades.filter((b) => b.role === 'sepal')) {
      expect(blade.length).toBeGreaterThanOrEqual(2);
      expect(blade.length).toBeLessThanOrEqual(5.5);
    }
  });
});

describe('arctic poppy', () => {
  const form = poppy.createForm();
  const blades = allBlades(form);

  it('has 2 sepals and 4 petals', () => {
    expect(count(blades, 'sepal')).toBe(2);
    expect(count(blades, 'petal')).toBe(4);
  });

  it('drops its sepals as the flower opens', () => {
    for (const blade of blades.filter((b) => b.role === 'sepal')) {
      expect(blade.shedAt).toBeLessThanOrEqual(0.7);
    }
  });

  it('nods as a bud and lifts as it opens', () => {
    const [head] = form.heads;
    expect(head?.budRotation?.[0]).toBeGreaterThan(Math.PI / 2);
    expect(head?.rotation[0]).toBeLessThan(Math.PI / 2);
  });

  it('keeps its leaves at the base and its stalk under 15 cm', () => {
    for (const leaf of form.leaves) expect(leaf.position.y).toBeLessThan(1);
    expect(form.stems[0]?.curve.getPointAt(1).y).toBeLessThanOrEqual(15);
  });

  it('has a flower no wider than 6.5 cm', () => {
    for (const blade of blades.filter((b) => b.role === 'petal')) {
      expect(blade.length).toBeLessThanOrEqual(3.25);
    }
  });
});

describe('sunflower', () => {
  const form = sunflower.createForm();
  const blades = allBlades(form);

  it('has 17 to 30 ray florets and 20 to 30 phyllaries', () => {
    expect(count(blades, 'petal')).toBeGreaterThanOrEqual(17);
    expect(count(blades, 'petal')).toBeLessThanOrEqual(30);
    expect(count(blades, 'sepal')).toBeGreaterThanOrEqual(20);
    expect(count(blades, 'sepal')).toBeLessThanOrEqual(30);
  });

  it('has more than 150 disc florets on the golden angle', () => {
    const florets = blades.filter((b) => b.role === 'floret');
    expect(florets.length).toBeGreaterThan(150);
    const step = florets[1]!.azimuth - florets[0]!.azimuth;
    expect((step * 180) / Math.PI).toBeCloseTo(137.5, 1);
  });

  it('opens its disc from the rim inwards', () => {
    const florets = blades.filter((b) => b.role === 'floret');
    const inner = florets[0]!;
    const outer = florets[florets.length - 1]!;
    expect(outer.radial).toBeGreaterThan(inner.radial);
    expect(outer.start).toBeLessThan(inner.start);
  });

  it('holds its disc florets still, packed into the head', () => {
    const head = form.heads.find(({ blades: parts }) => parts.some((b) => b.role === 'floret'));
    expect(head?.rigid).toBe(true);
  });

  it('has a stem of 100 to 300 cm and leaves of 10 to 40 cm', () => {
    const height = form.stems[0]!.curve.getPointAt(1).y;
    expect(height).toBeGreaterThanOrEqual(100);
    expect(height).toBeLessThanOrEqual(300);
    for (const leaf of form.leaves.slice(2)) {
      expect(leaf.length).toBeGreaterThanOrEqual(10);
      expect(leaf.length).toBeLessThanOrEqual(40);
    }
  });
});

describe('peony', () => {
  const form = peony.createForm();
  const blades = allBlades(form);

  it('has 7 to 20 petals and many stamens', () => {
    expect(count(blades, 'petal')).toBeGreaterThanOrEqual(7);
    expect(count(blades, 'petal')).toBeLessThanOrEqual(20);
    expect(count(blades, 'stamen')).toBeGreaterThan(20);
  });

  it('has a stem of 30 to 90 cm', () => {
    const height = form.stems[0]!.curve.getPointAt(1).y;
    expect(height).toBeGreaterThanOrEqual(30);
    expect(height).toBeLessThanOrEqual(90);
  });
});

describe('moth orchid', () => {
  const form = orchid.createForm();

  it('gives each flower 3 sepals, 2 broad petals and a three-lobed lip', () => {
    for (const head of form.heads) {
      expect(count(head.blades, 'sepal')).toBe(3);
      // Two side petals plus the lip's three lobes.
      expect(count(head.blades, 'petal')).toBe(5);
    }
  });

  it('holds flowers 5 to 8 cm wide', () => {
    const broad = form.heads[0]!.blades.filter((b) => b.role === 'petal' && b.width > 3);
    expect(broad).toHaveLength(2);
    for (const petal of broad) {
      expect(petal.length * 2).toBeGreaterThanOrEqual(5);
      expect(petal.length * 2).toBeLessThanOrEqual(8);
    }
  });

  it('opens the lowest flower on the spike first', () => {
    const openings = form.heads.map((head) => head.blades[0]!.openStart);
    expect(openings).toEqual([...openings].sort((a, b) => a - b));
    expect(openings[0]).toBeLessThan(openings[openings.length - 1]!);
  });

  it('sets its leaves in two opposite rows', () => {
    const [first, second, third] = form.leaves;
    expect(Math.abs(second!.azimuth - first!.azimuth)).toBeCloseTo(Math.PI);
    expect(third!.azimuth).toBeCloseTo(first!.azimuth);
  });
});

describe('sacred lotus', () => {
  const form = lotus.createForm();

  it('has round leaves of up to 45 cm radius', () => {
    for (const leaf of form.leaves) expect(leaf.length).toBeLessThanOrEqual(45);
  });

  it('has a flower 10 to 23 cm across, with many tepals and stamens', () => {
    const blades = allBlades(form);
    expect(count(blades, 'tepal')).toBeGreaterThan(20);
    expect(count(blades, 'stamen')).toBeGreaterThan(100);
    const longest = Math.max(...blades.filter((b) => b.role === 'tepal').map((b) => b.length));
    expect(longest * 2).toBeGreaterThanOrEqual(10);
    expect(longest * 2).toBeLessThanOrEqual(26);
  });

  it('has a seed pod 5 to 10 cm across', () => {
    const widest = Math.max(...form.bodies[0]!.profile.map(([radius]) => radius));
    expect(widest * 2).toBeGreaterThanOrEqual(5);
    expect(widest * 2).toBeLessThanOrEqual(10);
  });
});

describe('true lavender', () => {
  const form = lavender.createForm();

  it('sets leaves in opposite pairs, each pair turned a quarter', () => {
    const leaves = form.heads[0]!.blades.filter((b) => b.role === 'leaf');
    expect(leaves[1]!.azimuth - leaves[0]!.azimuth).toBeCloseTo(Math.PI);
    expect(leaves[2]!.azimuth - leaves[0]!.azimuth).toBeCloseTo(Math.PI / 2);
  });

  it('has leaves of 1 to 2.5 cm', () => {
    for (const leaf of form.heads[0]!.blades.filter((b) => b.role === 'leaf')) {
      expect(leaf.length).toBeGreaterThanOrEqual(1);
      expect(leaf.length).toBeLessThanOrEqual(2.5);
    }
  });

  it('opens its spike from the bottom upwards', () => {
    const corollas = form.heads[0]!.blades.filter((b) => b.role === 'petal');
    const lowest = corollas[0]!;
    const highest = corollas[corollas.length - 1]!;
    expect(highest.axial).toBeGreaterThan(lowest.axial);
    expect(highest.openStart).toBeGreaterThan(lowest.openStart);
  });
});

describe('hedgehog cactus', () => {
  const form = hedgehog.createForm();

  it('grows in a clump of ribbed stems of 14 to 45 cm', () => {
    expect(form.bodies.length).toBeGreaterThan(1);
    for (const body of form.bodies) {
      expect(body.ribs).toBeGreaterThanOrEqual(10);
      expect(body.ribs).toBeLessThanOrEqual(13);
      const height = body.profile[body.profile.length - 1]![1];
      expect(height).toBeGreaterThanOrEqual(14);
      expect(height).toBeLessThanOrEqual(45);
    }
  });

  it('carries 15 to 20 spines per areole', () => {
    const body = form.bodies[0]!;
    const spines = body.heads[0]!.blades.filter((b) => b.role === 'spine');
    const perAreole = spines.length / (body.ribs * 11);
    expect(perAreole).toBeGreaterThanOrEqual(15);
    expect(perAreole).toBeLessThanOrEqual(20);
  });

  it('keeps its spines stiff while its flowers sway', () => {
    const [spines, flower] = form.bodies[0]!.heads;
    expect(spines?.rigid).toBe(true);
    expect(flower?.rigid).toBeFalsy();
  });

  it('has flowers of 6 to 9 cm with a green stigma', () => {
    const flowers = form.bodies[0]!.heads.slice(1);
    const tepals = flowers.flatMap((head) => head.blades).filter((b) => b.role === 'tepal');
    const longest = Math.max(...tepals.map((b) => b.length + b.axial));
    expect(longest).toBeGreaterThanOrEqual(6);
    expect(longest).toBeLessThanOrEqual(9);
    const pistil = flowers.flatMap((head) => head.blades).find((b) => b.role === 'pistil');
    expect(pistil?.baseColor).toBe(0x3fa34d);
  });
});
