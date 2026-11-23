/* ============================================================
   JASDOR RISGOLD — IMAGE & ASSET CACHE SERVICE WORKER (V6.2)
   Cache-First ONLY for static images/vectors in /src/assets/
   Skips .mp4 Range streams, Supabase APIs, HTML, and JS/CSS so app updates apply immediately.
   ============================================================ */
const ASSET_CACHE = "dlm-assets-v6-5";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("dlm-assets-") && key !== ASSET_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.headers.has("range")) return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  // Only intercept same-origin static assets under /src/assets/ (skip MP4 video streaming)
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/src/assets/")) return;
  if (url.pathname.endsWith(".mp4")) return;

  // Strip transient retry query param for canonical cache lookup
  const cacheKey = new Request(url.origin + url.pathname, { method: "GET" });

  event.respondWith(
    caches.open(ASSET_CACHE).then((cache) =>
      cache.match(cacheKey).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((networkRes) => {
          if (networkRes && networkRes.ok && networkRes.status === 200) {
            cache.put(cacheKey, networkRes.clone());
          }
          return networkRes;
        });
      })
    )
  );
});
