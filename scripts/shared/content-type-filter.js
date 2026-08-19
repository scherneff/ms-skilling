/**
 * Shared content-type-filter state connecting the tabs-content-type selector
 * to any number of cards-course rails on the page. Unlike audience (which
 * defaults to "Executive"), there's no single "primary" content type, so this
 * defaults to no selection — i.e. show every type until the author picks one.
 */

import { createFilterState } from './filter-state.js';

const state = createFilterState(null);

export const getSelectedContentType = state.getSelected;
export const setSelectedContentType = state.setSelected;
export const onContentTypeChange = state.onChange;
