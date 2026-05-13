// BarberOS Service Worker v2.0
const CACHE = 'barberos-v2';
const CORE = [
  './barbero-app-firebase.html',
  './cliente-app-firebase.html',
  './barberos-auth.html',
  './barberos-upgrade.html',
  './manifest-barbero.json',
  './manifest-cliente.json',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(CORE.map(url => c.add(url)));
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // No interceptar Firebase, APIs externas ni Wompi
  const url = e.request.url;
  if (url.includes('firebase') || url.includes('googleapis') ||
      url.includes('wompi') || url.includes('gstatic') ||
      url.includes('fonts.google') || url.includes('unsplash')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
