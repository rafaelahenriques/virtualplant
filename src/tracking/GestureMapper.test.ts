import { describe, expect, it } from 'vitest';
import { createEcosystemStore, DEFAULT_GROWTH } from '../store/ecosystemStore';
import { applyGestures } from './GestureMapper';
import { handWithPinch } from './testHand';

describe('applyGestures', () => {
  it('raises the growth target when the fingers spread', () => {
    const store = createEcosystemStore();
    applyGestures([handWithPinch(1.25)], store);
    expect(store.getState().growthTarget).toBe(1);
  });

  it('lowers the growth target when the fingers close', () => {
    const store = createEcosystemStore();
    applyGestures([handWithPinch(0)], store);
    expect(store.getState().growthTarget).toBe(0);
  });

  it('holds the growth target when no hand is in view', () => {
    const store = createEcosystemStore();
    applyGestures([], store);
    expect(store.getState().growthTarget).toBe(DEFAULT_GROWTH);
  });
});
