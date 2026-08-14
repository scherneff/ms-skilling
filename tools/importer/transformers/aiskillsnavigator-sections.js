/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: AI Skills Navigator section breaks.
 *
 * Homepage template (page-templates.json) defines 5 sections; all have
 * style === null, so NO Section Metadata blocks are emitted — this transformer
 * only inserts section-break <hr> elements (one before each section except the
 * first). Expected <hr> count = sections.length - 1 = 4.
 *
 * Boundary selectors are taken from payload.template.sections, verified against
 * migration-work/cleaned.html, with ONE documented adaptation:
 *
 *   - section-2 "Catalog intro and audience selector" and section-3 "Course
 *     carousels" both carry the SAME template selector `div.___8n1h8p0`
 *     (verified: single element at line 38 that nests BOTH the fui-TabList and
 *     the carousels). Anchoring both breaks to that one node would stack two
 *     <hr>s and merge the sections. The DOM-correct boundary for the carousels
 *     region is the first carousels wrapper `div.___1ez85d2` (line 93, inside
 *     section.___q7v2ri0, immediately after the fui-TabList). section-3 is
 *     therefore overridden to that selector via SECTION_SELECTOR_OVERRIDES.
 *
 * Breaks are inserted in beforeTransform (per the reference implementation)
 * while every section element still exists — block parsers run between the
 * hooks and replace some section elements (e.g. columns-quote replaces the
 * section-7 element `div.___xl246q0:has(#skilling-playlist-heading)`). A bare
 * <hr> inserted as a sibling before such an element survives that replacement,
 * and since no section has a style there is no metadata to anchor in
 * afterTransform (the afterTransform loop is a guarded no-op here, kept to
 * match the canonical pattern and stay correct if styles are added later).
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

// Per-section boundary overrides (section.id -> selector). See file header.
const SECTION_SELECTOR_OVERRIDES = {
  'section-3': 'div.___1ez85d2',
};

function resolveSelector(section) {
  if (SECTION_SELECTOR_OVERRIDES[section.id]) {
    return SECTION_SELECTOR_OVERRIDES[section.id];
  }
  // page-templates.json stores selector as an array; normalize to a string.
  if (Array.isArray(section.selector)) return section.selector.join(', ');
  return section.selector;
}

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break
      const selector = resolveSelector(section);
      if (!selector) continue;
      const sectionEl = element.querySelector(selector);
      if (!sectionEl) continue; // selector didn't match on this page — skip, never guess

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // No section carries a style, so this loop inserts no Section Metadata
    // blocks. Kept per the reference pattern; remains correct if a section is
    // later given a style.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || element.querySelector(resolveSelector(section));
      if (!anchor) continue;

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove();
      }
    }
  }
}
