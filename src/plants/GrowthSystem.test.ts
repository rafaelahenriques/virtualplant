import { describe, expect, it } from 'vitest';
import { stepGrowth } from './GrowthSystem';

describe('stepGrowth', () => {
  it('grows towards a higher target without overshooting', () => {
    const next = stepGrowth(0.2, 0.8, 1 / 60);
    expect(next).toBeGreaterThan(0.2);
    expect(next).toBeLessThan(0.8);
  });

  it('shrinks towards a lower target without overshooting', () => {
    const next = stepGrowth(0.8, 0.2, 1 / 60);
    expect(next).toBeLessThan(0.8);
    expect(next).toBeGreaterThan(0.2);
  });

  it('settles on the target over time', () => {
    let growth = 0;
    for (let frame = 0; frame < 300; frame++) growth = stepGrowth(growth, 1, 1 / 60);
    expect(growth).toBeCloseTo(1, 2);
  });

  it('does not depend on the frame rate', () => {
    let at30fps = 0;
    for (let frame = 0; frame < 30; frame++) at30fps = stepGrowth(at30fps, 1, 1 / 30);
    let at120fps = 0;
    for (let frame = 0; frame < 120; frame++) at120fps = stepGrowth(at120fps, 1, 1 / 120);
    expect(at30fps).toBeCloseTo(at120fps);
  });
});
