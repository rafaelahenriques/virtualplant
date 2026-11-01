import type { Hand } from 'ml5';
import type { Size } from '../core/math';
import type { EcosystemStore } from '../store/ecosystemStore';
import { palmCenter, recognizePinch } from './GestureRecognizer';
import { videoToViewport } from './videoSpace';

/** The interaction layer: turns recognised gestures into ecosystem changes. */
export function applyGestures(
  hands: Hand[],
  video: Size,
  viewport: Size,
  store: EcosystemStore,
): void {
  const hand = hands[0];
  // With no hand in view the plant holds its stage and the scan window stays where it is.
  if (!hand) return;

  const { setGrowthTarget, setScanTarget } = store.getState();
  setGrowthTarget(recognizePinch(hand).openness);

  const palm = videoToViewport(palmCenter(hand), video, viewport);
  setScanTarget({ x: palm.x / viewport.width, y: palm.y / viewport.height });
}
