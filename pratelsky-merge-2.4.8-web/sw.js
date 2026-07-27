
const CACHE_NAME = 'pratelsky-merge-v248';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './theme.js',
  './script.js',
  './manifest.webmanifest',
  './assets/icons/favicon-64.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/audio/tomas-komrska.mp3',
  './assets/audio/tomas-komrska.m4a',
  './assets/characters/zdenda.webp',
  './assets/characters/terka.webp',
  './assets/characters/mira.webp',
  './assets/characters/karel.webp',
  './assets/characters/dagmar.webp',
  './assets/characters/ondra.webp',
  './assets/characters/tomas.webp',
  './assets/ui/loading-head.png',
  './assets/ui/combo-warning-worker.png',
  './assets/ui/combo-stop-sleep.jpg',
  './assets/ui/combo-stop-rifle.png',
  './assets/ui/combo-stop-bighead.png',
  './assets/ui/combo-stop-sleeping.jpg',
  './assets/ui/ondra-peek-left.png',
  './assets/ui/ondra-peek-right.png',
  './assets/ui/pull-refresh-sad-man.png'
];
const REMOTE_PHYSICS = [
  'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js',
  'https://unpkg.com/matter-js@0.20.0/build/matter.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    for (const url of REMOTE_PHYSICS) {
      try {
        const response = await fetch(url, { mode: 'no-cors' });
        await cache.put(url, response);
      } catch (_) {
        // Stačí, když se při první online návštěvě uloží alespoň jeden zdroj.
      }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const network = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', network.clone());
        return network;
      } catch (_) {
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, response.clone());
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});
