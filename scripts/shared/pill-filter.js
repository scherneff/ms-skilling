import { toClassName } from '../aem.js';

/**
 * Decorate a flat pill row (each `.tabs-*` block's authored `<div><div><p>
 * Label</p></div></div>` rows) as clickable, keyboard-accessible filter pills
 * wired to a shared filter-state module (see scripts/shared/filter-state.js).
 * Shared by tabs-audience and tabs-content-type so both filters get the same
 * click/keyboard/active-state behavior instead of duplicating it per block.
 * @param {Element} block the tabs-* block root
 * @param {{ setSelected: (id: string|null) => void, onChange: Function }} filterApi
 * @param {(label: string) => boolean} [isClearAll] identifies the "show
 *   everything" pill (e.g. "Explore more content", "All types"); such a pill
 *   sets the filter to null instead of its own label. Defaults to none.
 */
export function decorateFilterPills(block, { setSelected, onChange }, isClearAll = () => false) {
  const pills = [];

  [...block.children].forEach((row) => {
    const cell = row.firstElementChild;
    const label = cell?.querySelector('p');
    if (!cell || !label) return;

    const text = label.textContent.trim();
    const clearAll = isClearAll(text);
    const id = clearAll ? null : toClassName(text);

    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-pressed', 'false');

    const activate = () => setSelected(id);
    cell.addEventListener('click', activate);
    cell.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        activate();
      }
    });

    pills.push({ cell, id, clearAll });
  });

  onChange((selected) => {
    pills.forEach(({ cell, id, clearAll }) => {
      const isActive = clearAll ? selected === null : selected === id;
      cell.classList.toggle('is-active', isActive);
      cell.setAttribute('aria-pressed', String(isActive));
    });
  });
}
