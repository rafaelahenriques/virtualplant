import type { Hand } from 'ml5';

const point = (x3D: number, y3D = 0, z3D = 0) => ({ x: 0, y: 0, x3D, y3D, z3D });

/** A hand with a palm of length `palm` and fingertips `ratio` palm lengths apart. */
export function handWithPinch(ratio: number, palm = 0.1): Hand {
  return {
    wrist: point(0),
    middle_finger_mcp: point(0, palm),
    thumb_tip: point(0, palm),
    index_finger_tip: point(ratio * palm, palm),
  } as Hand;
}
