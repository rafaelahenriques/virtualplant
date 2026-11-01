import GUI from 'lil-gui';
import type { EnvironmentState } from '../ecosystem/Environment';
import type { EcosystemStore } from '../store/ecosystemStore';
import type { HandTracker } from '../tracking/HandTracker';

/** Development controls for tweaking the ecosystem and checking hand tracking. */
export function createEnvironmentPanel(store: EcosystemStore, tracker: HandTracker): GUI {
  const gui = new GUI({ title: 'Environment' });

  const growth = {
    get target() {
      return store.getState().growthTarget;
    },
    set target(value: number) {
      store.getState().setGrowthTarget(value);
    },
  };
  gui.add(growth, 'target', 0, 1, 0.01).name('growth').decimals(2).listen();

  const values = { ...store.getState().environment };
  for (const key of Object.keys(values) as (keyof EnvironmentState)[]) {
    gui
      .add(values, key, 0, 1, 0.01)
      .onChange((value: number) => store.getState().setEnvironment({ [key]: value }));
  }

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
