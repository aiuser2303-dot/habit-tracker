// Service Worker for background notifications
const CACHE_NAME = 'habit-tracker-v1';
const urlsToCache = [
  '/',
  '/css/style.css',
  '/css/components.css',
  '/js/app.js',
  '/js/ui.js',
  '/js/habits.js',
  '/js/notifications.js'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Background sync for habit reminders
self.addEventListener('sync', event => {
  if (event.tag === 'habit-reminder-check') {
    event.waitUntil(checkHabitReminders());
  }
});

async function checkHabitReminders() {
  // This runs in background even when app is closed
  const now = new Date();
  const currentHour = now.getHours();
  
  // Check if it's a typical reminder time (evening)
  if (currentHour >= 18 && currentHour <= 23) {
    // Show notification to check habits
    self.registration.showNotification('📝 Habit Check', {
      body: 'Time to check your daily habits!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'habit-reminder',
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Later' }
      ]
    });
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});