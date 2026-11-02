import { describe, expect, it } from 'vitest';
import type { EnvironmentState } from '../ecosystem/Environment';
import { rankSpecies } from '../ecosystem/Suitability';
import { SPECIES } from '../plants/species';
import {
  describeFactor,
  describeMatch,
  describeOthers,
  describeStartupError,
  describeTrackingError,
  formatFactor,
} from './copy';

const tucson: EnvironmentState = { temperature: 27, humidity: 35, rainfall: 290, sunlight: 11 };
const mekong: EnvironmentState = { temperature: 27.5, humidity: 80, rainfall: 1800, sunlight: 7 };
const aswan: EnvironmentState = { temperature: 33, humidity: 20, rainfall: 1, sunlight: 11.5 };

describe('formatFactor', () => {
  it('writes each factor in its own unit', () => {
    expect(formatFactor('temperature', 27.5)).toBe('27.5 °C');
    expect(formatFactor('humidity', 80)).toBe('80%');
    expect(formatFactor('rainfall', 1800)).toBe('1,800 mm a year');
    expect(formatFactor('sunlight', 7)).toBe('7 h of sun a day');
  });
});

describe('describeMatch', () => {
  it('says so when every factor is ideal', () => {
    const [best] = rankSpecies(SPECIES, tucson);
    expect(describeMatch(best!, tucson)).toBe('100% match. Every factor is in its best range.');
  });

  it('names the limiting factor and what would help', () => {
    const [best] = rankSpecies(SPECIES, mekong);
    expect(best?.species.id).toBe('lotus');
    expect(describeMatch(best!, mekong)).toBe(
      '85% match, limited by rainfall. More rainfall would help: its best range starts at 2,000 mm a year.',
    );
  });

  it('says when the closest plant would not survive, and what it lacks', () => {
    const [closest] = rankSpecies(SPECIES, aswan);
    expect(describeMatch(closest!, aswan)).toBe(
      'Closest match, but it would not survive here. The rainfall here is 1 mm a year, and it needs more than 75 mm a year.',
    );
  });

  it('says when a factor is over the limit', () => {
    const scorching = { ...tucson, temperature: 44 };
    const [closest] = rankSpecies(SPECIES, scorching);
    expect(describeMatch(closest!, scorching)).toContain('it needs less than');
  });
});

describe('describeFactor', () => {
  it('gives the best range when within limits', () => {
    const [best] = rankSpecies(SPECIES, tucson);
    expect(describeFactor('temperature', best!, tucson)).toBe('Best 20 °C to 34 °C');
  });

  it('says when a value is outside the limits', () => {
    const [closest] = rankSpecies(SPECIES, aswan);
    expect(describeFactor('rainfall', closest!, aswan)).toBe('Too low. Needs at least 75 mm/yr');
  });
});

describe('describeOthers', () => {
  it('lists other viable species, best first', () => {
    const luoyang = { temperature: 20, humidity: 62, rainfall: 650, sunlight: 6.5 };
    expect(describeOthers(rankSpecies(SPECIES, luoyang))).toBe(
      'Could also grow here: True lavender 87%, Common sunflower 75%',
    );
  });

  it('is empty when nothing else can grow', () => {
    expect(describeOthers(rankSpecies(SPECIES, aswan))).toBe('');
  });
});

describe('describeStartupError', () => {
  it('points to a browser that can run it when WebGL is missing', () => {
    expect(describeStartupError(new Error('Error creating WebGL context.'))).toContain('WebGL 2');
  });

  it('suggests reloading otherwise', () => {
    expect(describeStartupError(new Error('other'))).toContain('Reload');
  });
});

describe('describeTrackingError', () => {
  const failure = (name: string) => Object.assign(new Error('failed'), { name });

  it('tells you what to do for each kind of failure', () => {
    expect(describeTrackingError(failure('NotAllowedError'))).toContain('Allow it');
    expect(describeTrackingError(failure('NotFoundError'))).toContain('Connect one');
    expect(describeTrackingError(failure('NotReadableError'))).toContain('Close it');
    expect(describeTrackingError(new Error('other'))).toContain('Check your connection');
  });
});
