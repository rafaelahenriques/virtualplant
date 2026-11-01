import type { Hand } from 'ml5';
import type { EcosystemStore } from '../store/ecosystemStore';
import { recognizePinch } from './GestureRecognizer';

/** The interaction layer: turns recognised gestures into ecosystem changes. */
export function applyGestures(hands: Hand[], store: EcosystemStore): void {
  const hand = hands[0];
  // With no hand in view the plant holds its current stage.
  if (hand) store.getState().setGrowthTarget(recognizePinch(hand).openness);
}
