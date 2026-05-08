// Tropely — offline shell + push notifications + scheduled reading reminders
const CACHE = "felt-shell-v2";
const CORE = ["/", "/manifest.webmanifest", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/auth") ||
    url.pathname.includes("/functions/") ||
    url.hostname.includes("supabase") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// ===== Web Push (server-sent) =====
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "Tropely", body: event.data ? event.data.text() : "" }; }
  const title = data.title || "Tropely";
  const options = {
    body: data.body || "",
    icon: "/icon-512.png",
    badge: "/icon-512.png",
    data: { url: data.url || "/" },
    tag: data.tag,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) { c.navigate(url); return c.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// ===== Scheduled reading reminder (client-triggered) =====
// The main thread posts { type: "SHOW_REMINDER", title, body } when it's time.
self.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data.type === "SHOW_REMINDER") {
    const { title = "Tropely — reading time", body = "Your best reading hour is now. A few quiet pages?" } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: "/icon-512.png",
      badge: "/icon-512.png",
      tag: "reading-reminder",
      data: { url: "/" },
    });
  }
});
