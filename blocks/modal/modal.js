/*
 * Modal Block – shared dialog shell. Opens fragment links instead of
 * navigating, and exposes openModal() so other blocks (e.g. cards-course's
 * video play button) can pop arbitrary content into the same dialog.
 */

import { loadFragment } from '../fragment/fragment.js';
import { loadCSS } from '../../scripts/aem.js';
import { createTag, getBlockContext } from '../../scripts/shared.js';
import dynamicBlocks from '../dynamic/index.js';

const FRAGMENT_PREFIX = '/fragments/';

let modalApi = null;

function getFragmentPath(href = '') {
  try {
    const url = new URL(href, window.location.origin);
    if (!url.pathname.startsWith(FRAGMENT_PREFIX)) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

/**
 * Builds the dialog shell (backdrop, close button, ESC/click-outside-to-close,
 * focus restore) once and returns its control functions.
 * @param {Element} el element used to resolve the correct document/shadow root
 */
function createModal(el) {
  const { eventRoot } = getBlockContext(el);

  loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);

  const closeBtn = createTag('button', { type: 'button', class: 'modal-close', 'aria-label': 'Close dialog' }, '×');
  const content = createTag('div', { class: 'modal-content' });
  const dialog = createTag('div', {
    class: 'modal-dialog',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Dialog',
  }, [closeBtn, content]);
  const backdrop = createTag('div', { class: 'modal-backdrop', 'aria-hidden': 'true' });
  const modalRoot = createTag('div', { class: 'modal', hidden: 'true' }, [backdrop, dialog]);
  document.body.append(modalRoot);
  let previousOverflow = '';
  let previousFocus = null;

  const close = () => {
    modalRoot.hidden = true;
    dialog.classList.remove('modal-dialog-video');
    content.replaceChildren();
    document.body.style.overflow = previousOverflow;
    if (previousFocus?.focus) previousFocus.focus();
  };

  /** Reveal the dialog and capture focus/scroll state. No-op if already open
   *  (so setting content more than once, e.g. "Loading..." then the real
   *  fragment, doesn't clobber the focus to restore on close). */
  const show = () => {
    if (!modalRoot.hidden) return;
    previousFocus = el.getRootNode().activeElement;
    modalRoot.hidden = false;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  };

  const setContent = (node, { video = false } = {}) => {
    dialog.classList.toggle('modal-dialog-video', video);
    content.replaceChildren(node);
    closeBtn.focus();
    dialog.scrollTop = 0;
  };

  const openContent = (node, options) => {
    show();
    setContent(node, options);
  };

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  eventRoot.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalRoot.hidden) close();
  });

  return {
    show, setContent, openContent, close, eventRoot,
  };
}

export function setupFragmentModal(el) {
  if (modalApi) return;
  modalApi = createModal(el);

  const openFragment = async (path) => {
    modalApi.show();
    modalApi.setContent(createTag('p', {}, 'Loading...'));
    try {
      const fragment = await loadFragment(path);
      if (fragment) {
        const main = createTag('main', { class: 'modal-main' });
        main.append(...fragment.childNodes);
        modalApi.setContent(main);
        await dynamicBlocks(main);
      } else {
        modalApi.setContent(createTag('p', {}, 'Unable to load this content right now.'));
      }
    } catch {
      modalApi.setContent(createTag('p', {}, 'Unable to load this content right now.'));
    }
  };

  modalApi.eventRoot.addEventListener('click', (e) => {
    const link = e.target.closest('main a[href*="/fragments/"]');
    if (!link) return;
    if (link.closest('header, footer, nav, .modal')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (link.target === '_blank') return;
    const path = getFragmentPath(link.href);
    if (!path) return;
    e.preventDefault();
    openFragment(path);
  });
}

/**
 * Open the shared modal dialog with arbitrary content (e.g. a video iframe).
 * Sets up the dialog on first use if no block has done so yet.
 * @param {Element} node content to show
 * @param {{ video?: boolean }} [options] video: widen the dialog and drop its
 *   padding for an edge-to-edge player
 */
export function openModal(node, options) {
  if (!modalApi) setupFragmentModal(document);
  modalApi.openContent(node, options);
}

export default function decorate(block) {
  setupFragmentModal(block);
  block.style.display = 'none';
}
