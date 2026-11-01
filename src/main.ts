import { AnimationLoop } from './core/AnimationLoop';
import { createCamera } from './core/Camera';
import { createRenderer, fitToContainer } from './core/Renderer';
import { createScene } from './core/Scene';
import { Plant } from './plants/Plant';
import { ecosystemStore } from './store/ecosystemStore';
import { HandTracker } from './tracking/HandTracker';
import { createEnvironmentPanel } from './ui/EnvironmentPanel';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing #app container');

const scene = createScene();
const camera = createCamera(container.clientWidth / container.clientHeight);
const renderer = createRenderer(container);
fitToContainer(container, renderer, camera);

const plant = new Plant();
scene.add(plant.object);

createEnvironmentPanel(ecosystemStore, new HandTracker());

const loop = new AnimationLoop(renderer);
loop.add(({ elapsed }) => {
  plant.update(elapsed, ecosystemStore.getState().environment.wind);
  renderer.render(scene, camera);
});
loop.start();
