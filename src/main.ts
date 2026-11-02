import { AnimationLoop } from './core/AnimationLoop';
import { createCamera, frameSubject, pixelsPerCentimetre } from './core/Camera';
import { createRenderer, fitToContainer, renderInRect } from './core/Renderer';
import { BACKGROUND, createScene } from './core/Scene';
import { ScanWindow } from './core/ScanWindow';
import { PlantManager } from './ecosystem/PlantManager';
import { SPECIES } from './plants/species';
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

const { growthTarget, scanTarget, speciesId } = ecosystemStore.getState();
const plants = new PlantManager(scene, SPECIES, growthTarget);
plants.show(speciesId);
ecosystemStore.subscribe(({ speciesId: next }) => plants.show(next));
const scan = new ScanWindow(scanTarget);

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  ecosystemStore.getState().setAnimationOn(false);
}

const tracker = new HandTracker();
const hud = new HUD(app);
tracker.subscribe((hands, video) => applyGestures(hands, video, viewport(), ecosystemStore));
tracker.subscribe((hands, video) => hud.setHands(hands, video));

createEnvironmentPanel(ecosystemStore, tracker);

const loop = new AnimationLoop(renderer);
loop.add((frame) => {
  const { animationOn, growthTarget, scanTarget } = ecosystemStore.getState();
  plants.update(frame, growthTarget, animationOn);
  scan.update(scanTarget, frame.delta);
  const scanRect = scan.rect(viewport());
  const view = plants.view;
  frameSubject(camera, view);

  plants.setLook('xray');
  scene.background = BACKGROUND;
  renderer.render(scene, camera);

  plants.setLook('specimen');
  scene.background = plants.windowColor;
  renderInRect(renderer, scene, camera, scanRect);

  hud.draw(
    scanRect,
    `${plants.speciesId}.${plants.stage}`,
    pixelsPerCentimetre(camera, viewport().height, view.span),
  );
});
loop.start();
