/* ============================================
   SERVICE WORKER — E-Office SKSDA
   Strategi network-first: selalu ambil versi
   terbaru dari server (aman saat pengembangan);
   cache hanya dipakai saat offline.
   ============================================ */

const CACHE_NAME = "eoffice-sksda-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) =>
        k.startsWith("eoffice-sksda-") && k !== CACHE_NAME
      ).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin ||
      /^\/api(?:\/|$)/.test(url.pathname) ||
      event.request.headers.has("Authorization")) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)).catch(() => {})
          );
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
