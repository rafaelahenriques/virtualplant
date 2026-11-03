import { clamp01 } from '../core/math';

const DIRECTION_KNOWN_AFTER = 6;

/** Which way a finger is heading, once it has moved far enough to tell. */
export function swipeDirection(across: number, down: number): 'unknown' | 'across' | 'down' {
  if (Math.hypot(across, down) < DIRECTION_KNOWN_AFTER) return 'unknown';
  return Math.abs(across) >= Math.abs(down) ? 'across' : 'down';
}

/** How far along its range a slider's thumb sits, with its centre under a finger at `x`. */
export function fractionUnderFinger(
  x: number,
  { left, width }: { left: number; width: number },
  thumb: number,
): number {
  return clamp01((x - left - thumb / 2) / (width - thumb));
}

/**
 * iOS Safari only drags a slider when the finger lands right on its thumb, and most drags miss it.
 * Here a finger can start anywhere on the slider. A mouse keeps the browser's own behaviour.
 */
export function createTouchSliders(): void {
  for (const input of document.querySelectorAll<HTMLInputElement>('.scale')) {
    let finger: { id: number; startX: number; startY: number; dragging: boolean } | null = null;

    const follow = (x: number) => {
      const thumb = Number.parseFloat(getComputedStyle(input).getPropertyValue('--thumb'));
      const fraction = fractionUnderFinger(x, input.getBoundingClientRect(), thumb);
      const min = Number(input.min);
      const shown = input.value;
      // The browser snaps this to the slider's step.
      input.value = String(min + fraction * (Number(input.max) - min));
      if (input.value !== shown) input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    input.addEventListener('pointerdown', ({ pointerType, pointerId, clientX, clientY }) => {
      if (pointerType !== 'touch') return;
      finger = { id: pointerId, startX: clientX, startY: clientY, dragging: false };
      input.setPointerCapture(pointerId);
    });
    // Nothing moves until the finger heads sideways, so a swipe up or down leaves the value alone.
    input.addEventListener('pointermove', ({ pointerId, clientX, clientY }) => {
      if (pointerId !== finger?.id) return;
      if (!finger.dragging) {
        const direction = swipeDirection(clientX - finger.startX, clientY - finger.startY);
        if (direction === 'unknown') return;
        if (direction === 'down') {
          finger = null;
          return;
        }
        finger.dragging = true;
      }
      follow(clientX);
    });
    input.addEventListener('pointerup', ({ pointerId, clientX }) => {
      if (pointerId !== finger?.id) return;
      follow(clientX);
      finger = null;
    });
    input.addEventListener('pointercancel', () => {
      finger = null;
    });
  }
}
