import { AnimationLoop } from './core/AnimationLoop';
import { createCamera } from './core/Camera';
import { createRenderer, fitToContainer } from './core/Renderer';
import { createScene } from './core/Scene';
import { Plant } from './plants/Plant';
import { ecosystemStore } from './store/ecosystemStore';
import { applyGestures } from './tracking/GestureMapper';
import { HandTracker } from './tracking/HandTracker';
import { createEnvironmentPanel } from './ui/EnvironmentPanel';
import { HUD } from './ui/HUD';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing #app container');

const scene = createScene();
const camera = createCamera(container.clientWidth / container.clientHeight);
const renderer = createRenderer(container);
fitToContainer(container, renderer, camera);

const plant = new Plant(ecosystemStore.getState().growthTarget);
scene.add(plant.object);

const tracker = new HandTracker();
const hud = new HUD(container);
tracker.subscribe((hands) => applyGestures(hands, ecosystemStore));
tracker.subscribe((hands, video) => hud.draw(hands, video));

createEnvironmentPanel(ecosystemStore, tracker);

const loop = new AnimationLoop(renderer);
loop.add((frame) => {
  const { environment, growthTarget } = ecosystemStore.getState();
  plant.update(frame, environment.wind, growthTarget);
  renderer.render(scene, camera);
});
loop.start();
