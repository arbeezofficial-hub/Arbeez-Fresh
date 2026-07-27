import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export const uploadFile = async (path: string, file: File | Blob): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

export const uploadProfileImage = (userId: string, file: File) => 
  uploadFile(`users/${userId}/profile.jpg`, file);

export const uploadShopLogo = (shopId: string, file: File) => 
  uploadFile(`shops/${shopId}/logo.jpg`, file);

export const uploadShopBanner = (shopId: string, file: File) => 
  uploadFile(`shops/${shopId}/banner.jpg`, file);

export const uploadProductImage = (productId: string, file: File) => 
  uploadFile(`products/${productId}/image.jpg`, file);
