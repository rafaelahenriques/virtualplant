import { Color, Scene } from 'three';

export const BACKGROUND = new Color(0x08090b);
export const SCAN_BACKGROUND = new Color(0x4a0f2e);

export function createScene(): Scene {
  const scene = new Scene();
  scene.background = BACKGROUND;
  return scene;
}
