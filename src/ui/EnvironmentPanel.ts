import GUI from 'lil-gui';
import { CLIMATE_FACTORS, FACTOR_KEYS } from '../ecosystem/Environment';
import { CLIMATE_PRESETS } from '../ecosystem/presets';
import type { EcosystemStore } from '../store/ecosystemStore';
import type { HandTracker } from '../tracking/HandTracker';

/** Development controls for the climate, growth and hand tracking. */
export function createEnvironmentPanel(store: EcosystemStore, tracker: HandTracker): GUI {
  const gui = new GUI({ title: 'Ecosystem' });

  const growth = {
    get target() {
      return store.getState().growthTarget;
    },
    set target(value: number) {
      store.getState().setGrowthTarget(value);
    },
    get animation() {
      return store.getState().animationOn;
    },
    set animation(on: boolean) {
      store.getState().setAnimationOn(on);
    },
  };
  gui.add(growth, 'target', 0, 1, 0.01).name('Growth').decimals(2).listen();
  gui.add(growth, 'animation').name('Animation').listen();

  const climate = gui.addFolder('Climate');
  const places = {
    place: '',
  };
  const names = Object.fromEntries(CLIMATE_PRESETS.map((preset) => [preset.name, preset.name]));
  climate
    .add(places, 'place', names)
    .name('Real place')
    .onChange((name: string) => {
      const preset = CLIMATE_PRESETS.find((candidate) => candidate.name === name);
      if (preset) store.getState().setEnvironment(preset.environment);
    });

  for (const key of FACTOR_KEYS) {
    const { label, unit, min, max, step } = CLIMATE_FACTORS[key];
    const binding = {
      get value() {
        return store.getState().environment[key];
      },
      set value(value: number) {
        store.getState().setEnvironment({ [key]: value });
      },
    };
    climate.add(binding, 'value', min, max, step).name(`${label} (${unit})`).listen();
  }

  const match = {
    get species() {
      const best = store.getState().ranking[0];
      return best && best.score > 0 ? best.species.commonName : 'No viable species';
    },
    get score() {
      const best = store.getState().ranking[0];
      return best ? `${Math.round(best.score * 100)}%` : '0%';
    },
    get limitedBy() {
      const best = store.getState().ranking[0];
      return best ? CLIMATE_FACTORS[best.limitingFactor].label : '';
    },
  };
  const result = gui.addFolder('Best match');
  result.add(match, 'species').name('Species').disable().listen();
  result.add(match, 'score').name('Match').disable().listen();
  result.add(match, 'limitedBy').name('Limited by').disable().listen();

  addHandTrackingControls(gui, tracker);
  return gui;
}

function addHandTrackingControls(gui: GUI, tracker: HandTracker): void {
  const folder = gui.addFolder('Hand tracking');
  const state = {
    status: 'off',
    hands: 0,
    toggle: async () => {
      if (state.status === 'tracking') {
        tracker.stop();
        state.status = 'off';
        button.name('Start');
        return;
      }

      state.status = 'loading';
      button.disable();
      try {
        await tracker.start();
        state.status = 'tracking';
        button.name('Stop');
      } catch (error) {
        tracker.stop();
        state.status = error instanceof Error ? error.name : 'failed';
        console.error('Hand tracking failed to start', error);
      } finally {
        button.enable();
      }
    },
  };

  tracker.subscribe((hands) => {
    state.hands = hands.length;
  });

  folder.add(state, 'status').name('Status').disable().listen();
  folder.add(state, 'hands').name('Hands').disable().listen();
  const button = folder.add(state, 'toggle').name('Start');
}
