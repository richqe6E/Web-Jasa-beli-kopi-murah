/* ============================================================
   DIBELIIN LEBIH MURAH — IMAGE & ASSET CACHE SERVICE WORKER (V5.1)
   Cache-First ONLY for static images/vectors in /src/assets/
   Never caches Supabase API calls, HTML, or live price data.
   ============================================================ */
const ASSET_CACHE = "dlm-assets-v5-1";

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

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  // Only intercept same-origin static assets under /src/assets/
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/src/assets/")) return;

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
