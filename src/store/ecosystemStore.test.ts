import { describe, expect, it } from 'vitest';
import { CLIMATE_FACTORS, DEFAULT_ENVIRONMENT } from '../ecosystem/Environment';
import { createEcosystemStore } from './ecosystemStore';

describe('ecosystemStore', () => {
  it('starts from the default environment', () => {
    expect(createEcosystemStore().getState().environment).toEqual(DEFAULT_ENVIRONMENT);
  });

  it('merges a patch without touching other values', () => {
    const store = createEcosystemStore();
    store.getState().setEnvironment({ rainfall: 1200 });
    expect(store.getState().environment).toEqual({ ...DEFAULT_ENVIRONMENT, rainfall: 1200 });
  });

  it('clamps values to their real-world ranges', () => {
    const store = createEcosystemStore();
    store.getState().setEnvironment({ humidity: 400, temperature: -80 });
    expect(store.getState().environment.humidity).toBe(CLIMATE_FACTORS.humidity.max);
    expect(store.getState().environment.temperature).toBe(CLIMATE_FACTORS.temperature.min);
  });

  it('picks a new species when the climate changes', () => {
    const store = createEcosystemStore();
    store.getState().setEnvironment({ temperature: 27, humidity: 80, rainfall: 3800, sunlight: 2 });
    expect(store.getState().speciesId).toBe('orchid');
  });

  it('shows nothing where nothing can survive', () => {
    const store = createEcosystemStore();
    store.getState().setEnvironment({ temperature: 33, humidity: 20, rainfall: 0, sunlight: 11 });
    expect(store.getState().speciesId).toBeNull();
  });

  it('clamps the growth target to 0..1', () => {
    const store = createEcosystemStore();
    store.getState().setGrowthTarget(3);
    expect(store.getState().growthTarget).toBe(1);
    store.getState().setGrowthTarget(-3);
    expect(store.getState().growthTarget).toBe(0);
  });

  it('clamps the scan target to the viewport', () => {
    const store = createEcosystemStore();
    store.getState().setScanTarget({ x: 1.4, y: -0.2 });
    expect(store.getState().scanTarget).toEqual({ x: 1, y: 0 });
  });

  it('turns animation on and off', () => {
    const store = createEcosystemStore();
    expect(store.getState().animationOn).toBe(true);
    store.getState().setAnimationOn(false);
    expect(store.getState().animationOn).toBe(false);
  });
});
