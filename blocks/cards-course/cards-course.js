import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';
import {
  createTag,
  fetchQueryIndexAll,
  getAuthoredLinks,
  normalizePath,
  resolveArticlesFromIndex,
  isUE,
} from '../../scripts/shared.js';
import { onAudienceChange } from '../../scripts/shared/audience-filter.js';
import { openModal } from '../modal/modal.js';

const AUDIENCE_LABEL_RE = /^audience:/i;
const YOUTUBE_LINK_SELECTOR = 'a[href*="youtube.com"], a[href*="youtu.be"]';
// Any other http(s) link in the image column is treated as a blog/article URL
// to preview (see buildBlogPreview).
const IMAGE_COLUMN_SELECTOR = 'picture, a[href^="http"]';

// TODO: update after deploying workers/link_preview (see its README):
// npm run deploy:link-preview, then paste the printed *.workers.dev URL here.
const LINK_PREVIEW_ENDPOINT = '';

/**
 * @param {string} href
 * @returns {string|null} the YouTube video ID, or null if not parseable
 */
function getYoutubeId(href) {
  try {
    const url = new URL(href);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1) || null;
    if (url.hostname.includes('youtube.com')) return url.searchParams.get('v');
  } catch {
    // ignore
  }
  return null;
}

/**
 * Authors can drop a YouTube URL in the image column instead of a picture.
 * Replace it with a lightweight thumbnail + play button (an eager iframe per
 * card would be heavy for a rail with several video cards); clicking it opens
 * the video full-size in the shared modal dialog rather than inline.
 * @param {Element} imageDiv the .cards-course-card-image column
 * @param {string} title card title, used for the player/button labels
 */
function buildVideoThumb(imageDiv, title) {
  const link = imageDiv.querySelector(YOUTUBE_LINK_SELECTOR);
  if (!link) return;

  const videoId = getYoutubeId(link.href);
  if (!videoId) return;

  imageDiv.classList.add('cards-course-card-video');

  // maxresdefault is the only YouTube thumbnail rendition that's actually
  // 16:9 — the rest (hqdefault, etc.) are 4:3 with black letterboxing baked
  // into the image. Not every video has a maxresdefault though: YouTube
  // serves a 120x90 grey placeholder (HTTP 200, not a real 404) instead of
  // erroring, so detect that and fall back to the letterboxed hqdefault,
  // cropping the bars out with a scale (only in that fallback case, so the
  // common 16:9 case isn't unnecessarily zoomed).
  const thumb = createTag('img', {
    src: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    alt: '',
    loading: 'lazy',
  });
  thumb.addEventListener('load', () => {
    if (thumb.naturalWidth <= 120) {
      imageDiv.classList.add('cards-course-card-video-letterboxed');
      thumb.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
  }, { once: true });

  imageDiv.replaceChildren(
    thumb,
    createTag('button', {
      type: 'button',
      class: 'cards-course-card-play',
      'aria-label': title ? `Play video: ${title}` : 'Play video',
    }),
  );

  imageDiv.querySelector('.cards-course-card-play').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const iframe = createTag('iframe', {
      src: `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`,
      title: title ? `${title} — video` : 'YouTube video player',
      allow: 'autoplay; encrypted-media; picture-in-picture',
      allowfullscreen: '',
    });
    openModal(createTag('div', { class: 'modal-video-frame' }, iframe), { video: true });
  });
}

/**
 * Authors can drop a blog/article URL in the image column instead of a
 * picture. Unlike YouTube, there's no predictable image URL to compute from
 * the link alone — the preview image only exists as an og:image meta tag
 * inside that page's own HTML, which requires a server-side fetch (the
 * workers/link_preview worker) since the browser can't read cross-origin
 * HTML itself. The link (and its href) is left in place so the existing
 * card-link wrapping below still makes the whole card open the article.
 * @param {Element} imageDiv the .cards-course-card-image column
 * @param {Element} link the authored <a href> for the article
 */
function buildBlogPreview(imageDiv, link) {
  if (!LINK_PREVIEW_ENDPOINT) return;

  imageDiv.classList.add('cards-course-card-blog');
  const img = createTag('img', { alt: '', loading: 'lazy' });
  link.replaceChildren(img);

  const load = () => {
    fetch(`${LINK_PREVIEW_ENDPOINT}?url=${encodeURIComponent(link.href)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.image) img.src = data.image;
        else imageDiv.classList.add('cards-course-card-blog-empty');
      })
      .catch(() => imageDiv.classList.add('cards-course-card-blog-empty'));
  };

  // Defer the fetch until the card is about to be seen — a rail can hold
  // several of these, and each one is a network round trip to our worker.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      load();
    }, { rootMargin: '200px' });
    observer.observe(imageDiv);
  } else {
    load();
  }
}

/**
 * Authors tag a card for filtering with a trailing paragraph like
 * "Audience: Executive, IT professional". Extract it into a data attribute
 * for filtering and remove it from the visible card.
 * @param {Element} li card list item
 */
function extractAudienceTags(li) {
  const tagP = [...li.querySelectorAll('p')].find((p) => AUDIENCE_LABEL_RE.test(p.textContent.trim()));
  if (!tagP) return;

  const audiences = tagP.textContent
    .replace(AUDIENCE_LABEL_RE, '')
    .split(',')
    .map((s) => toClassName(s.trim()))
    .filter(Boolean);
  if (audiences.length) li.dataset.audiences = audiences.join(',');
  tagP.remove();
}

/**
 * Show/hide cards based on the shared audience-filter selection. Cards with
 * no authored audience tags are always shown. If a selection would hide every
 * card in this rail, show them all instead rather than leaving an empty rail.
 * @param {Element} block cards-course block
 */
function setupAudienceFiltering(block) {
  const cards = [...block.querySelectorAll('li')].filter((li) => li.dataset.audiences);
  if (!cards.length) return;

  onAudienceChange((selected) => {
    const matches = (li) => !selected || li.dataset.audiences.split(',').includes(selected);
    const anyMatch = cards.some(matches);
    cards.forEach((li) => {
      li.classList.toggle('cards-course-card-hidden', anyMatch && !matches(li));
    });
  });
}

function buildLinksCard(article) {
  const href = normalizePath(article.path);
  const li = createTag('li');
  const link = createTag('a', { href, class: 'cards-course-card-link' });

  if (article.image) {
    const imageDiv = createTag('div', { class: 'cards-course-card-image' });
    imageDiv.append(createOptimizedPicture(article.image, article.title || '', false, [{ width: '750' }]));
    link.append(imageDiv);
  }

  const body = createTag('div', { class: 'cards-course-card-body' });
  body.append(createTag('p', {}, createTag('strong', {}, article.title || href)));
  if (article.description) {
    body.append(createTag('p', {}, article.description));
  }
  link.append(body);
  li.append(link);

  return li;
}

/**
 * Decorate "cards links" variant: fetch index, match paths, render cards.
 */
async function decorateLinks(block) {
  const authoredLinks = getAuthoredLinks(block);
  if (!authoredLinks.length) {
    block.textContent = '';
    block.append(createTag('p', { class: 'cards-course-links-empty' }, 'No links provided.'));
    return;
  }

  let indexRows = [];
  try {
    indexRows = await fetchQueryIndexAll();
  } catch {
    indexRows = [];
  }

  const articles = resolveArticlesFromIndex(authoredLinks, indexRows);

  const ul = createTag('ul');
  articles.forEach((article) => ul.append(buildLinksCard(article)));
  block.replaceChildren(ul);
}

/**
 * Decorate bento-grid cards variant.
 * Each authored row becomes a card. The first <p> in each card is treated
 * as a tag/label (e.g. "// Knowledge Base v1.0"), and the first card is
 * marked as the featured (primary) card.
 */
function decorateBento(block) {
  const ul = createTag('ul');

  [...block.children].forEach((row, idx) => {
    const li = createTag('li');
    if (idx === 0) li.classList.add('cards-course-card-featured');
    while (row.firstElementChild) li.append(row.firstElementChild);

    // Unwrap the single wrapper div if present
    const wrapper = li.firstElementChild;
    if (wrapper && wrapper.tagName === 'DIV' && li.children.length === 1) {
      while (wrapper.firstChild) li.append(wrapper.firstChild);
      wrapper.remove();
    }

    // Separate image into its own wrapper (consistent with default cards)
    const picture = li.querySelector('picture');
    if (picture) {
      const imageDiv = createTag('div', { class: 'cards-course-card-image' });
      const pictureParent = picture.parentElement;
      imageDiv.append(picture);
      li.prepend(imageDiv);
      if (pictureParent && pictureParent.tagName === 'A' && !pictureParent.children.length) {
        pictureParent.remove();
      }
    } else {
      li.classList.add('cards-course-card-text-only');
    }

    // Find and mark the tag/label (first <p> that looks like a category tag)
    const firstP = li.querySelector('p');
    if (firstP && !firstP.querySelector('picture') && !firstP.classList.contains('button-container')) {
      firstP.classList.add('cards-course-card-tag');
    }

    // Wrap remaining non-image content in a body div
    const body = createTag('div', { class: 'cards-course-card-body' });
    [...li.children].forEach((child) => {
      if (!child.classList.contains('cards-course-card-image')) body.append(child);
    });
    li.append(body);

    ul.append(li);
  });

  block.replaceChildren(ul);
}

/**
 * Decorate regular cards (authored rows with image + body).
 */
function decorateDefault(block) {
  const ul = createTag('ul');

  [...block.children].forEach((row) => {
    const li = createTag('li');
    while (row.firstElementChild) li.append(row.firstElementChild);

    const content = li.firstElementChild;
    if (content?.children?.length > 1) {
      const imageEl = [...content.children]
        .find((el) => el.querySelector(IMAGE_COLUMN_SELECTOR));
      if (imageEl) {
        const picture = imageEl.querySelector('picture');
        const imageDiv = createTag('div', { class: 'cards-course-card-image' });
        if (picture) imageDiv.append(picture);
        else imageDiv.append(...imageEl.childNodes);
        const bodyDiv = createTag('div', { class: 'cards-course-card-body' });
        [...content.children].forEach((el) => { if (el !== imageEl) bodyDiv.append(el); });
        li.replaceChildren(imageDiv, bodyDiv);
      } else {
        content.className = 'cards-course-card-body';
      }
    } else {
      [...li.children].forEach((div) => {
        div.className = (div.children.length === 1 && div.querySelector(IMAGE_COLUMN_SELECTOR))
          ? 'cards-course-card-image' : 'cards-course-card-body';
      });
    }

    extractAudienceTags(li);

    if (!isUE()) {
      const imageDiv = li.querySelector('.cards-course-card-image');
      const imageLink = imageDiv?.querySelector('a[href]');
      if (imageLink && getYoutubeId(imageLink.href)) {
        buildVideoThumb(imageDiv, li.querySelector('h3')?.textContent.trim());
      } else if (imageLink) {
        buildBlogPreview(imageDiv, imageLink);
      }
    }

    const linkEl = li.querySelector('.cards-course-card-image a[href]') || li.querySelector('.cards-course-card-body a[href]');
    if (linkEl) {
      if (isUE()) {
        // In UE: use a <div> wrapper so the authored <a> (with its href) is preserved
        const wrapper = createTag('div', { class: 'cards-course-card-link' });
        while (li.firstChild) wrapper.append(li.firstChild);
        li.append(wrapper);
        //Remove the button class from the link and button-container class from the parent
        const parent = linkEl.parentElement;
        if (parent) {
          parent.classList.remove('button-container');
        }
        linkEl.classList.remove('button');
       } else {
        const wrapper = createTag('a', {
          href: linkEl.getAttribute('href'),
          title: linkEl.getAttribute('title')?.trim() || undefined,
          class: 'cards-course-card-link',
        });
        while (li.firstChild) wrapper.append(li.firstChild);
        li.append(wrapper);
        linkEl.replaceWith(...linkEl.childNodes);
        li.querySelectorAll('.cards-course-card-body a[href]').forEach((a) => a.replaceWith(...a.childNodes));
      }
    }

    const article = createTag('article');
    while (li.firstChild) article.append(li.firstChild);
    li.append(article);

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const picture = img.closest('picture');
    if (picture) {
      picture.replaceWith(createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]));
    }
  });

  block.replaceChildren(ul);
}

export default async function decorate(block) {
  if (block.classList.contains('links')) {
    await decorateLinks(block);
  } else if (block.classList.contains('bento')) {
    decorateBento(block);
  } else {
    decorateDefault(block);
  }
  setupAudienceFiltering(block);
}
