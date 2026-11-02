import type { MusicPlayer } from '../audio/MusicPlayer';
import type { EcosystemStore } from '../store/ecosystemStore';
import type { HandTracker } from '../tracking/HandTracker';
import { describeTrackingError } from './copy';
import { required } from './element';

const MUSIC_FAILED = 'The music could not play. Check your connection, then try again.';
const IDLE_HINT = 'Grow it with your fingers, or drag Growth.';
const SEARCHING = 'Hold a hand up to the camera.';
const TRACKING_HINT = 'Spread your thumb and index finger to grow. Move your palm to scan.';
const CAMERA_LOST = 'The camera stopped. Start hand tracking to carry on.';

function renderSwitch(button: HTMLElement, name: string, on: boolean): void {
  button.dataset.on = String(on);
  button.textContent = `${name} ${on ? 'on' : 'off'}`;
}

/** The interface, animation and music switches, and the camera button with its status line. */
export function createToolbar(
  store: EcosystemStore,
  tracker: HandTracker,
  player: MusicPlayer,
): void {
  const ui = required('interface');
  const hide = required<HTMLButtonElement>('interface-toggle');
  const animation = required<HTMLButtonElement>('animation-toggle');
  const music = required<HTMLButtonElement>('music-toggle');
  const camera = required<HTMLButtonElement>('tracking-toggle');
  const status = required('tracking-status');

  const renderInterface = (visible: boolean) => {
    ui.dataset.hidden = String(!visible);
    hide.textContent = visible ? 'Hide interface' : 'Show interface';
  };

  hide.addEventListener('click', () => {
    store.getState().setInterfaceVisible(!store.getState().interfaceVisible);
  });
  animation.addEventListener('click', () => {
    store.getState().setAnimationOn(!store.getState().animationOn);
  });
  music.addEventListener('click', async () => {
    const on = !store.getState().musicOn;
    store.getState().setMusicOn(on);
    if (!on) {
      player.pause();
      return;
    }
    try {
      await player.play();
    } catch {
      // Switching it off while it loads also lands here, and isn't a failure.
      if (!store.getState().musicOn) return;
      store.getState().setMusicOn(false);
      status.textContent = MUSIC_FAILED;
    }
  });

  store.subscribe((state, previous) => {
    if (state.interfaceVisible !== previous.interfaceVisible) {
      renderInterface(state.interfaceVisible);
    }
    if (state.animationOn !== previous.animationOn) {
      renderSwitch(animation, 'Animation', state.animationOn);
    }
    if (state.musicOn !== previous.musicOn) renderSwitch(music, 'Music', state.musicOn);
  });
  const initial = store.getState();
  renderInterface(initial.interfaceVisible);
  renderSwitch(animation, 'Animation', initial.animationOn);
  renderSwitch(music, 'Music', initial.musicOn);

  let tracking = false;
  let handInView = false;

  tracker.subscribe((hands, video) => {
    if (!tracking) return;
    // The tracker stopped by itself, because the camera went away.
    if (video.width === 0) {
      tracking = false;
      camera.textContent = 'Start hand tracking';
      status.textContent = CAMERA_LOST;
      return;
    }
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
