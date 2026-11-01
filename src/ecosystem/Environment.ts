import { clamp01 } from '../core/math';

/** Every value is normalised to 0..1, so gestures and the simulation share one scale. */
export interface EnvironmentState {
  temperature: number;
  humidity: number;
  rainfall: number;
  sunlight: number;
  wind: number;
  pollution: number;
}

export const DEFAULT_ENVIRONMENT: EnvironmentState = {
  temperature: 0.5,
  humidity: 0.5,
  rainfall: 0.3,
  sunlight: 0.7,
  wind: 0.2,
  pollution: 0,
};

export function clampEnvironment(state: EnvironmentState): EnvironmentState {
  return {
    temperature: clamp01(state.temperature),
    humidity: clamp01(state.humidity),
    rainfall: clamp01(state.rainfall),
    sunlight: clamp01(state.sunlight),
    wind: clamp01(state.wind),
    pollution: clamp01(state.pollution),
  };
}
