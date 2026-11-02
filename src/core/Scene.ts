import { Color, Scene } from 'three';

export const BACKGROUND = new Color(0x08090b);

export function createScene(): Scene {
  const scene = new Scene();
  scene.background = BACKGROUND;
  return scene;
}
