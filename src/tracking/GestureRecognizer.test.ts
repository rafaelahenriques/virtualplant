import { describe, expect, it } from 'vitest';
import { recognizePinch } from './GestureRecognizer';
import { handWithPinch } from './testHand';

describe('recognizePinch', () => {
  it('reads touching fingers as fully closed', () => {
    expect(recognizePinch(handWithPinch(0)).openness).toBe(0);
  });

  it('reads spread fingers as fully open', () => {
    expect(recognizePinch(handWithPinch(1.25)).openness).toBe(1);
    expect(recognizePinch(handWithPinch(2)).openness).toBe(1);
  });

  it('opens further as the distance grows', () => {
    const narrow = recognizePinch(handWithPinch(0.5)).openness;
    const wide = recognizePinch(handWithPinch(1)).openness;
    expect(narrow).toBeGreaterThan(0);
    expect(wide).toBeGreaterThan(narrow);
    expect(wide).toBeLessThan(1);
  });

  it('gives the same reading for small and large hands', () => {
    const small = recognizePinch(handWithPinch(0.7, 0.05));
    const large = recognizePinch(handWithPinch(0.7, 0.2));
    expect(small.openness).toBeCloseTo(large.openness);
  });
});
