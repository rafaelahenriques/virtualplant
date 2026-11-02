import type { Hand, HandPose } from 'ml5';
import type { Size } from '../core/math';

export type HandsListener = (hands: Hand[], video: Size) => void;

/** Owns the webcam and ml5 HandPose. ml5 is about 4 MB, so it only loads on the first start. */
export class HandTracker {
  private readonly listeners = new Set<HandsListener>();
  private model?: HandPose;
  private stream?: MediaStream;
  private running = false;

  subscribe(listener: HandsListener): void {
    this.listeners.add(listener);
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
    });

    const video = document.createElement('video');
    video.srcObject = this.stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
    // The model reads the element's size, which stays 0 on a video created from code, and
    // then silently finds no hands.
    video.width = video.videoWidth;
    video.height = video.videoHeight;

    const { default: ml5 } = await import('ml5');
    this.model ??= await ml5.handPose({ maxHands: 1, flipped: true });

    this.running = true;
    this.model.detectStart(video, (hands) => {
      // detectStop lets a detection already in progress finish.
      if (this.running) this.emit(hands, { width: video.videoWidth, height: video.videoHeight });
    });
  }

  stop(): void {
    this.running = false;
    this.model?.detectStop();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.emit([], { width: 0, height: 0 });
  }

  private emit(hands: Hand[], video: Size): void {
    for (const listener of this.listeners) listener(hands, video);
  }
}
