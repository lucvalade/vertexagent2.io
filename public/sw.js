// Service Worker for AI Open House Connect Web App Push Notifications
// Handles background push events and notification clicks

self.addEventListener('push', function(event) {
  let data = {
    title: 'AI Open House Connect Support',
    body: 'You have a new support ticket update.',
    url: '/app/admin/tickets',
    ticketId: null
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/pdf-icon.png',
    badge: '/pdf-icon.png',
    tag: data.ticketId ? `ticket-${data.ticketId}` : 'support-notification',
    renotify: true,
    data: {
      url: data.url || '/app/admin/tickets',
      ticketId: data.ticketId
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/app/admin/tickets';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/app/') && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
