import type { Hand, HandPose } from 'ml5';

/** Owns the webcam and ml5 HandPose. ml5 is about 4 MB, so it only loads on the first start. */
export class HandTracker {
  private model?: HandPose;
  private stream?: MediaStream;

  async start(onHands: (hands: Hand[]) => void): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
    });

    const video = document.createElement('video');
    video.srcObject = this.stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();

    const { default: ml5 } = await import('ml5');
    this.model ??= await ml5.handPose({ maxHands: 2, flipped: true });
    this.model.detectStart(video, onHands);
  }

  stop(): void {
    this.model?.detectStop();
    this.stream?.getTracks().forEach((track) => track.stop());
  }
}
