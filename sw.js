self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let payload;
  try { payload = event.data?.json(); } catch { /* Use the default notification. */ }
  const english = payload?.language === 'en';
  event.waitUntil(self.registration.showNotification(
    english ? 'Rest is over' : 'Koniec przerwy',
    {
      body: english ? 'Time for your next set.' : 'Czas na kolejną serię.',
      icon: new URL('assets/icon-192.png', self.registration.scope).href,
      tag: 'gymbro-rest',
      renotify: true,
    },
  ));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const scope = self.registration.scope;
  const workout = new URL('./#trening', scope).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = windows.find(window => window.url.startsWith(scope));
    if (client) {
      try {
        await client.focus();
        await client.navigate(workout);
        return;
      } catch { /* Open the workout in a new window if this one closed. */ }
    }
    await self.clients.openWindow(workout);
  })());
});
