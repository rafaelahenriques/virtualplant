/** Finds an element the page's markup promises, or fails loudly at startup. */
export function required<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id} in index.html`);
  return element as T;
}
