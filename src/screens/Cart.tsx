import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, Trash2, Plus, Minus, Tag, X } from 'lucide-react';
import { Coupon, PlatformSettings, Subscription } from '../types';
import { 
  fetchPlatformSettings, 
  fetchUserSubscription, 
  calculatePaymentBreakdown, 
  DEFAULT_PLATFORM_SETTINGS 
} from '../services/paymentEngine';
import brandLogo from '../assets/logo';

// Mock coupons for demonstration
const MOCK_COUPONS: Coupon[] = [
  {
    id: 'c1',
    code: 'WELCOME50',
    discountType: 'flat',
    discountValue: 50,
    minOrderValue: 200,
    maxDiscount: 50,
    expiryDate: Date.now() + 86400000,
    status: 'active'
  },
  {
    id: 'c2',
    code: 'FRESH10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 500,
    maxDiscount: 100,
    expiryDate: Date.now() + 86400000,
    status: 'active'
  }
];

export const Cart = () => {
  const navigate = useNavigate();
  const { items, shop, coupon, applyCoupon, removeCoupon, updateQuantity, clearCart, getTotal } = useCartStore();
  const { user } = useAuthStore();
  
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    async function loadData() {
      const settings = await fetchPlatformSettings();
      setPlatformSettings(settings);
      if (user) {
        const sub = await fetchUserSubscription(user.uid);
        setSubscription(sub);
      }
    }
    loadData();
  }, [user]);

  const breakdown = calculatePaymentBreakdown(items, shop, coupon, platformSettings, subscription);
  const itemTotal = getTotal();

  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponCode) return;
    
    const validCoupon = MOCK_COUPONS.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    
    if (validCoupon) {
      if (itemTotal >= validCoupon.minOrderValue) {
        applyCoupon(validCoupon);
        setCouponCode('');
      } else {
        setCouponError(`Add items worth ₹${validCoupon.minOrderValue - itemTotal} more to apply`);
      }
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-full bg-slate-50 flex flex-col items-center justify-center p-6 font-sans text-slate-900">
        <div className="h-16 mb-8">
          <img src={brandLogo} alt="Arbeez Fresh Logo" className="h-full w-auto object-contain" />
        </div>
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
          <Trash2 size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Your cart is empty</h2>
        <p className="text-slate-500 font-medium mb-8 text-center max-w-xs">Looks like you haven't added anything to your cart yet.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-emerald-500 text-white font-black px-8 py-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] uppercase tracking-wide hover:bg-emerald-600 transition-colors"
        >
          Browse Shops
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 flex flex-col pb-32 font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white p-6 shadow-sm flex items-center justify-between sticky top-0 z-10 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-900 rounded-full hover:bg-slate-100">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cart</h1>
        </div>
        <button onClick={clearCart} className="text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100">
          Clear
        </button>
      </div>

      <div className="p-4 flex-1 space-y-4">
        {/* Shop Info */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <img src={shop?.logoUrl || shop?.bannerUrl} alt={shop?.name} className="w-16 h-16 rounded-2xl object-cover bg-slate-100" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest mb-1">Ordering from</p>
            <h2 className="font-black text-lg text-slate-900 uppercase tracking-tight">{shop?.name}</h2>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
          {items.map((item, index) => (
            <div key={item.product.id} className={`p-6 flex gap-4 ${index !== items.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className="flex-1">
                <h3 className="font-extrabold text-slate-900 text-sm leading-tight mb-1">{item.product.name}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wide mb-3">{item.product.unit}</p>
                <div className="font-black text-slate-900">₹{item.product.price}</div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <div className="font-black text-emerald-500 text-lg">₹{item.product.price * item.quantity}</div>
                
                <div className="flex items-center bg-emerald-50 rounded-xl border border-emerald-100 mt-3">
                  <button 
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-emerald-600 font-bold hover:bg-emerald-100 rounded-l-xl transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center font-black text-emerald-700 text-sm">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-emerald-600 font-bold hover:bg-emerald-100 rounded-r-xl transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coupon Section */}
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={16} className="text-emerald-500" />
            <h3 className="font-black text-slate-900 uppercase tracking-tight">Apply Coupon</h3>
          </div>
          
          {coupon ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
              <div>
                <p className="text-emerald-700 font-black uppercase tracking-wide text-sm">{coupon.code}</p>
                <p className="text-emerald-600 text-[10px] font-bold mt-1">Saved ₹{breakdown.couponDiscount}</p>
              </div>
              <button 
                onClick={removeCoupon}
                className="w-8 h-8 flex items-center justify-center text-emerald-500 hover:bg-emerald-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold uppercase outline-none focus:border-emerald-500"
                />
                <button 
                  onClick={handleApplyCoupon}
                  className="bg-slate-900 text-white font-black px-6 rounded-2xl uppercase tracking-wide hover:bg-slate-800"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-red-500 text-[10px] font-bold mt-2 ml-2">{couponError}</p>}
            </div>
          )}
        </div>

        {/* Bill Details */}
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-6">
          <h3 className="font-black text-slate-900 mb-6 uppercase tracking-tight">Bill Details</h3>
          
          <div className="space-y-3 text-sm font-medium">
            <div className="flex justify-between text-slate-500">
              <span>Products Total</span>
              <span className="font-bold text-slate-900">₹{breakdown.productsTotal.toFixed(2)}</span>
            </div>
            
            {breakdown.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Coupon Discount</span>
                <span className="font-bold">-₹{breakdown.couponDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-500">
              <span>Delivery Fee</span>
              {breakdown.isFreeDelivery ? (
                <span className="font-bold text-emerald-600">FREE</span>
              ) : (
                <span className="font-bold text-slate-900">₹{breakdown.vendorDeliveryFee.toFixed(2)}</span>
              )}
            </div>
            
            <div className="flex justify-between text-slate-500">
              <span>Platform Fee</span>
              <span className="font-bold text-slate-900">₹{breakdown.effectivePlatformFee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Processing Fee</span>
              <span className="font-bold text-slate-900">₹{breakdown.effectivePaymentProcessingFee.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-slate-500">
              <span>GST ({breakdown.gstRate}%)</span>
              <span className="font-bold text-slate-900">₹{breakdown.gstAmount.toFixed(2)}</span>
            </div>
            
            <div className="border-t-2 border-dashed border-slate-200 pt-4 mt-2 flex justify-between font-black text-xl text-slate-900">
              <span className="uppercase tracking-tight">To Pay</span>
              <span className="text-emerald-500">₹{breakdown.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] border-t border-slate-100 rounded-t-[32px] z-50">
        <button 
          onClick={() => navigate('/checkout')}
          className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-[0_8px_30px_rgb(16,185,129,0.3)] flex items-center justify-center gap-2 uppercase tracking-wide hover:bg-emerald-600 transition-colors"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

