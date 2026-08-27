/* Backlog Catalog service worker — bump CACHE on every release (see build/README.md) */
const CACHE = 'backlog-catalog-v1.24.0';
const ASSETS = ['.', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Stale-while-revalidate for OUR OWN files only: serve from cache instantly,
   refresh in the background so the next load picks up new deploys.

   Cross-origin requests are deliberately left alone. They used to fall through
   to the cache too, and because `ignoreSearch` drops the query string, every
   call to en.wikipedia.org/w/api.php looked identical to the cache — so the
   first cover lookup's response was replayed for every game afterwards, giving
   the whole library one game's box art. Anything not on this origin now goes
   straight to the network. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const cached = await c.match(req, { ignoreSearch: true });
      const net = fetch(req).then(res => {
        if (res && res.ok) c.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || (await net) || new Response('Offline', { status: 503 });
    })
  );
});
