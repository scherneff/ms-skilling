/**
 * Shared audience-filter state connecting the tabs-audience selector to any
 * number of cards-course rails on the page. A plain DOM event would be missed
 * by blocks that haven't loaded yet (tabs-audience loads before the course
 * rails further down the page), so late subscribers instead get the current
 * value immediately on subscribe.
 */

const DEFAULT_AUDIENCE = 'executive';

let selected = DEFAULT_AUDIENCE;
const listeners = new Set();

export function getSelectedAudience() {
  return selected;
}

export function setSelectedAudience(audience) {
  selected = audience || null;
  listeners.forEach((cb) => cb(selected));
}

/**
 * Subscribe to audience changes. Invoked immediately with the current value,
 * then again on every subsequent change.
 * @param {(audience: string|null) => void} callback
 * @returns {() => void} unsubscribe
 */
export function onAudienceChange(callback) {
  listeners.add(callback);
  callback(selected);
  return () => listeners.delete(callback);
}
