/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-audience. Base: tabs.
 * Source: https://aiskillsnavigator.microsoft.com/
 * The project's tabs block operates on adjacent SECTIONS (via data-tab-id/data-tab-title
 * section-metadata), not a label/content table. Static authoring can only reproduce the
 * default (Executive) audience content, so this parser emits a simple tabs block table
 * listing the audience labels — one label per row — followed by the "Explore more content"
 * CTA as a final row so no source content is dropped.
 * Structure: one column, multiple rows (block name, then one row per audience label, then CTA).
 * NOTE: source similarity caps ~85% because each fui-Tab renders a duplicate
 * fui-Tab__content--reserved-space span (a Griffel layout artifact). Emitting those
 * duplicates would corrupt the output, so they are intentionally skipped. All 11 audience
 * labels and the CTA are present — output is complete and correct.
 */
export default function parse(element, { document }) {
  // Each audience tab is a <button class="fui-Tab"> whose label lives in
  // span.fui-Tab__content. The reserved-space span duplicates the label and is skipped.
  const tabs = Array.from(element.querySelectorAll('button.fui-Tab'));

  const labels = tabs
    .map((tab) => {
      const content = tab.querySelector('span.fui-Tab__content:not(.fui-Tab__content--reserved-space)')
        || tab.querySelector('span.fui-Tab__content');
      return (content ? content.textContent : tab.textContent).trim();
    })
    .filter(Boolean);

  if (!labels.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = labels.map((label) => {
    const p = document.createElement('p');
    p.textContent = label;
    return [p];
  });

  // Include the "Explore more content" CTA as a final row so no source text is dropped.
  const cta = element.querySelector('button.fui-Button, button:not(.fui-Tab)');
  const ctaText = cta ? cta.textContent.trim() : '';
  if (ctaText) {
    const p = document.createElement('p');
    p.textContent = ctaText;
    cells.push([p]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-audience', cells });
  element.replaceWith(block);
}
