import { createStore } from 'zustand/vanilla';
import { clamp01 } from '../core/math';
import {
  clampEnvironment,
  DEFAULT_ENVIRONMENT,
  type EnvironmentState,
} from '../ecosystem/Environment';

export const DEFAULT_GROWTH = 0.5;

export interface EcosystemState {
  environment: EnvironmentState;
  /** Growth stage the plant evolves towards, from 0 (seedling) to 1 (fully grown). */
  growthTarget: number;
  setEnvironment: (patch: Partial<EnvironmentState>) => void;
  setGrowthTarget: (target: number) => void;
}

export function createEcosystemStore() {
  return createStore<EcosystemState>()((set) => ({
    environment: DEFAULT_ENVIRONMENT,
    growthTarget: DEFAULT_GROWTH,
    setEnvironment: (patch) =>
      set(({ environment }) => ({ environment: clampEnvironment({ ...environment, ...patch }) })),
    setGrowthTarget: (target) => set({ growthTarget: clamp01(target) }),
  }));
}

export type EcosystemStore = ReturnType<typeof createEcosystemStore>;

export const ecosystemStore = createEcosystemStore();
