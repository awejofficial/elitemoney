import { precacheAndRoute } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

precacheAndRoute(self.__WB_MANIFEST);

const OFFLINE_URL = "/offline.html";
const OFFLINE_CACHE = "offline-fallback";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.add(OFFLINE_URL)),
  );
});

// Pages: try the network first (data is live/near-real-time per PRD §7), and
// only fall back to the offline page when there's truly no connection.
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({ cacheName: "pages", networkTimeoutSeconds: 8 }),
);

// Icons/fonts/images: content-hashed or rarely-changing, safe to cache-first.
registerRoute(
  ({ request }) => ["image", "font"].includes(request.destination),
  new CacheFirst({
    cacheName: "assets",
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);

setCatchHandler(async ({ event }) => {
  if (event.request.mode === "navigate") {
    const cache = await caches.open(OFFLINE_CACHE);
    return (await cache.match(OFFLINE_URL)) ?? Response.error();
  }
  return Response.error();
});

self.addEventListener("push", (event) => {
  let data = { title: "Ledger", body: "" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
        return;
      }
      return self.clients.openWindow(url);
    }),
  );
});
