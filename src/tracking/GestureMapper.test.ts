import type { Hand } from 'ml5';
import { describe, expect, it } from 'vitest';
import { createEcosystemStore, DEFAULT_GROWTH, DEFAULT_SCAN_TARGET } from '../store/ecosystemStore';
import { applyGestures } from './GestureMapper';
import { handWithPinch } from './testHand';

const video = { width: 640, height: 480 };
const viewport = { width: 640, height: 480 };

describe('applyGestures', () => {
  it('raises the growth target when the fingers spread', () => {
    const store = createEcosystemStore();
    applyGestures([handWithPinch(1.25)], video, viewport, store);
    expect(store.getState().growthTarget).toBe(1);
  });

  it('lowers the growth target when the fingers close', () => {
    const store = createEcosystemStore();
    applyGestures([handWithPinch(0)], video, viewport, store);
    expect(store.getState().growthTarget).toBe(0);
  });

  it('points the scan window at the palm', () => {
    const store = createEcosystemStore();
    const hand: Hand = {
      ...handWithPinch(1),
      wrist: { x: 120, y: 300, x3D: 0, y3D: 0, z3D: 0 },
      middle_finger_mcp: { x: 200, y: 180, x3D: 0, y3D: 0.1, z3D: 0 },
    };
    applyGestures([hand], video, viewport, store);
    expect(store.getState().scanTarget).toEqual({ x: 160 / 640, y: 240 / 480 });
  });

  it('holds everything when no hand is in view', () => {
    const store = createEcosystemStore();
    applyGestures([], video, viewport, store);
    expect(store.getState().growthTarget).toBe(DEFAULT_GROWTH);
    expect(store.getState().scanTarget).toEqual(DEFAULT_SCAN_TARGET);
  });
});
