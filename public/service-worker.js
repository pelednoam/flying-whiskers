const CACHE_NAME = 'flying-whiskers-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/flying-cat-transparent.png',
  '/assets/sardine.png',
  '/assets/meow.mp3',
  '/assets/nam-nam-nam.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
}); 