import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { NotificationType, Role } from '../types';

/**
 * Registers and retrieves FCM push notification token after user login.
 * Stores token in user profile in Firestore.
 */
export const requestAndRegisterFCMToken = async (userId: string): Promise<string | null> => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported in this browser environment');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission was denied by user');
      return null;
    }

    if (!messaging) {
      console.warn('FCM Messaging instance not initialized');
      return null;
    }

    // Retrieve FCM Token with VAPID Key or default web push configuration
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
    }).catch((err) => {
      console.warn('Error fetching FCM token:', err);
      return null;
    });

    if (token) {
      // Save/Update FCM token in Firestore user profile
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: token,
        updatedAt: Date.now(),
      }).catch((err) => console.warn('Failed saving FCM token to Firestore:', err));

      return token;
    }
  } catch (error) {
    console.error('Error registering FCM token:', error);
  }
  return null;
};

/**
 * Removes FCM token from Firestore on user logout or invalid token detection.
 */
export const removeFCMToken = async (userId: string): Promise<void> => {
  try {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmToken: null,
      updatedAt: Date.now(),
    }).catch(() => {});
  } catch (err) {
    console.warn('Error removing FCM token:', err);
  }
};

/**
 * Sends notification securely via backend Server endpoint.
 * Enforces rule: "Never allow one device to send notifications directly to another device."
 */
export const sendNotificationViaServer = async ({
  userId,
  role = 'customer',
  title,
  message,
  type,
  orderId,
  shopId,
  data,
}: {
  userId: string;
  role?: Role;
  title: string;
  message: string;
  type: NotificationType;
  orderId?: string;
  shopId?: string;
  data?: Record<string, any>;
}): Promise<boolean> => {
  try {
    const { fetchWithRetry } = await import('../lib/network');
    const res = await fetchWithRetry('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        role,
        title,
        message,
        type,
        orderId,
        shopId,
        data,
      }),
      retries: 3,
      timeout: 10000
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn('Notification endpoint response error:', errJson);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error invoking server notification handler:', err);
    return false;
  }
};

/**
 * Foreground message listener for real-time push alerts.
 */
export const listenForegroundMessages = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
