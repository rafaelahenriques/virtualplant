import {
  CircleGeometry,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Scene,
} from 'three';

const BACKGROUND = 0x10181a;

export const SUN_DIRECTION = [0.5, 1, 0.6] as const;

export function createScene(): Scene {
  const scene = new Scene();
  scene.background = new Color(BACKGROUND);
  scene.fog = new Fog(BACKGROUND, 6, 16);

  scene.add(new HemisphereLight(0xcfe4d8, 0x2a2118, 1.2));

  const sun = new DirectionalLight(0xfff1dc, 2);
  sun.position.set(...SUN_DIRECTION);
  scene.add(sun);

  const ground = new Mesh(
    new CircleGeometry(20, 64),
    new MeshStandardMaterial({ color: 0x2b2a22, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  return scene;
}
