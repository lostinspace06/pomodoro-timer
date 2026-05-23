const CACHE_NAME = 'pomodoro-ghibli-v1'

// App shell — always cache these on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/maskable-icon.svg',
  '/lofi-poster.svg',
]

// ── Install: precache the app shell ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch strategy ────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Only handle GET requests, skip cross-origin (Firebase, fonts, etc.)
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  // JS/CSS bundles (hashed filenames) — cache-first, they never change
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached || fetchAndCache(event.request)
      )
    )
    return
  }

  // Sound files — cache-first (large files, don't re-fetch)
  if (url.pathname.startsWith('/sounds/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached || fetchAndCache(event.request)
      )
    )
    return
  }

  // Background images — cache-first
  if (url.pathname.startsWith('/backgrounds/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached || fetchAndCache(event.request)
      )
    )
    return
  }

  // Everything else (HTML, manifest, icons) — network-first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a clone of the response
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

// ── Helper: fetch and store in cache ─────────────────────────────────────────
function fetchAndCache(request) {
  return fetch(request).then((response) => {
    if (response.ok) {
      const clone = response.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
    }
    return response
  })
}
