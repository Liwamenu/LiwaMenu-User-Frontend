self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = JSON.parse(event.data?.text() || "{}");
  } catch {
    payload = {};
  }

  console.log("[FCM background] push event received:", payload);

  const title = payload?.notification?.title || "QR Menu";
  const body = payload?.notification?.body || "New update";
  const data = payload?.data || {};

  // Notify all open app windows so React state updates in real-time
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, { body, data }),
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ type: "FCM_BACKGROUND", data }),
          );
        }),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const focused = clients.find((c) => c.focused);
        if (focused) return focused.focus();
        if (clients.length > 0) return clients[0].focus();
        return self.clients.openWindow("/");
      }),
  );
});
