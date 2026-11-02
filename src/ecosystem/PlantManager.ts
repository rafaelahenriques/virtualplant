import gsap from 'gsap';
import { Color, type Camera, type Scene, type WebGLRenderer } from 'three';
import type { Frame } from '../core/AnimationLoop';
import type { Species } from '../plants/form';
import { stepGrowth } from '../plants/GrowthSystem';
import { Plant, type Look } from '../plants/Plant';

const DISSOLVE_OUT = 0.3;
const DISSOLVE_IN = 0.6;
const MOTION_RATE = 3;
const WINDOW_COLOR_RATE = 4;
const EMPTY_VIEW = { center: 30, span: 60 };

// Keeps transitions on time when frames are slow, rather than stretching them out.
gsap.ticker.lagSmoothing(0);

/** Holds one built plant per species and keeps the one the climate supports on show. */
export class PlantManager {
  private readonly scene: Scene;
  private readonly plants = new Map<string, Plant>();
  private readonly windowColors = new Map<Plant, Color>();
  private active: Plant | null = null;
  private target: Plant | null = null;
  private transition: gsap.core.Tween | null = null;
  private growth: number;
  private motion: number;
  /** Eases to the next plant's tint, so the window doesn't flash when plants swap. */
  readonly windowColor = new Color(0x15171a);

  constructor(scene: Scene, growth: number, motion: number) {
    this.scene = scene;
    this.growth = growth;
    this.motion = motion;
  }

  add(species: Species): Plant {
    const plant = new Plant(species);
    this.plants.set(species.id, plant);
    this.windowColors.set(plant, new Color(species.windowColor));
    this.scene.add(plant.object);
    return plant;
  }

  /** Compiles every shader ahead of time, so nothing stalls when a species first appears. */
  async compile(renderer: WebGLRenderer, camera: Camera): Promise<number> {
    const plants = [...this.plants.values()];
    for (const plant of plants) plant.object.visible = true;
    for (const look of ['xray', 'specimen'] as const) {
      for (const plant of plants) plant.setLook(look);
      await renderer.compileAsync(this.scene, camera);
    }
    for (const plant of plants) plant.object.visible = false;
    return renderer.info.programs?.length ?? 0;
  }

  /** What the scan window's label calls the plant in view, such as `lotus.bud`. */
  get label(): string {
    return this.active ? `${this.active.species.id}.${this.active.stage}` : 'none';
  }

  get view(): { center: number; span: number } {
    return this.active?.view ?? EMPTY_VIEW;
  }

  /** Dissolves the current plant into dots, then brings in the next. */
  show(id: string): void {
    const next = this.plants.get(id);
    if (!next || next === this.target) return;
    this.target = next;
    this.transition?.kill();

    const previous = this.active;
    if (next === previous) {
      this.transition = gsap.to(next.reveal, { value: 1, duration: DISSOLVE_IN });
      return;
    }

    const appear = () => {
      if (previous) previous.object.visible = false;
      this.active = next;
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
    const tint = this.target && this.windowColors.get(this.target);
    if (tint) this.windowColor.lerp(tint, 1 - Math.exp(-WINDOW_COLOR_RATE * frame.delta));
  }

  setLook(look: Look): void {
    this.active?.setLook(look);
  }
}
