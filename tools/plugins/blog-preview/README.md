# Blog Preview Plugin

A DA (Document Authoring) library plugin that lets an author paste a blog/
article URL, fetch its preview image, and insert that image into the
document at their cursor — for example, in the image column of a
`cards-course` row.

It's a thin authoring-time UI over the same worker that powers
`cards-course`'s runtime blog-link support
(`workers/link_preview`, see its README): paste a URL, click **Preview** to
fetch the `og:image`/`og:title`, then **Insert Image** to drop a real
`<img>` into the doc. Because the image is inserted as authored content
(not fetched by client JS at page-load time), it goes through the normal
Edge Delivery media pipeline like any other authored image — no runtime
fetch, no `IntersectionObserver`, and it gets self-hosted automatically the
next time the page previews.

**Known limitation:** some sites (notably Microsoft's own blogs, e.g.
`techcommunity.microsoft.com`) block the preview fetch at the WAF level by
IP reputation — this affects the runtime `cards-course` support equally, see
its block's code comments. For those, the author still needs to supply an
image manually.

## Usage

1. Position your cursor where you want the image inserted (e.g. inside a
   `cards-course` row's image cell).
2. Open the **Blog Preview** plugin from DA's library panel.
3. Paste the article URL and click **Preview**.
4. Once the image/title shows, click **Insert Image**.

## File Overview

- `blog-preview.html` – Minimal HTML shell, loads the DA SDK and the plugin JS/CSS.
- `blog-preview.js` – Fetches the preview from `workers/link_preview` and inserts it via the DA SDK's `actions.sendHTML`.
- `blog-preview.css` – Panel styling (matches `tools/plugins/tags`).
- `link-preview.svg` – Library icon.

## Integration

- **DA SDK**: `https://da.live/nx/utils/sdk.js` — resolves to `{ context, token, actions }`.
  `actions.sendHTML(html)` inserts HTML at the current cursor selection (a
  real ProseMirror transaction into the live document, not a full-document
  overwrite); `actions.closeLibrary()` closes the panel afterward.
- **Backend**: calls the already-deployed `workers/link_preview` worker
  directly from the browser (no DA-specific backend needed).

### Configuration

Register the plugin in the site's DA library config
(`https://da.live/sheet#/{org}/{repo}/.da/config`, `library` tab):

| title | path | icon | ref | format | experience |
| --- | --- | --- | --- | --- | --- |
| `Blog Preview` | `/tools/plugins/blog-preview/blog-preview.html` | `https://main--{repo}--{org}.aem.page/tools/plugins/blog-preview/link-preview.svg` | | | `dialog` |

## Development

- Lint with `npm run lint`.
- No build step, no external dependencies beyond the DA SDK.
