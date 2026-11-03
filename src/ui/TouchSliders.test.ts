import { describe, expect, it } from 'vitest';
import { fractionUnderFinger, swipeDirection } from './TouchSliders';

describe('swipeDirection', () => {
  it('waits until the finger has moved far enough to tell', () => {
    expect(swipeDirection(3, 2)).toBe('unknown');
  });

  it('counts a drifting drag as sideways, in either direction', () => {
    expect(swipeDirection(100, 15)).toBe('across');
    expect(swipeDirection(-100, 15)).toBe('across');
  });

  it('counts a swipe up or down as neither', () => {
    expect(swipeDirection(2, -70)).toBe('down');
    expect(swipeDirection(2, 70)).toBe('down');
  });
});

describe('fractionUnderFinger', () => {
  const slider = { left: 100, width: 244 };
  const thumb = 44;

  it('puts the thumb under the finger, allowing for the half thumb at each end', () => {
    expect(fractionUnderFinger(122, slider, thumb)).toBe(0);
    expect(fractionUnderFinger(222, slider, thumb)).toBe(0.5);
    expect(fractionUnderFinger(322, slider, thumb)).toBe(1);
  });

  it('stops at the ends when the finger goes past them', () => {
    expect(fractionUnderFinger(0, slider, thumb)).toBe(0);
    expect(fractionUnderFinger(1000, slider, thumb)).toBe(1);
  });
});
