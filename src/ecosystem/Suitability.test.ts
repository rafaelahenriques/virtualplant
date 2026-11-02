import { describe, expect, it } from 'vitest';
import { SPECIES } from '../plants/species';
import { FACTOR_KEYS } from './Environment';
import { CLIMATE_PRESETS } from './presets';
import { assess, factorSuitability, rankSpecies, type Niche } from './Suitability';

const tolerance = { min: 10, optMin: 20, optMax: 30, max: 40 };
const niche: Niche = {
  temperature: tolerance,
  humidity: tolerance,
  rainfall: tolerance,
  sunlight: tolerance,
};

describe('factorSuitability', () => {
  it('is 0 outside the absolute limits', () => {
    expect(factorSuitability(9, tolerance)).toBe(0);
    expect(factorSuitability(41, tolerance)).toBe(0);
  });

  it('is 1 across the optimal range', () => {
    expect(factorSuitability(20, tolerance)).toBe(1);
    expect(factorSuitability(30, tolerance)).toBe(1);
  });

  it('falls in a straight line between the optimal range and the limits', () => {
    expect(factorSuitability(15, tolerance)).toBe(0.5);
    expect(factorSuitability(35, tolerance)).toBe(0.5);
  });
});

describe('assess', () => {
  it('scores a plant by its worst factor and names it', () => {
    const result = assess({ niche }, { temperature: 25, humidity: 25, rainfall: 15, sunlight: 25 });
    expect(result.score).toBe(0.5);
    expect(result.limitingFactor).toBe('rainfall');
  });
});

describe('rankSpecies on real places', () => {
  it.each(CLIMATE_PRESETS)('$name supports $expected', ({ environment, expected }) => {
    const [best] = rankSpecies(SPECIES, environment);
    expect(best?.species.id).toBe(expected);
    expect(best?.score).toBeGreaterThan(0.6);
  });

  it('gives every species exactly one place', () => {
    const places = CLIMATE_PRESETS.map(({ expected }) => expected).sort();
    expect(places).toEqual(SPECIES.map(({ id }) => id).sort());
  });

  it('never lets a plant grow beyond a limit it has', () => {
    for (const species of SPECIES) {
      const { temperature } = species.niche;
      const tooHot = { ...CLIMATE_PRESETS[0]!.environment, temperature: temperature.max + 1 };
      expect(assess(species, tooHot).score).toBe(0);
    }
  });
});

describe('rankSpecies where nothing could survive', () => {
  it.each([
    [
      'a hot, dry desert',
      'hedgehog',
      { temperature: 33, humidity: 20, rainfall: 1, sunlight: 11.5 },
    ],
    ['deep cold', 'poppy', { temperature: -10, humidity: 78, rainfall: 220, sunlight: 6 }],
    [
      'a hot, shaded jungle',
      'orchid',
      { temperature: 40, humidity: 99, rainfall: 5000, sunlight: 1 },
    ],
  ])('puts the closest plant first in %s', (_, expected, environment) => {
    const [closest] = rankSpecies(SPECIES, environment);
    expect(closest?.score).toBe(0);
    expect(closest?.species.id).toBe(expected);
  });
});

describe('species data', () => {
  it.each(SPECIES)('$commonName has an ordered range for every factor', ({ niche: ranges }) => {
    for (const key of FACTOR_KEYS) {
      const { min, optMin, optMax, max } = ranges[key];
      expect(min).toBeLessThanOrEqual(optMin);
      expect(optMin).toBeLessThan(optMax);
      expect(optMax).toBeLessThanOrEqual(max);
    }
  });

  it.each(SPECIES)('$commonName cites its sources', ({ sources }) => {
    expect(sources.length).toBeGreaterThanOrEqual(2);
    for (const { url } of sources) expect(url).toMatch(/^https?:\/\//);
  });
});
