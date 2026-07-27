import { getCurrentPosition, reverseGeocode } from './location.service';
import { requestAndRegisterFCMToken } from './messaging.service';
import { db } from '../lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export type PermissionType = 'location' | 'notification' | 'both';

export interface PermissionStatus {
  locationGranted: boolean;
  notificationGranted: boolean;
  platform: 'ios' | 'android' | 'web';
}

/**
 * Detects whether the client is on iOS, Android, or standard Web browser.
 */
export function detectPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  if (/android/i.test(ua)) {
    return 'android';
  }
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
    return 'ios';
  }
  return 'web';
}

/**
 * Checks current browser permission states.
 */
export async function checkPermissionStates(): Promise<PermissionStatus> {
  const platform = detectPlatform();
  let locationGranted = false;
  let notificationGranted = false;

  if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
    try {
      const locRes = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      locationGranted = locRes.state === 'granted';
    } catch {
      // fallback
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    notificationGranted = Notification.permission === 'granted';
  }

  return {
    locationGranted,
    notificationGranted,
    platform,
  };
}

/**
 * Requests location permission, gets coordinates, reverse geocodes, and saves to Firestore.
 */
export async function requestAndSaveLocation(userId?: string): Promise<{ lat: number; lng: number; address: string } | null> {
  try {
    const coords = await getCurrentPosition();
    const locData = await reverseGeocode(coords.lat, coords.lng);

    if (userId) {
      const userRef = doc(db, 'users', userId);
      await setDoc(
        userRef,
        {
          location: locData,
          updatedAt: Date.now(),
        },
        { merge: true }
      ).catch((err) => console.warn('Failed saving location to Firestore:', err));
    }

    toast.success('Location access granted & saved successfully!');
    return { lat: locData.lat, lng: locData.lng, address: locData.address };
  } catch (error: any) {
    console.warn('Location permission denied or failed:', error);
    throw new Error(error?.message || 'Location permission denied.');
  }
}

/**
 * Requests notification permission, gets FCM token, and saves to Firestore.
 */
export async function requestAndSaveNotifications(userId?: string): Promise<string | null> {
  try {
    if (!userId) {
      // If user not signed in yet, just request browser notification permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          toast.success('Notifications enabled!');
          return 'granted-web';
        }
      }
      throw new Error('User not authenticated for FCM token registration.');
    }

    const token = await requestAndRegisterFCMToken(userId);
    if (token) {
      toast.success('Live notifications enabled successfully!');
      return token;
    } else {
      throw new Error('Notification permission denied or FCM token generation failed.');
    }
  } catch (error: any) {
    console.warn('Notification permission denied or failed:', error);
    throw new Error(error?.message || 'Notification permission denied.');
  }
}
