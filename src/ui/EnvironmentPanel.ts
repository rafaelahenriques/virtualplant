import { CLIMATE_FACTORS, FACTOR_KEYS, type ClimateFactor } from '../ecosystem/Environment';
import { CLIMATE_PRESETS } from '../ecosystem/presets';
import type { Tolerance } from '../ecosystem/Suitability';
import type { EcosystemStore } from '../store/ecosystemStore';
import { describeFactor, formatReadout } from './copy';
import { required } from './element';

const CUSTOM = '';

interface FactorRow {
  row: HTMLElement;
  input: HTMLInputElement;
  value: HTMLElement;
  track: HTMLElement;
  note: HTMLElement;
}

/** The climate sliders, each drawn over the current plant's limits and best range. */
export function createEnvironmentPanel(store: EcosystemStore): void {
  const place = required<HTMLSelectElement>('place');
  const list = required('climate-factors');

  place.append(new Option('Custom climate', CUSTOM));
  for (const preset of CLIMATE_PRESETS) place.append(new Option(preset.name, preset.name));
  place.addEventListener('change', () => {
    const preset = CLIMATE_PRESETS.find((candidate) => candidate.name === place.value);
    if (preset) store.getState().setEnvironment(preset.environment);
  });

  const rows = new Map<ClimateFactor, FactorRow>();
  for (const key of FACTOR_KEYS) {
    const row = createRow(key);
    row.input.addEventListener('input', () => {
      store.getState().adjustEnvironment({ [key]: Number(row.input.value) });
      place.value = CUSTOM;
    });
    rows.set(key, row);
    list.append(row.row);
  }

  const render = () => {
    const { environment, ranking } = store.getState();
    const best = ranking[0];
    if (!best) return;

    for (const key of FACTOR_KEYS) {
      const { row, input, value, track, note } = rows.get(key) as FactorRow;
      input.value = String(environment[key]);
      const readout = formatReadout(key, environment[key]);
      value.textContent = readout;
      input.setAttribute('aria-valuetext', readout);
      note.textContent = describeFactor(key, best, environment);
      row.dataset.limiting = String(
        best.factors[key] === 0 || (best.limitingFactor === key && best.score < 0.995),
      );
      paintTolerance(track, key, best.species.niche[key]);
    }
  };

  store.subscribe((state, previous) => {
    if (state.environment !== previous.environment) render();
  });
  render();
}

function createRow(key: ClimateFactor): FactorRow {
  const { label, min, max, step } = CLIMATE_FACTORS[key];

  const row = document.createElement('div');
  row.className = 'factor';

  const head = document.createElement('div');
  head.className = 'factor-head';
  const name = document.createElement('label');
  name.htmlFor = `factor-${key}`;
  name.textContent = label;
  const value = document.createElement('span');
  value.className = 'factor-value';
  head.append(name, value);

  const track = document.createElement('div');
  track.className = 'factor-track';
  const input = document.createElement('input');
  input.id = `factor-${key}`;
  input.className = 'scale';
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  track.append(input);

  const note = document.createElement('p');
  note.className = 'factor-note';

  row.append(head, track, note);
  return { row, input, value, track, note };
}

function paintTolerance(track: HTMLElement, key: ClimateFactor, tolerance: Tolerance): void {
  const { min, max } = CLIMATE_FACTORS[key];
  const percent = (value: number) => ((value - min) / (max - min)) * 100;
  const { style } = track;
  style.setProperty('--limit-start', `${percent(tolerance.min)}%`);
  style.setProperty('--limit-width', `${percent(tolerance.max) - percent(tolerance.min)}%`);
  style.setProperty('--best-start', `${percent(tolerance.optMin)}%`);
  style.setProperty('--best-width', `${percent(tolerance.optMax) - percent(tolerance.optMin)}%`);
}
