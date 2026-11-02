import { createStore } from 'zustand/vanilla';
import { clamp01, type Point } from '../core/math';
import {
  clampEnvironment,
  DEFAULT_ENVIRONMENT,
  type EnvironmentState,
} from '../ecosystem/Environment';

export const DEFAULT_GROWTH = 0.5;
export const DEFAULT_SCAN_TARGET: Point = { x: 0.5, y: 0.34 };

export interface EcosystemState {
  environment: EnvironmentState;
  /** Growth stage the plant evolves towards, from 0 (seedling) to 1 (fully grown). */
  growthTarget: number;
  /** Where the scan window is heading, as fractions of the viewport from the top left. */
  scanTarget: Point;
  setEnvironment: (patch: Partial<EnvironmentState>) => void;
  setGrowthTarget: (target: number) => void;
  setScanTarget: (target: Point) => void;
}

export function createEcosystemStore() {
  return createStore<EcosystemState>()((set) => ({
    environment: DEFAULT_ENVIRONMENT,
    growthTarget: DEFAULT_GROWTH,
    scanTarget: DEFAULT_SCAN_TARGET,
    setEnvironment: (patch) =>
      set(({ environment }) => ({ environment: clampEnvironment({ ...environment, ...patch }) })),
    setGrowthTarget: (target) => set({ growthTarget: clamp01(target) }),
    setScanTarget: ({ x, y }) => set({ scanTarget: { x: clamp01(x), y: clamp01(y) } }),
  }));
}

export type EcosystemStore = ReturnType<typeof createEcosystemStore>;

export const ecosystemStore = createEcosystemStore();
