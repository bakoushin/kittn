const version = 1;
const appPrefix = 'kittn-';
const staticCacheName = appPrefix + 'static-v' + version;
const imagesCacheName = appPrefix + 'content-imgs';
var allCaches = [
  staticCacheName,
  imagesCacheName
];

self.addEventListener('message', event => {
  if (event.data.action == 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll([
        '/',
        'client.js',
        'style.css',
        'https://cdn.glitch.com/69cbdbda-3055-43c9-b36a-3e58bdcac373%2Fcat-face.svg?1517247577661',
        'https://cdn.glitch.com/69cbdbda-3055-43c9-b36a-3e58bdcac373%2Fcat-face.png?1517427611387',
        'https://fonts.gstatic.com/s/fredokaone/v5/SL0aFUFfkFMMdariYQ3_YbrIa-7acMAeDBVuclsi6Gc.woff',
        'https://fonts.gstatic.com/s/rammettoone/v6/mh0uQ1tV8QgSx9v_KyEYPKRDOzjiPcYnFooOUGCOsRk.woff',
        'https://cdn.jsdelivr.net/npm/idb@2.0.4/lib/idb.min.js',
        '/socket.io/socket.io.js'
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key.startsWith(appPrefix) && !allCaches.includes(key))
        .map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  let url = new URL(event.request.url);

  if (url.host == 'images.unsplash.com') {
    event.respondWith(servePhoto(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(url).then(response => {
      return response || fetch(event.request);
    })
  );
  
});

function servePhoto(request) {
  let url = request.url;

  return caches.open(imagesCacheName).then(cache => {
    return cache.match(url).then(response => {
      if (response) return response;

      return fetch(request).then(networkResponse => {
        cache.put(url, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
