import { AnimationLoop } from './core/AnimationLoop';
import { createCamera } from './core/Camera';
import { createRenderer, fitToContainer, renderInRect } from './core/Renderer';
import { BACKGROUND, createScene, SCAN_BACKGROUND } from './core/Scene';
import { ScanWindow } from './core/ScanWindow';
import { Plant } from './plants/Plant';
import { ecosystemStore } from './store/ecosystemStore';
import { applyGestures } from './tracking/GestureMapper';
import { HandTracker } from './tracking/HandTracker';
import { createEnvironmentPanel } from './ui/EnvironmentPanel';
import { HUD } from './ui/HUD';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing #app container');
const app = container;

const viewport = () => ({ width: app.clientWidth, height: app.clientHeight });

const scene = createScene();
const camera = createCamera(app.clientWidth / app.clientHeight);
const renderer = createRenderer(app);
fitToContainer(app, renderer, camera);

const { growthTarget, scanTarget } = ecosystemStore.getState();
const plant = new Plant(growthTarget);
scene.add(plant.object);
const scan = new ScanWindow(scanTarget);

const tracker = new HandTracker();
const hud = new HUD(app);
tracker.subscribe((hands, video) => applyGestures(hands, video, viewport(), ecosystemStore));
tracker.subscribe((hands, video) => hud.setHands(hands, video));

createEnvironmentPanel(ecosystemStore, tracker);

const loop = new AnimationLoop(renderer);
loop.add((frame) => {
  const { environment, growthTarget, scanTarget } = ecosystemStore.getState();
  plant.update(frame, environment.wind, growthTarget);
  scan.update(scanTarget, frame.delta);
  const scanRect = scan.rect(viewport());

  plant.setLook('xray');
  scene.background = BACKGROUND;
  renderer.render(scene, camera);

  plant.setLook('specimen');
  scene.background = SCAN_BACKGROUND;
  renderInRect(renderer, scene, camera, scanRect);

  hud.draw(scanRect, plant.stage);
});
loop.start();
