import { Timer, type WebGLRenderer } from 'three';

export interface Frame {
  /** Seconds since the previous frame. */
  delta: number;
  /** Seconds since the loop started. */
  elapsed: number;
}

export class AnimationLoop {
  private readonly renderer: WebGLRenderer;
  private readonly timer = new Timer();

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
    // Keeps delta small after the tab has been in the background.
    this.timer.connect(document);
  }

  start(callback: (frame: Frame) => void): void {
    this.renderer.setAnimationLoop((time) => {
      this.timer.update(time);
      callback({ delta: this.timer.getDelta(), elapsed: this.timer.getElapsed() });
    });
  }
}
