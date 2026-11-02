import { FACTOR_KEYS, type ClimateFactor, type EnvironmentState } from './Environment';

/** A plant's response to one climate factor: no growth outside min..max, best in optMin..optMax. */
export interface Tolerance {
  min: number;
  optMin: number;
  optMax: number;
  max: number;
}

export type Niche = Record<ClimateFactor, Tolerance>;

export interface Assessment<S> {
  species: S;
  /** 0 means it cannot survive here, 1 means every factor is in its optimal range. */
  score: number;
  /** The factor holding the score down, whichever is worst. */
  limitingFactor: ClimateFactor;
  factors: Record<ClimateFactor, number>;
}

/** The plateau curve used by FAO's EcoCrop model. */
export function factorSuitability(value: number, { min, optMin, optMax, max }: Tolerance): number {
  if (value < min || value > max) return 0;
  if (value < optMin) return optMin === min ? 1 : (value - min) / (optMin - min);
  if (value > optMax) return optMax === max ? 1 : (max - value) / (max - optMax);
  return 1;
}

/** Limiting-factor logic: a plant does only as well as its worst condition allows. */
export function assess<S extends { niche: Niche }>(
  species: S,
  environment: EnvironmentState,
): Assessment<S> {
  const factors = {} as Record<ClimateFactor, number>;
  let limitingFactor: ClimateFactor = 'temperature';
  for (const key of FACTOR_KEYS) {
    factors[key] = factorSuitability(environment[key], species.niche[key]);
    if (factors[key] < factors[limitingFactor]) limitingFactor = key;
  }
  return { species, score: factors[limitingFactor], limitingFactor, factors };
}

/**
 * How far a climate sits from a plant's best conditions, in units of its own tolerance. Unlike the
 * score it keeps growing past the plant's limits, so it still ranks plants that all score 0.
 */
function distanceFromBest(niche: Niche, environment: EnvironmentState): number {
  let total = 0;
  for (const key of FACTOR_KEYS) {
    const { min, optMin, optMax, max } = niche[key];
    total += ((environment[key] - (optMin + optMax) / 2) / ((max - min) / 2)) ** 2;
  }
  return total;
}

const SAME_SCORE = 0.001;

/** Best match first. */
export function rankSpecies<S extends { niche: Niche }>(
  species: readonly S[],
  environment: EnvironmentState,
): Assessment<S>[] {
  return species
    .map((candidate) => assess(candidate, environment))
    .sort((a, b) =>
      Math.abs(a.score - b.score) > SAME_SCORE
        ? b.score - a.score
        : distanceFromBest(a.species.niche, environment) -
          distanceFromBest(b.species.niche, environment),
    );
}
