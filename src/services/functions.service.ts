import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export const triggerOrderNotification = httpsCallable(functions, 'triggerOrderNotification');
export const verifyPayment = httpsCallable(functions, 'verifyPayment');
export const updateSubscription = httpsCallable(functions, 'updateSubscription');
export const triggerVendorApprovalNotification = httpsCallable(functions, 'triggerVendorApprovalNotification');
export const triggerDeliveryAssignmentNotification = httpsCallable(functions, 'triggerDeliveryAssignmentNotification');
