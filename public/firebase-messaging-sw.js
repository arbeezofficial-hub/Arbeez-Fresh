// Firebase Cloud Messaging Service Worker for Arbeez Fresh

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase App in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyDummyKeyForServiceWorker",
  authDomain: "arbeez-fresh.firebaseapp.com",
  projectId: "arbeez-fresh",
  storageBucket: "arbeez-fresh.appspot.com",
  messagingSenderId: "1006334088232",
  appId: "1:1006334088232:web:arbeezfresh"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Arbeez Fresh Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update regarding your order.',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
