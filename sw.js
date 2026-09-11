// Service worker del portal.
//
// ⚠️ El portal vive en la raíz del sitio, así que este service worker tiene
// alcance sobre TODA la dirección impredimex-hub.github.io, incluidas las
// rutas de las otras apps: /rrhh-pwa/, /proceso-pwa/ y las que se sumen.
//
// Por eso solo puede tocar sus propios archivos. Cualquier otra petición se
// deja pasar sin intervenir. La primera versión no lo hacía y respondía con
// el index del portal cuando una app fallaba, así que al abrir Calidad se
// veía el portal otra vez.

const CACHE = 'portal-v1.0.1';

// Únicas rutas que este service worker atiende. Todo lo demás pasa de largo.
const MIAS = ['/', '/index.html', '/manifest.json', '/sw.js',
              '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];

const esMia = url => MIAS.includes(new URL(url).pathname);

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(
    ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png']
  )).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;

  // Lo de las otras apps no se toca: cada una tiene su propio service worker
  // y responde por su cuenta.
  if (!esMia(req.url)) return;

  e.respondWith(
    fetch(req).then(res => {
      const copia = res.clone();
      caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
