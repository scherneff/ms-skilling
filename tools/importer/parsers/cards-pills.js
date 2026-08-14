/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-pills. Base: cards.
 * Source: https://aiskillsnavigator.microsoft.com/
 * Structure: 2 columns, multiple rows (block name, then one row per pill).
 * Each pill = an <img> icon (fui-Image) with an alt label. The label text is taken
 * from the img alt attribute, since the source pills carry no separate text node.
 * Row layout per pill: [ image cell, text (label) cell ].
 */
export default function parse(element, { document }) {
  const pills = Array.from(element.querySelectorAll('img.fui-Image, :scope > img'));

  if (!pills.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  pills.forEach((img) => {
    const label = (img.getAttribute('alt') || '').trim();
    const textCell = [];
    if (label) {
      const p = document.createElement('p');
      p.textContent = label;
      textCell.push(p);
    }
    cells.push([img, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-pills', cells });
  element.replaceWith(block);
}
