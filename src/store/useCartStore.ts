import { create } from 'zustand';
import { CartItem, Product, Shop, Coupon } from '../types';

interface CartState {
  items: CartItem[];
  shop: Shop | null;
  coupon: Coupon | null;
  addItem: (product: Product, shop: Shop) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  getTotal: () => number;
  getDiscount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  shop: null,
  coupon: null,
  addItem: (product, shop) => {
    const { items, shop: currentShop } = get();
    
    // Check if adding item from a different shop
    if (currentShop && currentShop.id !== shop.id && items.length > 0) {
      if (!window.confirm("Adding this item will clear your current cart from another shop. Continue?")) {
        return;
      }
      set({ items: [{ product, quantity: 1, shopId: shop.id }], shop, coupon: null });
      return;
    }

    const existingItem = items.find(item => item.product.id === product.id);
    if (existingItem) {
      set({
        items: items.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
        shop
      });
    } else {
      set({ items: [...items, { product, quantity: 1, shopId: shop.id }], shop });
    }
  },
  removeItem: (productId) => {
    const { items } = get();
    const newItems = items.filter(item => item.product.id !== productId);
    set({ items: newItems, shop: newItems.length === 0 ? null : get().shop, coupon: newItems.length === 0 ? null : get().coupon });
  },
  updateQuantity: (productId, quantity) => {
    const { items } = get();
    if (quantity === 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: items.map(item => 
        item.product.id === productId 
          ? { ...item, quantity }
          : item
      )
    });
  },
  applyCoupon: (coupon) => {
    set({ coupon });
  },
  removeCoupon: () => {
    set({ coupon: null });
  },
  clearCart: () => set({ items: [], shop: null, coupon: null }),
  getTotal: () => {
    return get().items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  },
  getDiscount: () => {
    const total = get().getTotal();
    const coupon = get().coupon;
    if (!coupon) return 0;
    
    if (total < coupon.minOrderValue) return 0;
    
    if (coupon.discountType === 'flat') {
      return Math.min(coupon.discountValue, total);
    } else {
      const discount = total * (coupon.discountValue / 100);
      return Math.min(discount, coupon.maxDiscount);
    }
  }
}));
