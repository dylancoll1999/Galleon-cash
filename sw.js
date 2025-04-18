// sw.js - Service Worker for Caching App Shell

const CACHE_NAME = 'galleon-cashing-up-cache-v1'; // Change version to force update cache
const urlsToCache = [
  '.', // Alias for index.html
  'index.html',
  'style.css',
  'script.js',
  'icon-192x192.png', // Cache icons too
  'icon-512x512.png'
  // Note: We are NOT caching the Dexie CDN URL here for simplicity.
  // The browser cache will hopefully handle it after first load.
  // For guaranteed offline Dexie, download it and include it locally in urlsToCache.
];

// Install event: Cache the app shell
self.addEventListener('install', event => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] App shell cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('[SW] Failed to cache app shell:', error);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim(); // Take control of open pages immediately
    })
  );
});

// Fetch event: Serve cached content first (Cache-First Strategy)
self.addEventListener('fetch', event => {
  // console.log('[SW] Fetch event for:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // console.log('[SW] Found in cache:', event.request.url);
          return response; // Serve from cache
        }
        // console.log('[SW] Not in cache, fetching:', event.request.url);
        return fetch(event.request).then(
            // Optional: Cache fetched resources dynamically?
            // Be careful caching everything, especially external resources or API calls.
            // For this app shell, caching only the core files is usually sufficient.
            networkResponse => {
                // Example: Cache other static assets if needed
                // if (networkResponse && networkResponse.status === 200 && event.request.url.endsWith('.js')) {
                //     const responseToCache = networkResponse.clone();
                //     caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                // }
                return networkResponse;
            }
        ).catch(error => {
             console.error('[SW] Fetch failed:', error);
             // Optional: Return a fallback offline page here if needed
             // return caches.match('offline.html');
        });
      })
  );
});
