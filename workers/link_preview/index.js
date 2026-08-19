/*
 * Link Preview Worker – fetches a page's og:image/og:title server-side.
 * Browsers can't read cross-origin HTML themselves (blocked by CORS), so
 * blocks like cards-course call this worker to show a real preview image
 * for an authored blog/article URL instead of requiring a manually
 * uploaded image.
 */

const MAX_HTML_BYTES = 500 * 1024; // og:* tags live in <head>; no need to read the whole page
const FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h — preview images rarely change
// Some sites block requests that self-identify as bots or come from
// recognizable datacenter/CDN egress IPs (Cloudflare Workers' among them).
// A realistic browser UA + headers gets past simple UA-sniffing, though it
// won't help against IP-reputation or TLS-fingerprint-based blocking.
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

function corsHeaders(env, origin) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const headers = { 'Access-Control-Allow-Methods': 'GET, OPTIONS', Vary: 'Origin' };
  if (allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

// Basic SSRF guard: only allow public http(s) hosts, not internal/private/link-local ranges.
const PRIVATE_HOST_RE = /^(localhost|127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;

function isSafeTargetUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (PRIVATE_HOST_RE.test(url.hostname)) return false;
  return true;
}

/** Read up to `limit` bytes of a response body as text. */
async function readLimited(response, limit) {
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (received >= limit) break;
  }
  reader.cancel().catch(() => {});
  const buffer = new Uint8Array(Math.min(received, limit));
  let offset = 0;
  chunks.forEach((chunk) => {
    const room = buffer.length - offset;
    if (room <= 0) return;
    buffer.set(chunk.subarray(0, Math.min(chunk.length, room)), offset);
    offset += chunk.length;
  });
  return new TextDecoder().decode(buffer);
}

function extractMeta(html, names) {
  for (const name of names) {
    const forward = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'));
    if (forward) return forward[1];
    const backward = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`, 'i'));
    if (backward) return backward[1];
  }
  return null;
}

async function fetchPreview(targetUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!response.ok || !response.body) return null;
    const html = await readLimited(response, MAX_HTML_BYTES);
    const image = extractMeta(html, ['og:image', 'twitter:image']);
    if (!image) return null;
    const title = extractMeta(html, ['og:title', 'twitter:title'])
      || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
      || null;
    return { image, title: title ? title.trim() : null };
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const headers = { ...corsHeaders(env, origin), 'Content-Type': 'application/json' };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const target = new URL(request.url).searchParams.get('url');
    if (!target || !isSafeTargetUrl(target)) {
      return new Response(JSON.stringify({ error: 'Invalid url' }), { status: 400, headers });
    }

    const cache = caches.default;
    const cacheKey = new Request(`https://link-preview.cache/${encodeURIComponent(target)}`);
    const cached = await cache.match(cacheKey);
    if (cached) {
      return new Response(cached.body, { headers });
    }

    let result;
    try {
      result = await fetchPreview(target);
    } catch {
      result = null;
    }

    const response = new Response(JSON.stringify(result || {}), {
      headers: { ...headers, 'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}` },
    });
    if (result) ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  },
};
