const CACHE = 'md-editor-v1';
const SHARE_CACHE = 'md-editor-share';

// All paths are scope-relative so the SW works at any subpath (e.g. GitHub Pages).
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './manifest.webmanifest',
  './vendor/marked.min.js',
  './vendor/purify.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png'
];

const SCOPE_URL = new URL('./', self.location);
const SHARE_PATH = new URL('share', SCOPE_URL).pathname;
const PENDING_SHARE_URL = new URL('__pending_share__', SCOPE_URL).toString();
const REDIRECT_URL = new URL('./?shared=1', SCOPE_URL).toString();

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== SHARE_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

async function handleShare(request) {
  const formData = await request.formData();
  const payload = {
    title: formData.get('title') || '',
    text: formData.get('text') || '',
    url: formData.get('url') || '',
    file: null
  };

  // Only the first file is honored; additional files in the share are ignored.
  const file = formData.get('file');
  if (file && typeof file !== 'string' && file.size > 0) {
    payload.file = {
      name: file.name || 'shared.md',
      content: await file.text()
    };
  }

  const cache = await caches.open(SHARE_CACHE);
  await cache.put(
    PENDING_SHARE_URL,
    new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' }
    })
  );

  return Response.redirect(REDIRECT_URL, 303);
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname === SHARE_PATH) {
    event.respondWith(handleShare(event.request));
    return;
  }

  if (event.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(new URL('./index.html', SCOPE_URL).toString());
        }
        return Response.error();
      });
    })
  );
});
