/** Higher settles faster: at 2.5 the plant covers about 90% of a change in one second. */
const EVOLVE_RATE = 2.5;

/** Eases growth towards its target, so the plant evolves instead of snapping to the hand. */
export function stepGrowth(growth: number, target: number, delta: number): number {
  return target + (growth - target) * Math.exp(-EVOLVE_RATE * delta);
}

export const GROWTH_STAGES = ['seedling', 'shoot', 'bud', 'opening', 'bloom'] as const;

export function describeGrowth(growth: number): (typeof GROWTH_STAGES)[number] {
  if (growth < 0.15) return 'seedling';
  if (growth < 0.42) return 'shoot';
  if (growth < 0.65) return 'bud';
  if (growth < 0.92) return 'opening';
  return 'bloom';
}
