// Service worker del portal.
//
// v1.0.3: se quita por completo el manejo personalizado de 'fetch'.
//
// Antes este archivo interceptaba la carga de la página para poder mostrar
// una copia guardada si algún día no había señal. Eso es exactamente lo que
// hacía que en datos móviles la carga a veces terminara en blanco: el
// service worker se metía en medio de la petición, y las demás apps de la
// suite —que no pasan por ningún service worker propio— nunca han tenido
// ese problema con la misma red.
//
// El beneficio de esa copia sin conexión, además, era mínimo: el login de
// todos modos necesita red para hablar con Firebase, así que sin conexión
// no había mucho que hacer aquí de cualquier forma.
//
// Ahora este service worker no toca ninguna petición: cada carga va directo
// a la red, igual que ya carga cualquier otra app de la suite.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Limpia cualquier caché que hayan dejado versiones anteriores de este
  // archivo, para no dejar basura ocupando espacio sin usarse.
  e.waitUntil(
    caches.keys()
      .then(nombres => Promise.all(nombres.map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// A propósito no hay un manejador de 'fetch': ninguna petición se
// intercepta, ninguna se cachea.
