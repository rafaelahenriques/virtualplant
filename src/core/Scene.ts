import { Color, Scene } from 'three';

const BACKGROUND = 0x08090b;

export function createScene(): Scene {
  const scene = new Scene();
  scene.background = new Color(BACKGROUND);
  return scene;
}
