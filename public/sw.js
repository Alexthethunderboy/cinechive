self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  event.waitUntil(self.registration.showNotification(data.title || 'New on CineChive', {
    body: data.body || 'A new title is ready in the shared library.',
    icon: data.icon || '/app-logo.png',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'cinechive-new-media',
    data: { url: data.url || '/shared' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || '/shared', self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('navigate' in client) await client.navigate(destination);
      if ('focus' in client) return client.focus();
    }
    return self.clients.openWindow(destination);
  })());
});
