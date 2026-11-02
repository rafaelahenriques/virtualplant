import type { Hand, NamedHandKeypoint } from 'ml5';
import { clamp01, type Point } from '../core/math';

// Thumb-to-index distance as a multiple of palm length.
const PINCHED_RATIO = 0.25;
const SPREAD_RATIO = 1.25;

interface Pinch {
  /** Thumb-to-index distance divided by palm length. */
  ratio: number;
  /** 0 when the fingers touch, 1 when they are fully spread. */
  openness: number;
}

/**
 * Uses 3D keypoints relative to palm length, so the reading stays the same when the hand
 * moves towards the camera or tilts.
 */
export function recognizePinch(hand: Hand): Pinch {
  const ratio =
    distance3D(hand.thumb_tip, hand.index_finger_tip) /
    distance3D(hand.wrist, hand.middle_finger_mcp);

  return {
    ratio,
    openness: clamp01((ratio - PINCHED_RATIO) / (SPREAD_RATIO - PINCHED_RATIO)),
  };
}

/** The centre of the palm in video pixels, which stays put while the fingers pinch. */
export function palmCenter(hand: Hand): Point {
  return {
    x: (hand.wrist.x + hand.middle_finger_mcp.x) / 2,
    y: (hand.wrist.y + hand.middle_finger_mcp.y) / 2,
  };
}

function distance3D(a: NamedHandKeypoint, b: NamedHandKeypoint): number {
  return Math.hypot(a.x3D - b.x3D, a.y3D - b.y3D, a.z3D - b.z3D);
}
