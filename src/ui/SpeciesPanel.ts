import type { EcosystemStore } from '../store/ecosystemStore';
import { describeMatch, describeOthers } from './copy';
import { required } from './element';

/** Names the plant closest to this climate, and says how well it fits. */
export function createSpeciesPanel(store: EcosystemStore): void {
  const name = required('species-name');
  const latin = required('species-latin');
  const note = required('species-note');
  const match = required('species-match');
  const others = required('species-others');
  const sources = required('species-sources');

  let shownSources = '';

  const render = () => {
    const { ranking, environment } = store.getState();
    const best = ranking[0];
    if (!best) return;

    const { commonName, scientificName, habitat, height, flower } = best.species;
    name.textContent = commonName;
    latin.textContent = scientificName;
    note.textContent = `${habitat}. ${height}. ${flower}.`;
    match.textContent = describeMatch(best, environment);
    others.textContent = describeOthers(ranking);

    if (shownSources !== best.species.id) {
      shownSources = best.species.id;
      sources.replaceChildren(
        ...best.species.sources.map(({ label, url }) => {
          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.rel = 'noreferrer';
          link.textContent = label;
          const item = document.createElement('li');
          item.append(link);
          return item;
        }),
      );
    }
  };

  store.subscribe((state, previous) => {
    if (state.environment !== previous.environment) render();
  });
  render();
}
