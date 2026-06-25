/* ============================================================
   OUR WORLD — Service Worker
   Cache-first strategy for app shell so the app opens instantly
   offline. Falls back to network for anything not cached.
   Bump CACHE_NAME whenever index.html/app.js change to force
   an update on next visit.
   ============================================================ */

const CACHE_NAME = 'our-world-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests; let everything else pass through to network
  if (event.request.method !== 'GET') return;

  // Google Fonts and other cross-origin requests: try network, fall back to cache if available
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
    );
    return;
  }

  // App shell: cache-first, then network, then cache the fresh copy
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
