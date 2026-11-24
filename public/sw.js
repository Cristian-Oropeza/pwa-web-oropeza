/**
 * Service Worker minimal para PWA Oropeza.
 * Estrategia:
 *   - GET a /_next/static/*, /icons/*, manifest.json, favicon.ico -> cache-first.
 *   - Cualquier otro GET -> network-first con fallback a cache si existe.
 *   - POST / PUT / DELETE y /api/proxy -> NUNCA se cachean (seguridad: tokens,
 *     respuestas con datos del usuario y mutaciones).
 *   - Al activar, borra caches de versiones anteriores.
 */
const CACHE_VERSION = "v1";
const STATIC_CACHE = `pwa-oropeza-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `pwa-oropeza-runtime-${CACHE_VERSION}`;

const STATIC_PREFETCH = [
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_PREFETCH))
      .catch(() => void 0)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Mismo origen solamente.
  if (url.origin !== self.location.origin) return;
  // Nunca cachear llamadas al proxy del backend.
  if (url.pathname.startsWith("/api/")) return;

  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.json";

  if (isStatic) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((resp) => {
            const copy = resp.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => void 0);
            return resp;
          })
      )
    );
    return;
  }

  // Network-first con fallback a cache.
  event.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp && resp.ok && resp.type === "basic") {
          const copy = resp.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => void 0);
        }
        return resp;
      })
      .catch(() => caches.match(req))
  );
});
