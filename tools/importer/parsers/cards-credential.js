/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-credential. Base: cards.
 * Source: https://aiskillsnavigator.microsoft.com/
 * Structure: 2 columns, multiple rows (block name, then one row per card).
 * Source holds 3 static cards (fui-Card), each with:
 *   - a thumbnail <img>
 *   - a content-type badge (fui-Tag: Module / Video)
 *   - an <h3> title
 * No duration/date on these cards.
 * Row layout per card: [ image cell, text cell (title heading + badge) ].
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.fui-Card'));

  if (!cards.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cards.forEach((card) => {
    const img = card.querySelector('img');
    const title = card.querySelector('h3');
    const badge = card.querySelector('.fui-Tag__primaryText');

    if (!img && !title) return;

    const textCell = [];
    if (title) {
      const h = document.createElement('h3');
      h.textContent = title.textContent.trim();
      textCell.push(h);
    }
    if (badge && badge.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = badge.textContent.trim();
      textCell.push(p);
    }

    cells.push([img || '', textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-credential', cells });
  element.replaceWith(block);
}
