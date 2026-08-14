/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-skilling. Base: hero.
 * Source: https://aiskillsnavigator.microsoft.com/
 * Structure: 1 column, 3 rows (block name, optional background image, content cell with title + subtitle).
 * Emits ONLY the h1 (fui-LargeTitle) and h2 subtitle (fui-Title1). The nested pills
 * (div.___te5d3i0) are intentionally excluded — they belong to the cards-pills block.
 */
export default function parse(element, { document }) {
  const title = element.querySelector('h1.fui-LargeTitle, h1');
  const subtitle = element.querySelector('h2.fui-Title1, h2');
  // Background image = a direct-child img of the hero container (NOT the pill icons,
  // which live inside div.___te5d3i0). :scope > img guards against selecting pills.
  const bgImage = element.querySelector(':scope > img');

  if (!title && !subtitle) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2 (optional): background image
  if (bgImage) cells.push([bgImage]);

  // Row 3: content cell (single column) — title + subtitle only
  const contentCell = [];
  if (title) contentCell.push(title);
  if (subtitle) contentCell.push(subtitle);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-skilling', cells });

  // The hero container nests the value-prop pills (div.___te5d3i0), which are a
  // separate block (cards-pills). Preserve that element by re-inserting it as a
  // sibling right after the hero block, so its parser can still find it after we
  // replace the hero container.
  const pills = element.querySelector('div.___te5d3i0');

  element.replaceWith(block);
  if (pills) block.after(pills);
}
