// EliteMoney Service Worker Push & Notification Click Handlers
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = {}
  try {
    payload = event.data.json()
  }
  catch {
    payload = { body: event.data.text() }
  }

  const title = payload.title || 'EliteMoney'
  const options = {
    body: payload.body || 'Daily check-in: Remember to record your expenses today!',
    icon: '/pwa-192x192.png',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || '/dashboard',
    },
    actions: payload.actions || [],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    }),
  )
})
