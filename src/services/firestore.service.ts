import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, QueryConstraint } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Generic Repository Pattern for Firebase
export class FirestoreRepository<T> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(collection(db, this.collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  async create(id: string, data: Partial<T>): Promise<void> {
    await setDoc(doc(db, this.collectionName, id), {
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    await updateDoc(doc(db, this.collectionName, id), {
      ...data,
      updatedAt: Date.now(),
    });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, id));
  }
}

// Instantiate specific repositories
export const UsersRepository = new FirestoreRepository<any>('users');
export const VendorsRepository = new FirestoreRepository<any>('vendors');
export const DeliveryPartnersRepository = new FirestoreRepository<any>('deliveryPartners');
export const ProductsRepository = new FirestoreRepository<any>('products');
export const OrdersRepository = new FirestoreRepository<any>('orders');
export const CartRepository = new FirestoreRepository<any>('carts');
export const WishlistRepository = new FirestoreRepository<any>('wishlists');
export const NotificationsRepository = new FirestoreRepository<any>('notifications');
export const PaymentsRepository = new FirestoreRepository<any>('payments');
export const SubscriptionsRepository = new FirestoreRepository<any>('subscriptions');
