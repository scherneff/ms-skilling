/** @param {Element} block The hero-skilling block element */
export default function decorate(block) {
  // Mark the content row so CSS can center the title + subtitle stack.
  const h1 = block.querySelector('h1');
  const contentDiv = h1?.closest('div');
  const textRow = contentDiv?.parentElement;
  if (textRow && textRow !== block) {
    textRow.classList.add('hero-skilling-text');
  }

  // An authored picture becomes the swirl banner background. It's promoted to
  // the shared section (not just this block) so it also shows behind any
  // block that follows the hero within the same section, e.g. cards-pills.
  const picture = block.querySelector('picture');
  const section = block.closest('.section');
  if (picture && section) {
    const img = picture.querySelector('img');
    if (img) {
      img.alt = '';
      img.loading = 'eager';
      img.fetchPriority = 'high';
    }
    // Walk up removing now-empty wrapper divs left behind by the row/column
    // the picture was authored in (e.g. row > column > picture).
    let node = picture.parentElement;
    picture.classList.add('hero-skilling-bg');
    section.prepend(picture);
    while (node && node !== block && !node.textContent.trim() && !node.querySelector('img, picture')) {
      const { parentElement } = node;
      node.remove();
      node = parentElement;
    }
  } else {
    block.classList.add('no-image');
  }
}
