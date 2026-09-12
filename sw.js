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

const CACHE = 'portal-v1.0.2';

// Únicas rutas que este service worker atiende. Todo lo demás pasa de largo.
const MIAS = ['/', '/index.html', '/manifest.json', '/sw.js',
              '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];

const esMia = url => MIAS.includes(new URL(url).pathname);

// Última salida cuando no hay red NI copia guardada de nada (por ejemplo,
// iOS borró el almacenamiento del sitio por inactividad). Antes, en ese caso,
// el fetch se resolvía sin ninguna respuesta y la pantalla quedaba
// completamente en blanco, sin ningún aviso: quien abría la app desde el
// icono no tenía forma de saber que algo había fallado ni cómo reintentar.
const sinConexion = () => new Response(
  `<!doctype html><meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <body style="margin:0;min-height:100vh;display:flex;align-items:center;
     justify-content:center;background:#F4F7FC;
     font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
     color:#1a2332;padding:24px;box-sizing:border-box">
     <div style="text-align:center;max-width:300px">
       <div style="background:#003580;color:#fff;width:54px;height:54px;border-radius:13px;
         display:flex;align-items:center;justify-content:center;font-weight:700;
         font-size:21px;margin:0 auto 16px">IM</div>
       <p style="margin:0 0 6px;font-weight:700">No se pudo cargar IMPREDIMEX</p>
       <p style="margin:0 0 18px;color:#5A6A80;font-size:13.5px">Revisa tu conexión e inténtalo de nuevo.</p>
       <button onclick="location.reload()" style="border:none;border-radius:10px;
         background:#003580;color:#fff;font-weight:700;padding:12px 22px;
         font-size:14px">Reintentar</button>
     </div>
   </body>`,
  { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
);

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
    }).catch(() => caches.match(req)
        .then(r => r || caches.match('./index.html'))
        .then(r => r || sinConexion()))
  );
});
