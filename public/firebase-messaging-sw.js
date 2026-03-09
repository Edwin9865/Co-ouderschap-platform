importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA8oQAKpiKX0VQKTQttWR2d34xGsnS-49o",
  authDomain: "co-ouderschap-platform.firebaseapp.com",
  projectId: "co-ouderschap-platform",
  storageBucket: "co-ouderschap-platform.firebasestorage.app",
  messagingSenderId: "311427327531",
  appId: "1:311427327531:web:ccc0c075fd34200fa6ac6e"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const isReminder = payload.data?.is_reminder === 'true';
  const notificationTitle = payload.notification?.title || 'Co-oudering App';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
    tag: isReminder
      ? `reminder-${payload.data?.event_id || Date.now()}`
      : `coparenting-${Date.now()}`,
    requireInteraction: isReminder,
    actions: isReminder
      ? [
          { action: 'snooze', title: 'Snooze 10 min' },
          { action: 'open', title: 'Openen' },
        ]
      : [],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  if (event.action === 'snooze') {
    const title = event.notification.title;
    const body = event.notification.body;
    const data = event.notification.data || {};

    // Reschedule the notification after 10 minutes
    // Note: service workers may be suspended by the browser; works reliably when browser is open
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data,
            tag: `reminder-snooze-${Date.now()}`,
            requireInteraction: true,
            actions: [
              { action: 'snooze', title: 'Snooze 10 min' },
              { action: 'open', title: 'Openen' },
            ],
          }).then(resolve).catch(resolve);
        }, 10 * 60 * 1000);
      })
    );
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
