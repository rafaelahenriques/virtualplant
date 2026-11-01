import { describe, expect, it } from 'vitest';
import { DEFAULT_ENVIRONMENT } from '../ecosystem/Environment';
import { createEcosystemStore } from './ecosystemStore';

describe('ecosystemStore', () => {
  it('starts from the default environment', () => {
    expect(createEcosystemStore().getState().environment).toEqual(DEFAULT_ENVIRONMENT);
  });

  it('merges a patch without touching other values', () => {
    const store = createEcosystemStore();
    store.getState().setEnvironment({ wind: 0.9 });
    expect(store.getState().environment).toEqual({ ...DEFAULT_ENVIRONMENT, wind: 0.9 });
  });

  it('clamps values to 0..1', () => {
    const store = createEcosystemStore();
    store.getState().setEnvironment({ wind: 4, rainfall: -1 });
    expect(store.getState().environment.wind).toBe(1);
    expect(store.getState().environment.rainfall).toBe(0);
  });
});
