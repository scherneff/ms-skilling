/**
 * Generic subscribable filter state. Each cards-course filter dimension
 * (audience, content type, ...) gets its own independent instance — a plain
 * DOM event would be missed by blocks that haven't loaded yet (the tabs
 * filter blocks load before the course rails further down the page), so late
 * subscribers instead get the current value immediately on subscribe.
 * @param {string|null} [defaultValue] initial selected value
 */
export function createFilterState(defaultValue = null) {
  let selected = defaultValue;
  const listeners = new Set();

  return {
    getSelected: () => selected,
    setSelected: (value) => {
      selected = value || null;
      listeners.forEach((cb) => cb(selected));
    },
    /**
     * Subscribe to changes. Invoked immediately with the current value, then
     * again on every subsequent change.
     * @param {(value: string|null) => void} callback
     * @returns {() => void} unsubscribe
     */
    onChange: (callback) => {
      listeners.add(callback);
      callback(selected);
      return () => listeners.delete(callback);
    },
  };
}
