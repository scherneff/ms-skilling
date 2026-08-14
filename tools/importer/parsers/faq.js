/* eslint-disable */
/* global WebImporter */
/**
 * Parser for faq. Base: faq (custom, data-driven block).
 * Source: https://aiskillsnavigator.microsoft.com/faq
 * The project's faq block is DATA-DRIVEN: its decorate() reads /faq-index.json and treats
 * each block ROW's text as a CATEGORY NAME to include. Therefore this parser emits a faq
 * block table whose rows are the accordion GROUP HEADINGS (category names) only —
 * "General Information" and "Access and profile management". The Q&A pairs are NOT emitted
 * into the block (they are supplied separately via the faq-index data source at import time).
 * Structure: one column, multiple rows (block name, then one row per category name).
 */
export default function parse(element, { document }) {
  // Category names = the heading of each accordion group.
  const headings = Array.from(
    element.querySelectorAll('.faq-group-heading, .fui-AccordionItem > h2, h2'),
  );

  const categories = headings
    .map((h) => h.textContent.trim())
    .filter(Boolean);

  if (!categories.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = categories.map((name) => {
    const p = document.createElement('p');
    p.textContent = name;
    return [p];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'faq', cells });
  element.replaceWith(block);
}
