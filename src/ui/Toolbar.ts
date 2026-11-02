import type { EcosystemStore } from '../store/ecosystemStore';
import type { HandTracker } from '../tracking/HandTracker';
import { describeTrackingError } from './copy';
import { required } from './element';

const IDLE_HINT = 'Grow it with your fingers, or drag Growth.';
const SEARCHING = 'Hold a hand up to the camera.';
const TRACKING_HINT = 'Spread your thumb and index finger to grow. Move your palm to scan.';

/** The interface and animation switches, and the camera button with its status line. */
export function createToolbar(store: EcosystemStore, tracker: HandTracker): void {
  const ui = required('interface');
  const hide = required<HTMLButtonElement>('interface-toggle');
  const animation = required<HTMLButtonElement>('animation-toggle');
  const camera = required<HTMLButtonElement>('tracking-toggle');
  const status = required('tracking-status');

  const renderInterface = (visible: boolean) => {
    ui.dataset.hidden = String(!visible);
    hide.textContent = visible ? 'Hide interface' : 'Show interface';
  };
  hide.addEventListener('click', () => {
    store.getState().setInterfaceVisible(!store.getState().interfaceVisible);
  });
  store.subscribe((state) => renderInterface(state.interfaceVisible));
  renderInterface(store.getState().interfaceVisible);

  const renderAnimation = (on: boolean) => {
    animation.setAttribute('aria-pressed', String(on));
    animation.textContent = on ? 'Animation on' : 'Animation off';
  };
  animation.addEventListener('click', () => {
    store.getState().setAnimationOn(!store.getState().animationOn);
  });
  store.subscribe((state) => renderAnimation(state.animationOn));
  renderAnimation(store.getState().animationOn);

  let tracking = false;
  let handInView = false;

  tracker.subscribe((hands) => {
    if (!tracking) return;
    const inView = hands.length > 0;
    if (inView === handInView) return;
    handInView = inView;
    status.textContent = inView ? TRACKING_HINT : SEARCHING;
  });

  camera.addEventListener('click', async () => {
    if (tracking) {
      tracking = false;
      tracker.stop();
      camera.textContent = 'Start hand tracking';
      status.textContent = IDLE_HINT;
      return;
    }

    camera.disabled = true;
    camera.textContent = 'Starting camera';
    status.textContent = 'Loading the hand model. Your video stays on this device.';
    try {
      await tracker.start();
      tracking = true;
      handInView = false;
      camera.textContent = 'Stop hand tracking';
      status.textContent = SEARCHING;
    } catch (error) {
      tracker.stop();
      camera.textContent = 'Start hand tracking';
      status.textContent = describeTrackingError(error);
    } finally {
      camera.disabled = false;
    }
  });
}
