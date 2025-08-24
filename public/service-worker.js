/* Basic service worker for offline caching */
const CACHE_NAME = 'kleats-admin-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/KL-eats.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle GET
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Network-first for API requests, cache-first for static assets
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then(resp => {
        return resp;
      }).catch(() => caches.match(request))
    );
  } else {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(resp => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return resp;
        }).catch(() => caches.match('/index.html'));
      })
    );
  }
});
