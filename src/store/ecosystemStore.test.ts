import { describe, expect, it } from 'vitest';
import { CLIMATE_FACTORS, DEFAULT_ENVIRONMENT } from '../ecosystem/Environment';
import { CLIMATE_PRESETS } from '../ecosystem/presets';
import { rankSpecies } from '../ecosystem/Suitability';
import { SPECIES } from '../plants/species';
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

  it('keeps the closest plant on show where nothing could survive', () => {
    const store = createEcosystemStore();
    store.getState().setEnvironment({ temperature: 33, humidity: 20, rainfall: 0, sunlight: 11 });
    expect(store.getState().ranking[0]?.score).toBe(0);
    expect(store.getState().speciesId).toBe('hedgehog');
  });

  it('keeps the plant on show while a slider moves, until another fits clearly better', () => {
    const store = createEcosystemStore();
    store.getState().setEnvironment({ temperature: 19, humidity: 47, rainfall: 750, sunlight: 9 });
    expect(store.getState().speciesId).toBe('lavender');

    // Sunflower is now as good a fit and nearer its centre, but lavender still fits.
    store.getState().adjustEnvironment({ temperature: 24 });
    expect(rankSpecies(SPECIES, store.getState().environment)[0]?.species.id).toBe('sunflower');
    expect(store.getState().speciesId).toBe('lavender');
    expect(store.getState().ranking[0]?.species.id).toBe('lavender');

    store.getState().adjustEnvironment({ temperature: 27 });
    expect(store.getState().speciesId).toBe('sunflower');
  });

  it('gives each place its own plant, whatever was on show', () => {
    const store = createEcosystemStore();
    for (const from of CLIMATE_PRESETS) {
      for (const to of CLIMATE_PRESETS) {
        store.getState().setEnvironment(from.environment);
        store.getState().setEnvironment(to.environment);
        expect(store.getState().speciesId).toBe(to.expected);
      }
    }
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

  it('hides and shows the interface', () => {
    const store = createEcosystemStore();
    expect(store.getState().interfaceVisible).toBe(true);
    store.getState().setInterfaceVisible(false);
    expect(store.getState().interfaceVisible).toBe(false);
  });
});
