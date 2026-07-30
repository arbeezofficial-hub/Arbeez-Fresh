export type Role = 'customer' | 'vendor' | 'delivery' | 'admin';

export interface LegalConsent {
  userId: string;
  policyVersion: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dataConsent: boolean;
  locationConsent: boolean;
  notificationConsent: boolean;
  acceptedAt: number;
  platform: string;
  appVersion?: string;
}

export interface CustomerLocation {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  updatedAt: number;
}

export interface LiveLocation {
  orderId: string;
  driverId: string;
  lat: number;
  lng: number;
  speed?: number; // km/h
  heading?: number; // degrees
  status: 'assigned' | 'moving_to_vendor' | 'picked_up' | 'out_for_delivery' | 'arriving' | 'delivered' | 'completed';
  lastUpdated: number;
  updatedAt: number;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: Role; // Default/primary role
  roles?: Role[]; // Approved roles e.g. ['customer', 'vendor', 'delivery']
  activeRole?: Role; // Currently active workspace view
  legalConsent?: LegalConsent;
  fcmToken?: string | null;
  location?: CustomerLocation;
  createdAt: number;
}

export interface RoleApplication {
  id: string;
  userId: string;
  applicantName: string;
  applicantEmail?: string;
  applicantPhone?: string;
  requestedRole: 'vendor' | 'delivery';
  businessOrVehicleName: string;
  addressOrArea: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: number;
  reviewedAt?: number;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  shopId: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: number;
}

export type NotificationType =
  // Customer
  | 'ORDER_PLACED'
  | 'VENDOR_ACCEPTED'
  | 'VENDOR_REJECTED'
  | 'PREPARING_ORDER'
  | 'DELIVERY_PARTNER_ASSIGNED'
  | 'DELIVERY_PARTNER_PICKED_UP'
  | 'DELIVERY_PARTNER_NEAR_YOU'
  | 'ORDER_DELIVERED'
  | 'PAYMENT_SUCCESSFUL'
  | 'REFUND_PROCESSED'
  | 'SUBSCRIPTION_UPDATED'
  // Vendor
  | 'NEW_ORDER'
  | 'NEW_ORDER_RECEIVED'
  | 'CUSTOMER_CANCELLED'
  | 'PAYMENT_VERIFIED'
  | 'NEW_REVIEW'
  | 'SUBSCRIPTION_EXPIRING'
  // Delivery Partner
  | 'NEW_DELIVERY_AVAILABLE'
  | 'DELIVERY_ASSIGNED'
  | 'PICKUP_REMINDER'
  | 'CUSTOMER_CONTACT_REQUEST'
  | 'DELIVERY_CANCELLED'
  | 'DELIVERY_COMPLETED'
  // System / General
  | 'ORDER_UPDATE'
  | 'PAYMENT_ALERT'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  role: Role;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  orderId?: string;
  shopId?: string;
  data?: Record<string, any>;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
  status: 'active' | 'inactive';
}

export interface Shop {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  rating: number;
  deliveryTimeMins: number;
  deliveryFee: number;
  deliveryAvailable?: boolean;
  freeDeliveryThreshold?: number;
  maxDeliveryDistance?: number;
  status: 'open' | 'closed';
  categories: string[]; // Category IDs
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: number;
}

export interface Product {
  id: string;
  shopId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  inStock: boolean;
  quantityAvailable: number;
  unit: string; // e.g., 'kg', 'piece', 'bunch'
  createdAt: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  shopId: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  expiryDate: number;
  status: 'active' | 'inactive';
  shopId?: string; // If specific to a shop
}

export interface PlatformSettings {
  id: string;
  platformFee: number; // Default 9.00
  paymentProcessingFee: number; // Default 9.00
  gstRate: number; // Default 5%
  otherPlatformCharges: number;
  updatedAt?: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planName: string; // 'Arbeez Fresh Plus'
  status: 'active' | 'expired' | 'cancelled';
  platformFeeWaiver: boolean;
  paymentProcessingFeeWaiver: boolean;
  startDate: number;
  expiresAt: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  shopId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  createdAt: number;
}

export interface Order {
  id: string;
  customerId: string;
  shopId: string;
  deliveryPartnerId?: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  items: { productId: string; quantity: number; price: number; name: string }[];
  totalAmount: number; // Products Total
  deliveryFee: number;
  platformFee: number;
  paymentProcessingFee: number;
  gstAmount: number;
  otherCharges?: number;
  discountAmount: number;
  subscriptionDiscount: number;
  couponCode?: string;
  grandTotal: number;
  deliveryAddress: {
    address: string;
    instructions?: string;
    lat: number;
    lng: number;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  receiptId?: string;
  settlementId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  method: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  gatewayResponse?: any;
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  orderId: string;
  paymentId: string;
  type: 'charge' | 'refund';
  amount: number;
  status: 'success' | 'failed';
  createdAt: number;
}

export interface Receipt {
  id: string;
  orderId: string;
  paymentId: string;
  transactionId: string;
  customerId: string;
  shopId: string;
  customerName: string;
  shopName: string;
  deliveryAddress: string;
  items: { name: string; quantity: number; price: number; total: number }[];
  totalAmount: number;
  deliveryFee: number;
  platformFee: number;
  paymentProcessingFee: number;
  gstAmount: number;
  otherCharges?: number;
  discountAmount: number;
  subscriptionDiscount: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: number;
}

export interface Settlement {
  id: string;
  orderId: string;
  vendorId: string;
  shopId: string;
  productAmount: number;
  vendorDeliveryFee: number;
  platformFee: number;
  paymentProcessingFee: number;
  gstCollected: number;
  discountApplied: number;
  totalAmountPaid: number;
  vendorPayoutAmount: number; // productAmount + vendorDeliveryFee
  status: 'pending_payout' | 'processing' | 'paid';
  createdAt: number;
  updatedAt: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  paymentId: string;
  transactionId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shopId: string;
  shopName: string;
  shopAddress?: string;
  vendorGstNumber?: string;
  deliveryAddress: string;
  items: { name: string; quantity: number; price: number; total: number }[];
  productsTotal: number;
  vendorDeliveryFee: number;
  platformFee: number;
  paymentProcessingFee: number;
  gstAmount: number;
  discountAmount: number;
  subscriptionDiscount: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  gatewayName: 'PayU India' | 'Cash on Delivery';
  payuTxnId?: string;
  payuMihPayId?: string;
  currency: string;
  createdAt: number;
}

export interface VendorNotification {
  id: string;
  vendorId: string;
  shopId: string;
  orderId: string;
  type: 'NEW_PAID_ORDER';
  title: string;
  message: string;
  amount: number;
  customerName: string;
  read: boolean;
  createdAt: number;
}

export type PayUMethod = 'upi' | 'upi_gpay' | 'upi_phonepe' | 'upi_paytm' | 'card' | 'netbanking' | 'emi' | 'cod';

