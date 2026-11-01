import { describe, expect, it } from 'vitest';
import { ScanWindow } from './ScanWindow';

const viewport = { width: 1000, height: 500 };

describe('ScanWindow', () => {
  it('centres the square on its point', () => {
    const { x, y, size } = new ScanWindow({ x: 0.5, y: 0.5 }).rect(viewport);
    expect(x + size / 2).toBe(500);
    expect(y + size / 2).toBe(250);
  });

  it('sizes the square from the smaller viewport side', () => {
    expect(new ScanWindow({ x: 0.5, y: 0.5 }).rect(viewport).size).toBe(190);
  });

  it('stays fully inside the viewport near an edge', () => {
    const topLeft = new ScanWindow({ x: 0, y: 0 }).rect(viewport);
    expect(topLeft.x).toBe(0);
    expect(topLeft.y).toBe(0);

    const bottomRight = new ScanWindow({ x: 1, y: 1 }).rect(viewport);
    expect(bottomRight.x + bottomRight.size).toBe(1000);
    expect(bottomRight.y + bottomRight.size).toBe(500);
  });

  it('eases towards its target without overshooting', () => {
    const scan = new ScanWindow({ x: 0.5, y: 0.5 });
    scan.update({ x: 0.9, y: 0.5 }, 1 / 60);
    const { x, size } = scan.rect(viewport);
    expect(x + size / 2).toBeGreaterThan(500);
    expect(x + size / 2).toBeLessThan(900);
  });

  it('settles on its target over time', () => {
    const scan = new ScanWindow({ x: 0.5, y: 0.5 });
    for (let frame = 0; frame < 300; frame++) scan.update({ x: 0.7, y: 0.4 }, 1 / 60);
    const { x, y, size } = scan.rect(viewport);
    expect(x + size / 2).toBeCloseTo(700, -1);
    expect(y + size / 2).toBeCloseTo(200, -1);
  });
});
