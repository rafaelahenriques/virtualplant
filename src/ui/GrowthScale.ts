import { describeGrowth, GROWTH_STAGES } from '../plants/GrowthSystem';
import type { EcosystemStore } from '../store/ecosystemStore';
import { required } from './element';

/** The growth slider, which also moves when a pinch changes the growth. */
export function createGrowthScale(store: EcosystemStore): void {
  const input = required<HTMLInputElement>('growth');
  const stages = required('growth-stages');

  const items = GROWTH_STAGES.map((stage) => {
    const item = document.createElement('li');
    item.textContent = stage;
    stages.append(item);
    return item;
  });

  input.addEventListener('input', () => {
    store.getState().setGrowthTarget(Number(input.value));
  });

  let shown = -1;
  const render = (growth: number) => {
    if (growth === shown) return;
    shown = growth;
    input.value = String(growth);
    const stage = describeGrowth(growth);
    input.setAttribute('aria-valuetext', stage);
    items.forEach((item) => {
      if (item.textContent === stage) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
  };

  store.subscribe((state) => render(state.growthTarget));
  render(store.getState().growthTarget);
}
