// Service Worker for Senegram Push Notifications
const CACHE_NAME = 'senegram-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resp = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resp));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notification received
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const { title, body, icon, badge, tag, data: pushData } = data;
  
  const options = {
    body,
    icon: icon || '/favicon.svg',
    badge: badge || '/favicon.svg',
    tag: tag || 'senegram-notification',
    data: pushData || {},
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'dismiss', title: 'Fermer' },
    ],
    vibrate: [200, 100, 200],
  };
  
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', url, data: event.notification.data });
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'send-messages') {
    event.waitUntil(sendOfflineMessages());
  }
});

async function sendOfflineMessages() {
  // Implementation for offline message queue
  console.log('Sync: sending offline messages');
}

// Message from main thread
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});