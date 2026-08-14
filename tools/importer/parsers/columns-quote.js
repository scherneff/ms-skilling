/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-quote. Base: columns.
 * Source: https://aiskillsnavigator.microsoft.com/
 * Structure: multiple columns; first row is the block name, second row holds the columns.
 * Source has an h2 quote (#skilling-playlist-heading) on the left and an illustration
 * <img> (alt "Skilling Playlist Frame") on the right.
 * Layout: a single content row with two cells — [ quote cell, image cell ].
 */
export default function parse(element, { document }) {
  const quote = element.querySelector('#skilling-playlist-heading, h2.fui-Title2, h2');
  const image = element.querySelector('img.fui-Image, :scope > img, img');

  if (!quote && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const quoteCell = quote ? [quote] : [''];
  const imageCell = image ? [image] : [''];

  const cells = [[quoteCell, imageCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-quote', cells });
  element.replaceWith(block);
}
