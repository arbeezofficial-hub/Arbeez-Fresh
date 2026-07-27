import { logEvent } from 'firebase/analytics';
import { analytics } from '../lib/firebase';

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
};

export const trackAppOpen = () => trackEvent('app_open');
export const trackSignIn = (method: string) => trackEvent('login', { method });
export const trackProductView = (productId: string, productName: string) => 
  trackEvent('view_item', { item_id: productId, item_name: productName });
export const trackAddToCart = (productId: string, quantity: number) => 
  trackEvent('add_to_cart', { item_id: productId, quantity });
export const trackCheckout = (cartValue: number) => 
  trackEvent('begin_checkout', { value: cartValue });
export const trackOrder = (orderId: string, value: number) => 
  trackEvent('purchase', { transaction_id: orderId, value });
export const trackPayment = (orderId: string, method: string) => 
  trackEvent('add_payment_info', { payment_type: method, order_id: orderId });
export const trackSubscriptionPurchase = (planId: string) => 
  trackEvent('subscribe', { item_id: planId });
