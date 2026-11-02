import gsap from 'gsap';
import { Color, type Scene } from 'three';
import type { Frame } from '../core/AnimationLoop';
import type { Species } from '../plants/form';
import { stepGrowth } from '../plants/GrowthSystem';
import { Plant, type Look } from '../plants/Plant';

const DISSOLVE_OUT = 0.3;
const DISSOLVE_IN = 0.6;
const MOTION_RATE = 3;
const EMPTY_WINDOW = new Color(0x15171a);
const EMPTY_VIEW = { center: 30, span: 60 };

/** Holds one built plant per species and keeps the one the climate supports on show. */
export class PlantManager {
  private readonly plants = new Map<string, Plant>();
  private readonly windowColors = new Map<Plant, Color>();
  private active: Plant | null = null;
  private target: Plant | null = null;
  private transition: gsap.core.Tween | null = null;
  private growth: number;
  private motion = 1;
  private lastView = EMPTY_VIEW;

  constructor(scene: Scene, species: readonly Species[], growth: number) {
    this.growth = growth;
    for (const entry of species) {
      const plant = new Plant(entry);
      this.plants.set(entry.id, plant);
      this.windowColors.set(plant, new Color(entry.windowColor));
      scene.add(plant.object);
    }
  }

  get stage(): string {
    return this.active?.stage ?? 'none';
  }

  get speciesId(): string {
    return this.active?.species.id ?? 'none';
  }

  get windowColor(): Color {
    return (this.active && this.windowColors.get(this.active)) ?? EMPTY_WINDOW;
  }

  /** Stays where it was while nothing is on show, so the camera doesn't jump. */
  get view(): { center: number; span: number } {
    if (this.active) this.lastView = this.active.view;
    return this.lastView;
  }

  /** Dissolves the current plant into dots, then brings in the next, if there is one. */
  show(id: string | null): void {
    const next = id === null ? null : (this.plants.get(id) ?? null);
    if (next === this.target) return;
    this.target = next;
    this.transition?.kill();

    const previous = this.active;
    if (next === previous && next) {
      this.transition = gsap.to(next.reveal, { value: 1, duration: DISSOLVE_IN });
      return;
    }

    const appear = () => {
      if (previous) previous.object.visible = false;
      this.active = next;
      if (!next) return;
      next.reveal.value = 0;
      next.object.visible = true;
      next.update(0, this.growth, this.motion);
      this.transition = gsap.to(next.reveal, { value: 1, duration: DISSOLVE_IN });
    };

    if (previous) {
      this.transition = gsap.to(previous.reveal, {
        value: 0,
        duration: DISSOLVE_OUT,
        onComplete: appear,
      });
    } else {
      appear();
    }
  }

  update(frame: Frame, growthTarget: number, animationOn: boolean): void {
    this.growth = stepGrowth(this.growth, growthTarget, frame.delta);
    const motionTarget = animationOn ? 1 : 0;
    this.motion += (motionTarget - this.motion) * (1 - Math.exp(-MOTION_RATE * frame.delta));
    this.active?.update(frame.elapsed, this.growth, this.motion);
  }

  setLook(look: Look): void {
    this.active?.setLook(look);
  }
}
