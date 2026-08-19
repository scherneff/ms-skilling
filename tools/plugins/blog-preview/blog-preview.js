import DA_SDK from 'https://da.live/nx/utils/sdk.js';

// Reuses the workers/link_preview worker already built for cards-course's
// runtime blog-link support (see blocks/cards-course/cards-course.js). This
// plugin fetches the preview image once, at authoring time, and inserts a
// real <img> into the doc — no runtime fetch/IntersectionObserver needed for
// cards authored this way.
const LINK_PREVIEW_ENDPOINT = 'https://ms-skilling-link-preview.scherneff.workers.dev';

function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value != null) el.setAttribute(key, value);
  });
  [].concat(children).forEach((child) => {
    if (child) el.append(child);
  });
  return el;
}

async function init() {
  const { actions } = await DA_SDK;

  const urlInput = createEl('input', {
    type: 'url',
    placeholder: 'https://example.com/blog-post',
    class: 'blog-preview-input',
    required: 'true',
  });
  const fetchBtn = createEl('button', { type: 'submit', class: 'btn btn-secondary' }, 'Preview');
  const form = createEl('form', { class: 'blog-preview-row' }, [urlInput, fetchBtn]);

  const status = createEl('div', { class: 'blog-preview-status' });
  const previewImg = createEl('img', { class: 'blog-preview-image', alt: '' });
  previewImg.hidden = true;
  const previewTitle = createEl('div', { class: 'blog-preview-title' });
  const insertBtn = createEl('button', { type: 'button', class: 'btn btn-primary' }, 'Insert Image');
  insertBtn.disabled = true;

  let preview = null;

  const reset = () => {
    preview = null;
    insertBtn.disabled = true;
    previewImg.hidden = true;
    previewTitle.textContent = '';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;

    reset();
    status.textContent = 'Fetching preview…';
    fetchBtn.disabled = true;

    try {
      const res = await fetch(`${LINK_PREVIEW_ENDPOINT}?url=${encodeURIComponent(url)}`);
      const data = res.ok ? await res.json() : null;
      if (data?.image) {
        preview = data;
        previewImg.src = data.image;
        previewImg.hidden = false;
        previewTitle.textContent = data.title || '';
        insertBtn.disabled = false;
        status.textContent = '';
      } else {
        status.textContent = 'No preview image found for this URL. Some sites (e.g. Microsoft’s own blogs) block automated fetches.';
      }
    } catch {
      status.textContent = 'Could not fetch a preview for this URL.';
    } finally {
      fetchBtn.disabled = false;
    }
  });

  insertBtn.addEventListener('click', async () => {
    if (!preview) return;
    const alt = (preview.title || '').replace(/"/g, '&quot;');
    await actions.sendHTML(`<img src="${preview.image}" alt="${alt}">`);
    await actions.closeLibrary();
  });

  const panel = createEl('div', { class: 'blog-preview-panel' }, [
    createEl('h2', {}, 'Blog Preview'),
    createEl('p', { class: 'blog-preview-help' }, 'Paste a blog or article URL, fetch its preview image, then insert it at your cursor.'),
    form,
    status,
    previewImg,
    previewTitle,
    insertBtn,
  ]);
  document.body.append(panel);
}

init();
