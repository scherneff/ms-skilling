# Link Preview Worker

Cloudflare Worker that fetches a page server-side and extracts its
`og:image`/`og:title` (falling back to `twitter:image`/`twitter:title`, then
`<title>`). Used by the `cards-course` block so authors can drop a blog/article
URL in the image column and get a real preview image, without a manual image
upload.

Browsers can't do this fetch themselves — the target site doesn't grant CORS
permission for our origin to read its HTML, so the extraction has to happen
server-side, on infrastructure we control (this worker), not the visitor's
browser.

## Endpoint behavior

- `OPTIONS` -> CORS preflight (`204`)
- `GET /?url=<encoded target URL>` -> `{ "image": "...", "title": "..." }`,
  or `{}` if no `og:image`/`twitter:image` was found, or if `url` is missing/unsafe
- other methods -> `405`

Responses are cached at Cloudflare's edge for 24h, keyed by the target URL —
after the first request for a given URL anywhere, subsequent requests (any
visitor, any page) are served from cache instead of re-fetching the target
site.

**Safety:** only `http(s)` URLs are accepted; requests to localhost/private/
link-local hosts are rejected (basic SSRF guard). The target fetch reads at
most 500KB of the response (og/twitter meta tags live in `<head>`, well within
that) and times out after 5s.

## Required config

Update `ALLOWED_ORIGINS` in `wrangler.toml` if this project's domain changes.
`account_id` is currently set to the same Cloudflare account used by this
repo's other workers (`contact_us`, `auth`, etc.) — **verify this is the right
account for this project** before deploying; if not, replace it with your own
(`wrangler whoami` after logging in, or check the Cloudflare dashboard).

## Local dev

From project root (where `package.json` lives):

```bash
npm install
npm run dev:link-preview
```

## Deploy

From project root:

```bash
wrangler login
npm run deploy:link-preview
```

This deploys to the default `*.workers.dev` subdomain (no custom domain/route
needed). After deploying, wrangler prints the live URL
(`https://ms-skilling-link-preview.<your-subdomain>.workers.dev`) — put that
in `blocks/cards-course/cards-course.js`'s `LINK_PREVIEW_ENDPOINT` constant.
