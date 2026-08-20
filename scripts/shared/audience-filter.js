/**
 * Shared audience-filter state connecting the tabs-audience selector to any
 * number of cards-course rails on the page.
 */

import { createFilterState } from './filter-state.js';

const state = createFilterState(null);

export const getSelectedAudience = state.getSelected;
export const setSelectedAudience = state.setSelected;
export const onAudienceChange = state.onChange;
