// Flywaters service worker — v2
// - NetworkFirst for HTML navigations (avoids stale app shell after deploys)
// - CacheFirst for hashed /assets/* built files (1 year expiry)
// - Skips external origins (Supabase, R2, Clarity, Google, etc.)
// - Runtime cache size capped: max 50 entries, ~5MB

const HTML_CACHE = 'flywaters-v2-html';
const ASSET_CACHE = 'flywaters-v2-assets';
const RUNTIME_CACHE = 'flywaters-v2-runtime';
const APP_CACHES = [HTML_CACHE, ASSET_CACHE, RUNTIME_CACHE];

const MAX_RUNTIME_ENTRIES = 50;
const MAX_RUNTIME_BYTES = 5 * 1024 * 1024;
const ASSET_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

const PRECACHE_URLS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(HTML_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => !APP_CACHES.includes(n)).map((n) => caches.delete(n))),
    ).then(() => self.clients.claim()),
  );
});

async function trimCache(cacheName, maxEntries, maxBytes) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const toDelete = keys.slice(0, keys.length - maxEntries);
      await Promise.all(toDelete.map((k) => cache.delete(k)));
    }
    // Rough byte estimate: only if still over entry limit skip; browsers don't expose accurate cache size
    if (maxBytes) {
      let total = 0;
      const remaining = await cache.keys();
      for (const req of remaining) {
        const res = await cache.match(req);
        if (!res) continue;
        const cl = res.headers.get('content-length');
        if (cl) total += parseInt(cl, 10);
        if (total > maxBytes) {
          await cache.delete(req);
        }
      }
    }
  } catch (_) {}
}

function isExternal(url) {
  if (url.origin !== self.location.origin) return true;
  return false;
}

function isHtmlRequest(request) {
  if (request.mode === 'navigate') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

function isHashedAsset(url) {
  return url.pathname.startsWith('/assets/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Never touch external origins (Supabase, R2, Clarity, Google APIs, etc.)
  if (isExternal(url)) return;

  // HTML navigations: NetworkFirst
  if (isHtmlRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(HTML_CACHE).then((cache) => cache.put(request, clone)).catch(() => {});
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/index.html')),
        ),
    );
    return;
  }

  // Hashed built assets: CacheFirst, 1 year
  if (isHashedAsset(url)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          const dateHeader = cached.headers.get('sw-cached-at');
          if (!dateHeader || Date.now() - parseInt(dateHeader, 10) < ASSET_MAX_AGE_MS) {
            return cached;
          }
        }
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cloned = response.clone();
            const headers = new Headers(cloned.headers);
            headers.set('sw-cached-at', String(Date.now()));
            const body = await cloned.blob();
            const stamped = new Response(body, { status: cloned.status, statusText: cloned.statusText, headers });
            cache.put(request, stamped).catch(() => {});
          }
          return response;
        } catch (err) {
          if (cached) return cached;
          throw err;
        }
      }),
    );
    return;
  }

  // Other same-origin GETs: stale-while-revalidate with runtime cache cap
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            cache.put(request, response.clone()).then(() => trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES, MAX_RUNTIME_BYTES)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});
