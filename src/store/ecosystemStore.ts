import { createStore } from 'zustand/vanilla';
import {
  clampEnvironment,
  DEFAULT_ENVIRONMENT,
  type EnvironmentState,
} from '../ecosystem/Environment';

export interface EcosystemState {
  environment: EnvironmentState;
  setEnvironment: (patch: Partial<EnvironmentState>) => void;
}

export function createEcosystemStore() {
  return createStore<EcosystemState>()((set) => ({
    environment: DEFAULT_ENVIRONMENT,
    setEnvironment: (patch) =>
      set(({ environment }) => ({ environment: clampEnvironment({ ...environment, ...patch }) })),
  }));
}

export type EcosystemStore = ReturnType<typeof createEcosystemStore>;

export const ecosystemStore = createEcosystemStore();
