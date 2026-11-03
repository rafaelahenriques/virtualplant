import { required } from './element';

/** On a phone, one panel at a time opens above the tabs. Tapping the tab or the plant closes it. */
export function createPhonePanels(): void {
  const ui = required('interface');
  const tabs = [...ui.querySelectorAll<HTMLButtonElement>('.phone-tabs button')];

  const open = (panel?: string) => {
    if (panel) ui.dataset.panel = panel;
    else delete ui.dataset.panel;
    for (const tab of tabs) {
      const on = tab.dataset.opens === panel;
      tab.dataset.on = String(on);
      tab.setAttribute('aria-expanded', String(on));
    }
  };

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      open(ui.dataset.panel === tab.dataset.opens ? undefined : tab.dataset.opens);
    });
  }
  required('app').addEventListener('click', () => open());
  open();
}
