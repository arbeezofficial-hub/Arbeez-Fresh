import { auth, loginWithGoogle as loginWithGoogleCore, loginAnonymously as loginAnonymouslyCore, logout as logoutCore, setupRecaptcha as setupRecaptchaCore, loginWithPhone as loginWithPhoneCore, deleteCurrentUser } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export const loginWithGoogle = async () => {
  return loginWithGoogleCore();
};

export const loginAnonymously = async () => {
  return loginAnonymouslyCore();
};

export const logout = async () => {
  return logoutCore();
};

export const deleteAccount = async () => {
  return deleteCurrentUser();
};

export const setupRecaptcha = (buttonId: string) => {
  return setupRecaptchaCore(buttonId);
};

export const loginWithPhone = async (phoneNumber: string, appVerifier: any) => {
  return loginWithPhoneCore(phoneNumber, appVerifier);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
