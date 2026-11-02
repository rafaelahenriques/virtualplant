import gsap from 'gsap';

const VOLUME = 0.6;
const FADE_SECONDS = 1.2;

/** Plays one looping track, fading in and out. Nothing downloads until it first plays. */
export class MusicPlayer {
  private readonly audio = new Audio();
  private wanted = false;

  constructor(url: string) {
    this.audio.preload = 'none';
    this.audio.loop = true;
    this.audio.volume = 0;
    this.audio.src = url;
  }

  /** Browsers only allow this after a click. Rejects if the track can't play. */
  async play(): Promise<void> {
    this.wanted = true;
    gsap.killTweensOf(this.audio);
    await this.audio.play();
    // It may have been switched off again while the track was loading.
    if (this.wanted) gsap.to(this.audio, { volume: VOLUME, duration: FADE_SECONDS });
    else this.audio.pause();
  }

  pause(): void {
    this.wanted = false;
    gsap.killTweensOf(this.audio);
    gsap.to(this.audio, {
      volume: 0,
      duration: FADE_SECONDS,
      onComplete: () => this.audio.pause(),
    });
  }
}
