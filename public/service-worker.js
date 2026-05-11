/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const PRECACHE = 'preCache17'
const RUNTIME = 'FRONTIER17'

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  'index.html',
  './', // Alias for index.html
  '/build/bundle.js',
  '/build/bundle.js.map',
  '/global.css',
  '/build/bundle.css',
  '/favicon.svg',
  '/service-worker.js',
  '/manifest.json',
  '../images/icons/icon-128x128.png',
  '../images/icons/icon-144x144.png',
  '../images/icons/icon-152x152.png',
  '../images/icons/icon-192x192.png',
  '../images/icons/icon-256x256.png',
  '../images/icons/icon-512x512.png',
  '../images/aquilaBanner.png',
  '../images/dugoBanner.png',
  '../images/ekaneshBanner.png',
  '../images/pendzalBanner.png',
  '../images/sonaBanner.png',
  '/offline.html',
]

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting()),
  )
})

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', (event) => {
  const currentCaches = [PRECACHE, RUNTIME]
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter(
          (cacheName) => !currentCaches.includes(cacheName),
        )
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete)
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', (event) => {
  const { url } = event.request

  // For API calls (to Orthanc or Watchtower), use a network-first strategy.
  // This ensures data is always fresh, and falls back to cache only when offline.
  if (url.includes('orthanc') || url.includes('watchtower')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If the fetch is successful, clone the response and cache it for offline use.
          const responseToCache = response.clone()
          caches.open(RUNTIME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
        .catch(() => {
          // If the network request fails, try to serve from the cache.
          return caches.match(event.request)
        }),
    )
    return
  }

  // For the Joomla session check, always go to the network.
  if (url.includes('idandgroups.php')) {
    return // Let the browser handle it, don't intercept.
  }

  // For all other same-origin requests (the app shell), use a cache-first strategy.
  if (url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(event.request).then((response) =>
          caches.open(RUNTIME).then((cache) =>
            // Put a copy of the response in the runtime cache.
            cache.put(event.request, response.clone()).then(() => response),
          ),
        )
      }),
    )
  }
})
