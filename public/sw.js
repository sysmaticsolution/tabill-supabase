/* Tabill basic service worker for PWA installability and offline shell */
const CACHE_NAME = 'tabill-cache-v2';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([
        '/',
        '/manifest.webmanifest',
        '/icons/icon-192.png?v=2',
        '/icons/icon-512.png?v=2',
      ]);
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Network-first for navigation requests (HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          return fresh;
        } catch (e) {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(OFFLINE_URL);
          return cached || new Response('You are offline', { status: 200, headers: { 'Content-Type': 'text/plain' } });
        }
      })()
    );
    return;
  }

  // Cache-first for other GET requests
  if (req.method === 'GET') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          // Only cache successful, basic, same-origin responses
          if (fresh && fresh.status === 200 && fresh.type === 'basic') {
            cache.put(req, fresh.clone());
          }
          return fresh;
        } catch (e) {
          return cached || Response.error();
        }
      })()
    );
  }
});
