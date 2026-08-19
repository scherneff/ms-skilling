import { decorateFilterPills } from '../../scripts/shared/pill-filter.js';
import { setSelectedContentType, onContentTypeChange } from '../../scripts/shared/content-type-filter.js';

/**
 * Authored content-type labels (All types, Video, Article, Module, ...) as a
 * flat pill row (same pattern as tabs-audience — see its comments for the
 * authored DOM shape). Each pill sets the shared content-type-filter state
 * that cards-course rails read to show/hide cards; "All types" clears the
 * filter so every type shows again.
 */
export default function decorate(block) {
  decorateFilterPills(
    block,
    { setSelected: setSelectedContentType, onChange: onContentTypeChange },
    (text) => /^all/i.test(text),
  );
}
