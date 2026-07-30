import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  signOut, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  deleteUser
} from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// In AI studio, the applet config is auto-injected here for convenience, 
// but we prioritize environment variables per best practice.
import config from '../../firebase-applet-config.json';

// Use Environment Variables for Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || config.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || config.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || config.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || config.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || config.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || config.measurementId,
};

// Initialize Firebase only once
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId || undefined);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// App Check (Security)
if (typeof window !== 'undefined') {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || config.recaptchaSiteKey;
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
  }
}

// Analytics
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Cloud Messaging
export let messaging: any = null;
if (typeof window !== 'undefined') {
  isMessagingSupported().then(supported => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

// -- Authentication Helpers --

export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const customErr = new Error(
        `Firebase Auth Domain Unauthorized: The domain "${hostname}" is not authorized in your Firebase console. Add "${hostname}" under Firebase Console -> Authentication -> Settings -> Authorized domains.`
      );
      (customErr as any).code = 'auth/unauthorized-domain';
      (customErr as any).hostname = hostname;
      throw customErr;
    }
    throw error;
  }
};

export const loginAnonymously = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    // Return local guest session if Firebase Anonymous auth is disabled or blocked
    return {
      uid: 'guest-' + Math.random().toString(36).substring(2, 10),
      email: 'guest@arbeezfresh.local',
      displayName: 'Guest / Demo User',
      photoURL: null,
      phoneNumber: null,
      isAnonymous: true,
    } as any;
  }
};

export const logout = async () => {
  try {
    localStorage.removeItem('arbeez_guest_user');
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    localStorage.removeItem('arbeez_guest_user');
    throw error;
  }
};

export const setupRecaptcha = (buttonId: string) => {
  (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
    callback: () => {}
  });
};

export const loginWithPhone = async (phoneNumber: string, appVerifier: any) => {
  try {
    return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  } catch (error) {
    console.error("Error with phone login", error);
    throw error;
  }
};

export const deleteCurrentUser = async () => {
  const user = auth.currentUser;
  if (user) {
    await deleteUser(user);
  }
};
