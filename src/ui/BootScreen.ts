import gsap from 'gsap';
import { BootFlower } from './BootFlower';
import { required } from './element';

// Work often finishes in a blink, so each line gets long enough on screen to be read.
const MIN_STEP_MS = 170;
const VISIBLE_LOG_LINES = 12;
const PROGRESS_EASE = 0.12;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Reports real startup work: every line is a task running, with its measured result. */
export class BootScreen {
  private readonly root = required('boot');
  private readonly percent = required('boot-percent');
  private readonly stepLabel = required('boot-step');
  private readonly log = required('boot-log');
  private readonly error = required('boot-error');
  private readonly scanline = required('boot-scanline');
  private readonly flower = new BootFlower(required<HTMLCanvasElement>('boot-flower'));
  private readonly startedAt = performance.now();
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private target = 0;
  private shown = 0;
  private completed = 0;
  private totalWeight = 1;
  private animating = true;

  constructor() {
    required('interface').dataset.booting = 'true';
    window.addEventListener('resize', this.handleResize);
    requestAnimationFrame(this.animate);
  }

  /** How much work is coming, so progress can be measured against it. */
  plan(totalWeight: number): void {
    this.totalWeight = totalWeight;
  }

  /** Runs one task, logging what it is and then what it found. */
  async step(label: string, task: () => string | Promise<string>, weight = 1): Promise<void> {
    const startedAt = performance.now();
    const row = this.addRow(label);
    this.stepLabel.textContent = label;
    // Lets the line paint before a task that might hold the main thread.
    await new Promise(requestAnimationFrame);

    const result = await task();

    const elapsed = performance.now() - startedAt;
    row.dataset.pending = 'false';
    (row.lastElementChild as HTMLElement).textContent = result;
    this.completed += weight;
    this.target = this.completed / this.totalWeight;
    if (elapsed < MIN_STEP_MS && !this.reducedMotion) await sleep(MIN_STEP_MS - elapsed);
  }

  /** A sweep from top to bottom uncovers the running page, then the interface comes up. */
  async reveal(onSweepStart: () => void): Promise<void> {
    this.target = 1;
    this.stepLabel.textContent = 'Ready';
    const ui = required('interface');

    const finish = () => {
      this.animating = false;
      window.removeEventListener('resize', this.handleResize);
      this.root.remove();
    };

    if (this.reducedMotion) {
      onSweepStart();
      delete ui.dataset.booting;
      finish();
      return;
    }

    // Lets the counter land on 100 first.
    await sleep(380);
    onSweepStart();

    const sweep = { y: 0 };
    await new Promise<void>((resolve) => {
      gsap
        .timeline({ onComplete: resolve })
        .set(this.scanline, { opacity: 1 })
        .to(sweep, {
          y: 100,
          duration: 1.15,
          ease: 'power2.inOut',
          onUpdate: () => {
            this.root.style.clipPath = `inset(${sweep.y}% 0 0 0)`;
            this.scanline.style.top = `${sweep.y}%`;
          },
        })
        .add(() => {
          delete ui.dataset.booting;
          gsap.from(ui, { opacity: 0, duration: 0.5, ease: 'power1.out' });
        }, 0.7);
    });
    finish();
  }

  /** Stops loading and says what to do. */
  fail(message: string): void {
    this.animating = false;
    this.percent.parentElement?.setAttribute('hidden', '');
    this.error.textContent = message;
    this.error.hidden = false;
  }

  private addRow(label: string): HTMLElement {
    const row = document.createElement('li');
    row.dataset.pending = 'true';
    const elapsed = (performance.now() - this.startedAt) / 1000;
    for (const text of [elapsed.toFixed(2), label, 'running']) {
      const cell = document.createElement('span');
      cell.textContent = text;
      row.append(cell);
    }
    this.log.append(row);
    while (this.log.children.length > VISIBLE_LOG_LINES) this.log.firstElementChild?.remove();
    return row;
  }

  private readonly handleResize = () => this.flower.resize();

  private readonly animate = () => {
    if (!this.animating) return;
    this.shown += (this.target - this.shown) * PROGRESS_EASE;
    if (this.target - this.shown < 0.002) this.shown = this.target;

    const value = Math.round(this.shown * 100);
    this.percent.textContent = String(value).padStart(3, '0');
    this.root.setAttribute('aria-valuenow', String(value));
    this.flower.draw(this.shown);

    requestAnimationFrame(this.animate);
  };
}
