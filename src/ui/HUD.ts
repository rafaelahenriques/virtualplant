import type { Hand } from 'ml5';
import type { Point, Size } from '../core/math';
import type { ScanRect } from '../core/ScanWindow';
import { recognizePinch } from '../tracking/GestureRecognizer';
import { videoToViewport } from '../tracking/videoSpace';

const INK = '#f2f5f0';
const FONT = '10px ui-monospace, Menlo, monospace';
const CROSSHAIR_SIZE = 7;
const BOX_PADDING = 18;
const LABEL_INSET = 8;

/** Tracking overlay, drawn as if the mirrored camera image filled the screen. */
export class HUD {
  private readonly canvas = document.createElement('canvas');
  private readonly context: CanvasRenderingContext2D;
  private hands: Hand[] = [];
  private video: Size = { width: 0, height: 0 };

  constructor(container: HTMLElement) {
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('2D canvas is not available');
    this.context = context;
    this.canvas.className = 'hud';
    container.appendChild(this.canvas);
  }

  setHands(hands: Hand[], video: Size): void {
    this.hands = hands;
    this.video = video;
  }

  draw(scan: ScanRect, stage: string): void {
    this.prepareCanvas();
    this.drawScanFrame(scan, stage);

    const hand = this.hands[0];
    if (!hand) return;

    const viewport = { width: this.canvas.clientWidth, height: this.canvas.clientHeight };
    const toScreen = (point: Point) => videoToViewport(point, this.video, viewport);
    this.drawHandBox(hand, toScreen);
    this.drawPinch(hand, toScreen(hand.thumb_tip), toScreen(hand.index_finger_tip));
  }

  private prepareCanvas(): void {
    const { canvas, context } = this;
    const pixelRatio = window.devicePixelRatio;
    const width = canvas.clientWidth * pixelRatio;
    const height = canvas.clientHeight * pixelRatio;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    context.strokeStyle = INK;
    context.fillStyle = INK;
    context.font = FONT;
    context.lineWidth = 1;
  }

  private drawScanFrame({ x, y, size }: ScanRect, stage: string): void {
    const { context } = this;
    const right = x + size;
    const bottom = y + size;

    // The half pixel keeps 1px lines crisp.
    context.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    for (const cornerX of [x, right]) {
      for (const cornerY of [y, bottom]) this.drawCrosshair({ x: cornerX, y: cornerY });
    }

    context.textAlign = 'left';
    context.fillText(`object.${stage}`, x + LABEL_INSET, y + LABEL_INSET + 8);
    context.textAlign = 'right';
    context.fillText('not.xray', right - LABEL_INSET, bottom - LABEL_INSET);
    context.fillText(`${x.toFixed(2)},${y.toFixed(2)}`, right, y - LABEL_INSET);
    context.textAlign = 'left';
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
