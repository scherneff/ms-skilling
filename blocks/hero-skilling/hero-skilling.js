/** @param {Element} block The hero-skilling block element */
export default function decorate(block) {
  // Mark the content row so CSS can center the title + subtitle stack.
  const h1 = block.querySelector('h1');
  const contentDiv = h1?.closest('div');
  const textRow = contentDiv?.parentElement;
  if (textRow && textRow !== block) {
    textRow.classList.add('hero-skilling-text');
  }

  if (block.querySelector('picture, img') === null) {
    block.classList.add('no-image');
  }
}
