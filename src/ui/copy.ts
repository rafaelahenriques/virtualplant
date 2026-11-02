import {
  CLIMATE_FACTORS,
  type ClimateFactor,
  type EnvironmentState,
} from '../ecosystem/Environment';
import type { Assessment, Tolerance } from '../ecosystem/Suitability';
import type { Species } from '../plants/form';

const numbers = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

export function formatFactor(key: ClimateFactor, value: number): string {
  const formatted = numbers.format(value);
  switch (key) {
    case 'temperature':
      return `${formatted} °C`;
    case 'humidity':
      return `${formatted}%`;
    case 'rainfall':
      return `${formatted} mm a year`;
    case 'sunlight':
      return `${formatted} h of sun a day`;
  }
}

/** A shorter value for the slider's own readout, where the label gives the context. */
export function formatReadout(key: ClimateFactor, value: number): string {
  const formatted = numbers.format(value);
  return key === 'humidity' ? `${formatted}%` : `${formatted} ${CLIMATE_FACTORS[key].unit}`;
}

const factorName = (key: ClimateFactor): string => CLIMATE_FACTORS[key].label.toLowerCase();

function rangeNote(key: ClimateFactor, { optMin, optMax }: Tolerance): string {
  return `Best ${formatReadout(key, optMin)} to ${formatReadout(key, optMax)}`;
}

/** The line under a slider: the plant's best range, and whether this factor holds it back. */
export function describeFactor(
  key: ClimateFactor,
  assessment: Assessment<Species>,
  environment: EnvironmentState,
): string {
  const tolerance = assessment.species.niche[key];
  const value = environment[key];
  if (value < tolerance.min) return `Too low. Needs at least ${formatReadout(key, tolerance.min)}`;
  if (value > tolerance.max)
    return `Too high. Tolerates up to ${formatReadout(key, tolerance.max)}`;
  return rangeNote(key, tolerance);
}

/** Says how well the plant fits this climate, and what would improve it. */
export function describeMatch(
  { species, score, limitingFactor }: Assessment<Species>,
  environment: EnvironmentState,
): string {
  const percent = Math.round(score * 100);
  if (percent === 100) return '100% match. Every factor is in its best range.';

  const { optMin, optMax } = species.niche[limitingFactor];
  const value = environment[limitingFactor];
  const name = factorName(limitingFactor);
  const change =
    value < optMin
      ? `More ${name} would help: its best range starts at ${formatFactor(limitingFactor, optMin)}.`
      : `Less ${name} would help: its best range ends at ${formatFactor(limitingFactor, optMax)}.`;
  return `${percent}% match, limited by ${name}. ${change}`;
}

/** Explains why nothing grows, naming the closest plant and what it would need. */
export function describeNoMatch(
  { species, limitingFactor }: Assessment<Species>,
  environment: EnvironmentState,
): string {
  const { min, max } = species.niche[limitingFactor];
  const value = environment[limitingFactor];
  const name = factorName(limitingFactor);
  const need =
    value < min
      ? `${species.commonName}, the closest match, needs at least ${formatFactor(limitingFactor, min)}.`
      : `${species.commonName}, the closest match, tolerates at most ${formatFactor(limitingFactor, max)}.`;
  return `The ${name} here is ${formatFactor(limitingFactor, value)}. ${need}`;
}

/** Other species that could also survive here, or an empty string if none can. */
export function describeOthers(ranking: Assessment<Species>[]): string {
  const others = ranking
    .slice(1)
    .filter(({ score }) => score > 0)
    .slice(0, 2)
    .map(({ species, score }) => `${species.commonName} ${Math.round(score * 100)}%`);
  return others.length > 0 ? `Could also grow here: ${others.join(', ')}` : '';
}

/** Turns a failed startup into what to do about it. */
export function describeStartupError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (/webgl/i.test(message)) {
    return 'This needs WebGL 2, which your browser has turned off or does not support. Try the latest Chrome, Edge, Firefox or Safari.';
  }
  return 'Something stopped the page from loading. Reload to try again.';
}

/** Turns a failed camera start into what to do about it. */
export function describeTrackingError(error: unknown): string {
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError') {
    return 'Camera access is blocked. Allow it in your browser settings, then start again.';
  }
  if (name === 'NotFoundError') return 'No camera found. Connect one, then start again.';
  if (name === 'NotReadableError') {
    return 'Another app is using the camera. Close it, then start again.';
  }
  return 'Hand tracking could not start. Check your connection, then start again.';
}
