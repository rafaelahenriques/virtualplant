import '@fontsource-variable/schibsted-grotesk';
import '@fontsource/instrument-serif/400-italic.css';
import './style.css';
import type { WebGLRenderer } from 'three';
import type { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { AnimationLoop } from './core/AnimationLoop';
import { createCamera, frameSubject, pixelsPerCentimetre } from './core/Camera';
import { createGlowComposer, createRenderer, fitToContainer, renderInRect } from './core/Renderer';
import { BACKGROUND, createScene } from './core/Scene';
import { ScanWindow } from './core/ScanWindow';
import { PlantManager } from './ecosystem/PlantManager';
import { SPECIES } from './plants/species';
import { DEFAULT_GROWTH, ecosystemStore } from './store/ecosystemStore';
import { applyGestures } from './tracking/GestureMapper';
import { HandTracker } from './tracking/HandTracker';
import { BootScreen } from './ui/BootScreen';
import { describeStartupError } from './ui/copy';
import { required } from './ui/element';
import { createEnvironmentPanel } from './ui/EnvironmentPanel';
import { createGrowthScale } from './ui/GrowthScale';
import { HUD } from './ui/HUD';
import { createSpeciesPanel } from './ui/SpeciesPanel';
import { createToolbar } from './ui/Toolbar';

const HAND_MODEL_WAIT_MS = 7000;
const SPECIES_WEIGHT = 1;
const HAND_MODEL_WEIGHT = 6;

const count = new Intl.NumberFormat('en');

function describeGraphics(renderer: WebGLRenderer): string {
  const gl = renderer.getContext();
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'WebGL 2';
  // Browsers wrap the name, as in "ANGLE (Apple, ANGLE Metal Renderer: Apple M4, Version)".
  return name.match(/Renderer: ([^,)]+)/)?.[1] ?? name.replace(/^ANGLE \(|\)$/g, '');
}

async function describeCamera(): Promise<string> {
  const devices = await navigator.mediaDevices?.enumerateDevices();
  const found = devices?.some((device) => device.kind === 'videoinput');
  return found ? 'Found, off until you start it' : 'None found yet';
}

/** Waits a while for the hand model, without holding the page back if the network is slow. */
async function describeHandModel(tracker: HandTracker): Promise<string> {
  const timeout = new Promise<string>((resolve) => {
    setTimeout(() => resolve('Still loading in background'), HAND_MODEL_WAIT_MS);
  });
  const load = tracker.loadModel().then(
    () => 'Ready',
    () => 'Will retry when you start it',
  );
  return Promise.race([load, timeout]);
}

async function main(boot: BootScreen): Promise<void> {
  const app = required('app');
  const viewport = () => ({ width: app.clientWidth, height: app.clientHeight });

  const scene = createScene();
  const camera = createCamera(app.clientWidth / app.clientHeight);
  const plants = new PlantManager(scene, 0);
  const tracker = new HandTracker();
  const sources = new Set(SPECIES.flatMap((species) => species.sources.map(({ url }) => url)));

  // Graphics, climate data, compile, camera and interface each count for one step.
  boot.plan(5 + SPECIES.length * SPECIES_WEIGHT + HAND_MODEL_WEIGHT);

  let renderer!: WebGLRenderer;
  let composer!: EffectComposer;
  await boot.step('Graphics', () => {
    renderer = createRenderer(app);
    composer = createGlowComposer(renderer, scene, camera);
    fitToContainer(app, renderer, composer, camera);
    return describeGraphics(renderer);
  });

  await boot.step('Climate data', () => `${SPECIES.length} species, ${sources.size} sources`);

  for (const species of SPECIES) {
    await boot.step(
      species.scientificName,
      () => `${count.format(plants.add(species).triangleCount)} triangles`,
      SPECIES_WEIGHT,
    );
  }

  await boot.step('Shaders', async () => `${await plants.compile(renderer, camera)} programs`);
  await boot.step('Camera', describeCamera);
  await boot.step('Hand model', () => describeHandModel(tracker), HAND_MODEL_WEIGHT);

  const hud = new HUD(app);
  const scan = new ScanWindow(ecosystemStore.getState().scanTarget);
  await boot.step('Interface', () => {
    tracker.subscribe((hands, video) => applyGestures(hands, video, viewport(), ecosystemStore));
    tracker.subscribe((hands, video) => hud.setHands(hands, video));
    createEnvironmentPanel(ecosystemStore);
    createSpeciesPanel(ecosystemStore);
    createGrowthScale(ecosystemStore);
    createToolbar(ecosystemStore, tracker);
    return 'Ready';
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ecosystemStore.getState().setAnimationOn(false);
  }

  ecosystemStore.getState().setGrowthTarget(0);
  plants.show(ecosystemStore.getState().speciesId);
  ecosystemStore.subscribe(({ speciesId: next }) => plants.show(next));

  const loop = new AnimationLoop(renderer);
  loop.add((frame) => {
    const { animationOn, growthTarget, interfaceVisible, scanTarget } = ecosystemStore.getState();
    plants.update(frame, growthTarget, animationOn);
    scan.update(scanTarget, frame.delta);
    const scanRect = scan.rect(viewport());
    const view = plants.view;
    frameSubject(camera, view);

    plants.setLook('xray');
    scene.background = BACKGROUND;
    composer.render(frame.delta);

    plants.setLook('specimen');
    scene.background = plants.windowColor;
    renderInRect(renderer, scene, camera, scanRect);

    hud.draw(
      scanRect,
      plants.label,
      pixelsPerCentimetre(camera, viewport().height, view.span),
      interfaceVisible,
    );
  });
  loop.start();

  // The plant grows in from a seedling as the sweep uncovers it.
  await boot.reveal(() => ecosystemStore.getState().setGrowthTarget(DEFAULT_GROWTH));
}

const boot = new BootScreen();
main(boot).catch((error: unknown) => {
  console.error('Startup failed', error);
  boot.fail(describeStartupError(error));
});
