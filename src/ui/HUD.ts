import type { Hand } from 'ml5';
import { recognizePinch } from '../tracking/GestureRecognizer';
import type { VideoSize } from '../tracking/HandTracker';

const INK = '#f2f5f0';
const FONT = '10px ui-monospace, Menlo, monospace';
const CROSSHAIR_SIZE = 7;
const BOX_PADDING = 18;

interface Point {
  x: number;
  y: number;
}

/** Tracking overlay, drawn as if the mirrored camera image filled the screen. */
export class HUD {
  private readonly canvas = document.createElement('canvas');
  private readonly context: CanvasRenderingContext2D;

  constructor(container: HTMLElement) {
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('2D canvas is not available');
    this.context = context;
    this.canvas.className = 'hud';
    container.appendChild(this.canvas);
  }

  draw(hands: Hand[], video: VideoSize): void {
    const { canvas, context } = this;
    const { clientWidth: width, clientHeight: height } = canvas;
    const pixelRatio = window.devicePixelRatio;

    // Resizing also clears the canvas and resets its state.
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;

    const hand = hands[0];
    if (!hand) return;

    context.scale(pixelRatio, pixelRatio);
    context.strokeStyle = INK;
    context.fillStyle = INK;
    context.font = FONT;
    context.lineWidth = 1;

    const scale = Math.max(width / video.width, height / video.height);
    const toScreen = ({ x, y }: Point): Point => ({
      x: width / 2 + (x - video.width / 2) * scale,
      y: height / 2 + (y - video.height / 2) * scale,
    });

    this.drawHandBox(hand, toScreen);
    this.drawPinch(hand, toScreen(hand.thumb_tip), toScreen(hand.index_finger_tip));
  }

  private drawHandBox(hand: Hand, toScreen: (point: Point) => Point): void {
    const points = hand.keypoints.map(toScreen);
    const left = Math.min(...points.map((point) => point.x)) - BOX_PADDING;
    const top = Math.min(...points.map((point) => point.y)) - BOX_PADDING;
    const right = Math.max(...points.map((point) => point.x)) + BOX_PADDING;
    const bottom = Math.max(...points.map((point) => point.y)) + BOX_PADDING;

    this.context.strokeRect(left, top, right - left, bottom - top);
    this.context.fillText(`hand.${hand.confidence.toFixed(2)}`, left + 6, top + 14);
  }

  private drawPinch(hand: Hand, thumb: Point, index: Point): void {
    const { context } = this;
    const pinch = recognizePinch(hand);
    const center = { x: (thumb.x + index.x) / 2, y: (thumb.y + index.y) / 2 };
    const radius = Math.hypot(index.x - thumb.x, index.y - thumb.y) / 2;

    context.beginPath();
    context.moveTo(thumb.x, thumb.y);
    context.lineTo(index.x, index.y);
    context.moveTo(center.x + radius, center.y);
    context.arc(center.x, center.y, radius, 0, Math.PI * 2);
    context.stroke();

    this.drawCrosshair(thumb);
    this.drawCrosshair(index);

    context.fillText(`pinch ${pinch.ratio.toFixed(2)}`, center.x + radius + 10, center.y - 3);
    context.fillText(`grow ${pinch.openness.toFixed(2)}`, center.x + radius + 10, center.y + 10);
  }

  private drawCrosshair({ x, y }: Point): void {
    const { context } = this;
    context.beginPath();
    context.moveTo(x - CROSSHAIR_SIZE, y);
    context.lineTo(x + CROSSHAIR_SIZE, y);
    context.moveTo(x, y - CROSSHAIR_SIZE);
    context.lineTo(x, y + CROSSHAIR_SIZE);
    context.stroke();
  }
}
