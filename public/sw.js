// Service worker for background order-alert push notifications.
//
// IMPORTANT REALITY CHECK (read this before assuming it does more than it does):
// A service worker CANNOT play custom audio by itself — browsers do not expose an Audio
// or reliable AudioContext API inside the service-worker sandbox. What it CAN reliably do,
// even with the phone screen locked or the tab closed, is show a system notification
// (banner + the phone's default notification sound + vibration). To get the actual loud
// Roman Urdu VOICE playing, at least one browser tab/PWA window with this site open (even
// just in the background) needs to be alive — that tab is what actually plays the audio,
// triggered by the postMessage below. This is a platform limitation, not a bug: no website,
// on any browser, can force a fully closed app to play arbitrary audio. The practical fix
// used by real kitchen-display setups is installing this as a PWA on a dedicated tablet/
// phone that's always on and charging.

// Standard lifecycle handlers — keep the service worker itself lightweight and always
// pass network requests straight through (offline caching isn't implemented here; this
// worker's job is push notifications + PWA installability, not an offline app shell).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Intentionally not calling event.respondWith() — every request just falls through to
  // the network normally. Having a fetch handler at all is what several PWA-installability
  // checks (including the ones TWA/Play-Store packaging tools run) look for.
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Naya Order Aa Gaya!",
    body: "Dashboard check karein!",
    url: "/admin/orders",
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Non-JSON payload — fall back to defaults above.
  }

  const notificationPromise = self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "new-order", // collapses multiple rapid orders into one updating notification
    renotify: true,
    requireInteraction: true, // stays on screen until dismissed — don't let it get missed
    vibrate: [300, 100, 300, 100, 300],
    data: payload,
  });

  // Tell every open tab/window of the app to play the actual voice alert.
  const notifyClientsPromise = self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      client.postMessage({ type: "NEW_ORDER_PUSH", payload });
    }
  });

  event.waitUntil(Promise.all([notificationPromise, notifyClientsPromise]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/admin/orders";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/admin") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
