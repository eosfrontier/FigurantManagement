'use strict'

// Update cache names any time any of the cached files change.
const CACHE_NAME = 'static-cache-refreshbutton'

// Add list of files to cache here.
const FILES_TO_CACHE = [
  '/index.html',
  '/build/bundle.js',
  '/build/bundle.js.map',
  '/global.css',
  '/build/bundle.css',
  '/favicon.svg',
  '/service-worker.js',
  '/manifest.json',
  '/images/icons/icon-128x128.png',
  '/images/icons/icon-144x144.png',
  '/images/icons/icon-152x152.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-256x256.png',
  '/images/icons/icon-512x512.png',
  './images/aquilaBanner.png',
  './images/dugoBanner.png',
  './images/ekaneshBanner.png',
  './images/pendzalBanner.png',
  './images/sonaBanner.png',
  '/offline.html',
]

self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install')

  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page')
      return cache.addAll(FILES_TO_CACHE)
    }),
  )

  self.skipWaiting()
})

self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate')
  // Remove previous cached data from disk.
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key)
            return caches.delete(key)
          }
        }),
      )
    }),
  )

  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  e.respondWith(
    (async () => {
      const r = await caches.match(e.request)
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`)
      if (r) {
        return r
      }
      const response = await fetch(e.request).catch(() => {
        return caches.open(CACHE_NAME).then((cache) => {
          console.log(
            `[Service Worker] Unable to fetch resource: ${e.request.url}. Serving offline site.`,
          )
          return cache.match('offline.html')
        })
      })
      const cache = await caches.open(CACHE_NAME)
      console.log(`[Service Worker] Caching new resource: ${e.request.url}`)
      cache.put(e.request, response.clone())
      return response
    })(),
  )
})
