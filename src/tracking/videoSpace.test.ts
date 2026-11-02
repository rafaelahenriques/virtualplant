import { describe, expect, it } from 'vitest';
import { videoToViewport } from './videoSpace';

const video = { width: 640, height: 480 };

describe('videoToViewport', () => {
  it('keeps the centre of the video at the centre of the viewport', () => {
    const viewport = { width: 1600, height: 800 };
    expect(videoToViewport({ x: 320, y: 240 }, video, viewport)).toEqual({ x: 800, y: 400 });
  });

  it('scales to fill a viewport wider than the video, cropping top and bottom', () => {
    const viewport = { width: 1600, height: 800 };
    const topLeft = videoToViewport({ x: 0, y: 0 }, video, viewport);
    expect(topLeft.x).toBe(0);
    expect(topLeft.y).toBeLessThan(0);
  });

  it('scales to fill a viewport taller than the video, cropping the sides', () => {
    const viewport = { width: 600, height: 900 };
    const topLeft = videoToViewport({ x: 0, y: 0 }, video, viewport);
    expect(topLeft.x).toBeLessThan(0);
    expect(topLeft.y).toBe(0);
  });
});
