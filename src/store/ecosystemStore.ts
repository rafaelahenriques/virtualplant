import { createStore } from 'zustand/vanilla';
import { clamp01, type Point } from '../core/math';
import {
  clampEnvironment,
  DEFAULT_ENVIRONMENT,
  type EnvironmentState,
} from '../ecosystem/Environment';
import { rankSpecies, type Assessment } from '../ecosystem/Suitability';
import type { Species } from '../plants/form';
import { SPECIES } from '../plants/species';

export const DEFAULT_GROWTH = 0.5;
export const DEFAULT_SCAN_TARGET: Point = { x: 0.5, y: 0.34 };

export interface EcosystemState {
  environment: EnvironmentState;
  /** Every species for this climate, best match first. */
  ranking: Assessment<Species>[];
  /** The species on show, or null if nothing can survive this climate. */
  speciesId: string | null;
  /** Growth stage the plant evolves towards, from 0 (seedling) to 1 (fully grown). */
  growthTarget: number;
  /** Where the scan window is heading, as fractions of the viewport from the top left. */
  scanTarget: Point;
  animationOn: boolean;
  setEnvironment: (patch: Partial<EnvironmentState>) => void;
  setGrowthTarget: (target: number) => void;
  setScanTarget: (target: Point) => void;
  setAnimationOn: (on: boolean) => void;
}

function matchFor(environment: EnvironmentState) {
  const ranking = rankSpecies(SPECIES, environment);
  const best = ranking[0];
  return { environment, ranking, speciesId: best && best.score > 0 ? best.species.id : null };
}

export function createEcosystemStore() {
  return createStore<EcosystemState>()((set) => ({
    ...matchFor(DEFAULT_ENVIRONMENT),
    growthTarget: DEFAULT_GROWTH,
    scanTarget: DEFAULT_SCAN_TARGET,
    animationOn: true,
    setEnvironment: (patch) =>
      set(({ environment }) => matchFor(clampEnvironment({ ...environment, ...patch }))),
    setGrowthTarget: (target) => set({ growthTarget: clamp01(target) }),
    setScanTarget: ({ x, y }) => set({ scanTarget: { x: clamp01(x), y: clamp01(y) } }),
    setAnimationOn: (on) => set({ animationOn: on }),
  }));
}

export type EcosystemStore = ReturnType<typeof createEcosystemStore>;

export const ecosystemStore = createEcosystemStore();
