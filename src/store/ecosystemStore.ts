import { createStore } from 'zustand/vanilla';
import { clamp01, type Point } from '../core/math';
import {
  clampEnvironment,
  DEFAULT_ENVIRONMENT,
  type EnvironmentState,
} from '../ecosystem/Environment';
import { rankSpecies, type Assessment } from '../ecosystem/Suitability';
import type { Species } from '../plants/form';
import { SPECIES } from '../plants/species';

export const DEFAULT_GROWTH = 0.78;
export const DEFAULT_SCAN_TARGET: Point = { x: 0.5, y: 0.34 };

// While a slider moves, the plant on show stays until another fits this much better. Otherwise it
// would keep swapping between plants that fit about equally well.
const KEEP_PLANT_MARGIN = 0.1;

export interface EcosystemState {
  environment: EnvironmentState;
  /** Every species for this climate: the one on show first, then best match first. */
  ranking: Assessment<Species>[];
  /** The species on show: the best match, or the closest if nothing could survive this climate. */
  speciesId: string;
  /** Growth stage the plant evolves towards, from 0 (seedling) to 1 (fully grown). */
  growthTarget: number;
  /** Where the scan window is heading, as fractions of the viewport from the top left. */
  scanTarget: Point;
  animationOn: boolean;
  musicOn: boolean;
  /** False leaves only the plant, its scan window and the button to bring the interface back. */
  interfaceVisible: boolean;
  /** Sets a climate and shows its best match, as when choosing a place. */
  setEnvironment: (patch: Partial<EnvironmentState>) => void;
  /** Changes a climate gradually, as with a slider, without swapping plants needlessly. */
  adjustEnvironment: (patch: Partial<EnvironmentState>) => void;
  setGrowthTarget: (target: number) => void;
  setScanTarget: (target: Point) => void;
  setAnimationOn: (on: boolean) => void;
  setMusicOn: (on: boolean) => void;
  setInterfaceVisible: (visible: boolean) => void;
}

function matchFor(environment: EnvironmentState, onShow?: string) {
  const ranking = rankSpecies(SPECIES, environment);
  const best = ranking[0] as Assessment<Species>;
  const kept = ranking.find(
    ({ species, score }) =>
      species.id === onShow && score > 0 && best.score - score < KEEP_PLANT_MARGIN,
  );
  if (!kept) return { environment, ranking, speciesId: best.species.id };
  return {
    environment,
    ranking: [kept, ...ranking.filter((assessment) => assessment !== kept)],
    speciesId: kept.species.id,
  };
}

export function createEcosystemStore() {
  return createStore<EcosystemState>()((set) => ({
    ...matchFor(DEFAULT_ENVIRONMENT),
    growthTarget: DEFAULT_GROWTH,
    scanTarget: DEFAULT_SCAN_TARGET,
    animationOn: true,
    musicOn: false,
    interfaceVisible: true,
    setEnvironment: (patch) =>
      set(({ environment }) => matchFor(clampEnvironment({ ...environment, ...patch }))),
    adjustEnvironment: (patch) =>
      set(({ environment, speciesId }) =>
        matchFor(clampEnvironment({ ...environment, ...patch }), speciesId),
      ),
    setGrowthTarget: (target) => set({ growthTarget: clamp01(target) }),
    setScanTarget: ({ x, y }) => set({ scanTarget: { x: clamp01(x), y: clamp01(y) } }),
    setAnimationOn: (on) => set({ animationOn: on }),
    setMusicOn: (on) => set({ musicOn: on }),
    setInterfaceVisible: (visible) => set({ interfaceVisible: visible }),
  }));
}

export type EcosystemStore = ReturnType<typeof createEcosystemStore>;

export const ecosystemStore = createEcosystemStore();
