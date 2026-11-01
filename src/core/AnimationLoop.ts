import { Timer, type WebGLRenderer } from 'three';

export interface Frame {
  /** Seconds since the previous frame. */
  delta: number;
  /** Seconds since the loop started. */
  elapsed: number;
}

export type FrameCallback = (frame: Frame) => void;

export class AnimationLoop {
  private readonly renderer: WebGLRenderer;
  private readonly timer = new Timer();
  private readonly callbacks = new Set<FrameCallback>();

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
    // Keeps delta small after the tab has been in the background.
    this.timer.connect(document);
  }

  add(callback: FrameCallback): void {
    this.callbacks.add(callback);
  }

  start(): void {
    this.renderer.setAnimationLoop((time) => {
      this.timer.update(time);
      const frame = { delta: this.timer.getDelta(), elapsed: this.timer.getElapsed() };
      for (const callback of this.callbacks) callback(frame);
    });
  }

  stop(): void {
    this.renderer.setAnimationLoop(null);
  }
}
