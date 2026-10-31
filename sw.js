/* Compra Mayorista: funciona sin conexión.
   - La app (index) se pide primero a internet y, si no hay señal, sale de la copia guardada.
   - El manifest y los íconos también se piden primero a internet (así el nombre y el ícono siempre se actualizan).
   - Fuentes se guardan al usarlas. */
var CACHE = 'compra-mayorista-v4.3';
var BASE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(BASE.map(function (u) { return c.add(new Request(u, { cache: 'reload' })); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var isMeta = url.origin === location.origin && /\.(webmanifest|png)$/.test(url.pathname);
  if (isMeta) {
    e.respondWith(fetch(req, { cache: 'reload' }).then(function (r) {
      if (r && r.status === 200) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return r;
    }).catch(function () { return caches.match(req); }));
    return;
  }
  var isPage = req.mode === 'navigate' || (url.origin === location.origin && /(\/|index\.html)$/.test(url.pathname));
  if (isPage) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(function (r) {
      var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', copy); }); return r;
    }).catch(function () { return caches.match('./index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (r) {
      if (r && (r.status === 200 || r.type === 'opaque')) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return r;
    }).catch(function () { return hit; });
    return hit || net;
  }));
});
// versión 42
