import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, MapPin, ReceiptText, ShieldCheck, Crown, Sparkles, CreditCard, Building2, Smartphone, DollarSign, Lock } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import { PlatformSettings, Subscription } from '../types';
import { 
  fetchPlatformSettings, 
  fetchUserSubscription, 
  calculatePaymentBreakdown, 
  DEFAULT_PLATFORM_SETTINGS 
} from '../services/paymentEngine';
import { executePayUOrderWorkflow } from '../services/payuService';

export const Checkout = () => {
  const navigate = useNavigate();
  const { items, shop, coupon, clearCart } = useCartStore();
  const { user } = useAuthStore();
  
  const [address, setAddress] = useState('Home: 123 Main Street, Bangalore');
  const [paymentMethod, setPaymentMethod] = useState<'upi_gpay' | 'upi_phonepe' | 'upi_paytm' | 'card' | 'netbanking' | 'emi' | 'cod'>('upi_gpay');
  const [isProcessing, setIsProcessing] = useState(false);

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isSubscribedOverride, setIsSubscribedOverride] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      const settings = await fetchPlatformSettings();
      setPlatformSettings(settings);

      if (user) {
        const sub = await fetchUserSubscription(user.uid);
        setSubscription(sub);
        if (sub && sub.status === 'active') {
          setIsSubscribedOverride(true);
        }
      }
    }
    loadData();
  }, [user]);

  const breakdown = calculatePaymentBreakdown(
    items,
    shop,
    coupon,
    platformSettings,
    subscription,
    isSubscribedOverride
  );

  if (items.length === 0) {
    navigate('/');
    return null;
  }

  const handleToggleSubscription = async () => {
    const nextState = !isSubscribedOverride;
    setIsSubscribedOverride(nextState);

    if (user) {
      try {
        const subRef = doc(db, 'subscriptions', `sub_${user.uid}`);
        if (nextState) {
          const newSub: Subscription = {
            id: `sub_${user.uid}`,
            userId: user.uid,
            planName: 'Arbeez Fresh Plus',
            status: 'active',
            platformFeeWaiver: true,
            paymentProcessingFeeWaiver: true,
            startDate: Date.now(),
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
          };
          await setDoc(subRef, newSub);
          toast.success('Arbeez Fresh Plus activated! Platform & processing fees waived.');
        } else {
          await setDoc(subRef, { status: 'expired' }, { merge: true });
          toast('Arbeez Fresh Plus deactivated');
        }
      } catch (err) {
        console.warn('Could not update subscription doc:', err);
      }
    }
  };

  const handlePlacePayUOrder = async () => {
    if (!user || !shop) return;
    setIsProcessing(true);

    try {
      const isCod = paymentMethod === 'cod';
      const payuOption = isCod ? 'cod' : paymentMethod;

      const { receiptId, invoiceId } = await executePayUOrderWorkflow({
        user,
        shop,
        items,
        coupon,
        address,
        paymentMethod: isCod ? 'cod' : 'payu',
        breakdown,
        payuOption
      });
      
      clearCart();
      toast.success(isCod ? 'Order placed via Cash on Delivery!' : 'PayU India payment verified & order placed!');
      navigate(`/order-tracking/${receiptId}`);
      
    } catch (error: any) {
      console.error('PayU Checkout error:', error);
      toast.error(error?.message || 'Payment verification failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const PaymentOption = ({ 
    value, 
    label, 
    sublabel, 
    icon: Icon 
  }: { 
    value: string; 
    label: string; 
    sublabel?: string; 
    icon: any 
  }) => (
    <label className={`flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === value ? 'border-emerald-500 bg-emerald-50/60 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
      <div className="flex items-center gap-3.5">
        <input 
          type="radio" 
          name="payment" 
          value={value} 
          checked={paymentMethod === value}
          onChange={() => setPaymentMethod(value as any)}
          className="w-5 h-5 text-emerald-500 border-slate-300 focus:ring-emerald-500"
        />
        <div className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-700 shadow-2xs">
          <Icon size={20} className={paymentMethod === value ? 'text-emerald-600' : 'text-slate-500'} />
        </div>
        <div>
          <span className={`font-bold block text-sm ${paymentMethod === value ? 'text-emerald-950' : 'text-slate-900'}`}>{label}</span>
          {sublabel && <span className="text-[11px] text-slate-400 font-medium block">{sublabel}</span>}
        </div>
      </div>
      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 uppercase tracking-widest">
        {value === 'cod' ? 'COD' : 'PayU'}
      </span>
    </label>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-40 font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white p-6 shadow-xs flex items-center gap-4 sticky top-0 z-10 border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-900 rounded-full hover:bg-slate-100">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Checkout</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <Lock size={10} className="text-emerald-500" /> Powered by PayU India
          </p>
        </div>
        <ShieldCheck size={26} className="text-emerald-500" />
      </div>

      <div className="p-4 flex-1 space-y-4">
        {/* Delivery Address */}
        <div className="bg-white rounded-[24px] shadow-2xs border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 mt-1">
              <MapPin size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Delivery Address</h3>
              <p className="text-sm text-slate-800 font-bold leading-relaxed">{address}</p>
              <button className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mt-2 hover:text-emerald-700">Change Address</button>
            </div>
          </div>
        </div>

        {/* Arbeez Fresh Plus Membership Banner */}
        <div className={`rounded-[24px] p-5 border transition-all ${isSubscribedOverride ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-sm' : 'bg-slate-900 text-white border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-400/20 rounded-xl text-amber-300">
                <Crown size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm uppercase tracking-wide">Arbeez Fresh Plus</h4>
                  {isSubscribedOverride && <span className="bg-white text-amber-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Active</span>}
                </div>
                <p className="text-xs text-amber-100 font-medium mt-0.5">
                  {isSubscribedOverride 
                    ? 'Platform Fee (₹9) & Processing Fee (₹9) waived!' 
                    : 'Get ₹0 Platform Fee & ₹0 Processing Fee on every order'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleSubscription}
              className={`text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors shadow-2xs ${
                isSubscribedOverride 
                  ? 'bg-amber-900/40 text-amber-100 hover:bg-amber-900/60' 
                  : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              }`}
            >
              {isSubscribedOverride ? 'Active' : 'Activate (₹0)'}
            </button>
          </div>
        </div>

        {/* Order Payment Summary Calculation */}
        <div className="bg-white rounded-[24px] shadow-2xs border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ReceiptText size={20} className="text-slate-400" />
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-base">Payment Summary</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prices incl. taxes</span>
          </div>
          
          <div className="space-y-3 text-sm font-medium">
            <div className="flex justify-between text-slate-600">
              <span>Products Total</span>
              <span className="font-bold text-slate-900">₹{breakdown.productsTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <div className="flex flex-col">
                <span>Vendor Delivery Fee</span>
                {shop?.freeDeliveryThreshold && shop.freeDeliveryThreshold > 0 && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    {breakdown.isFreeDelivery 
                      ? `Free delivery unlocked (Order ≥ ₹${shop.freeDeliveryThreshold})`
                      : `Free delivery on orders ≥ ₹${shop.freeDeliveryThreshold}`}
                  </span>
                )}
              </div>
              <div className="text-right">
                {breakdown.isFreeDelivery ? (
                  <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="line-through text-slate-400 font-normal text-xs">₹{breakdown.rawVendorDeliveryFee.toFixed(2)}</span>
                    <span>FREE</span>
                  </span>
                ) : (
                  <span className="font-bold text-slate-900">₹{breakdown.vendorDeliveryFee.toFixed(2)}</span>
                )}
              </div>
            </div>
            
            <div className="flex justify-between text-slate-600">
              <span>Platform Fee</span>
              {breakdown.isSubscriptionActive ? (
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="line-through text-slate-400 font-normal text-xs">₹{breakdown.basePlatformFee.toFixed(2)}</span>
                  <span>₹0.00</span>
                </span>
              ) : (
                <span className="font-bold text-slate-900">₹{breakdown.basePlatformFee.toFixed(2)}</span>
              )}
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Payment Processing Fee</span>
              {breakdown.isSubscriptionActive ? (
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="line-through text-slate-400 font-normal text-xs">₹{breakdown.basePaymentProcessingFee.toFixed(2)}</span>
                  <span>₹0.00</span>
                </span>
              ) : (
                <span className="font-bold text-slate-900">₹{breakdown.basePaymentProcessingFee.toFixed(2)}</span>
              )}
            </div>
            
            <div className="flex justify-between text-slate-600">
              <span>GST ({breakdown.gstRate}%)</span>
              <span className="font-bold text-slate-900">₹{breakdown.gstAmount.toFixed(2)}</span>
            </div>

            {breakdown.otherCharges > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Other Applicable Taxes</span>
                <span className="font-bold text-slate-900">₹{breakdown.otherCharges.toFixed(2)}</span>
              </div>
            )}

            {breakdown.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Coupon Discount {coupon ? `(${coupon.code})` : ''}</span>
                <span>-₹{breakdown.couponDiscount.toFixed(2)}</span>
              </div>
            )}

            {breakdown.subscriptionDiscount > 0 && (
              <div className="flex justify-between text-amber-600 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                <span className="flex items-center gap-1 text-xs uppercase tracking-wide">
                  <Sparkles size={14} /> Subscription Discount (Fresh Plus)
                </span>
                <span>-₹{breakdown.subscriptionDiscount.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <div className="pt-4 mt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-end">
            <div>
              <span className="font-black uppercase tracking-wide text-slate-900 text-base block">Grand Total</span>
              <span className="text-[11px] text-slate-400 font-medium">Includes taxes and gateway processing</span>
            </div>
            <span className="text-2xl font-black text-emerald-600">₹{breakdown.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* PayU India Gateway Method Selection */}
        <div className="bg-white rounded-[24px] shadow-2xs border border-slate-200 p-6 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-base">Select Payment Method</h3>
              <p className="text-xs text-slate-500 font-medium">Secured with 256-bit SSL PayU Gateway Encryption</p>
            </div>
            <div className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 font-black text-[10px] uppercase tracking-wider">
              PayU India
            </div>
          </div>

          <PaymentOption 
            value="upi_gpay" 
            label="Google Pay / PhonePe / Paytm UPI" 
            sublabel="Pay directly using any UPI App"
            icon={Smartphone}
          />

          <PaymentOption 
            value="card" 
            label="Credit Card / Debit Card" 
            sublabel="Visa, Mastercard, RuPay, Maestro"
            icon={CreditCard}
          />

          <PaymentOption 
            value="netbanking" 
            label="Net Banking" 
            sublabel="SBI, HDFC, ICICI, Axis, Kotak & more"
            icon={Building2}
          />

          <PaymentOption 
            value="emi" 
            label="Easy EMI Options" 
            sublabel="Credit Card EMI via PayU"
            icon={CreditCard}
          />

          <PaymentOption 
            value="cod" 
            label="Cash on Delivery (COD)" 
            sublabel="Pay cash at doorstep upon delivery"
            icon={DollarSign}
          />
        </div>
      </div>

      {/* Pay Button Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-6 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] border-t border-slate-100 rounded-t-[32px] z-50">
        <button 
          onClick={handlePlacePayUOrder}
          disabled={isProcessing}
          className="w-full bg-slate-900 text-white font-black py-4.5 rounded-2xl shadow-md flex items-center justify-center gap-2 uppercase tracking-wide hover:bg-slate-800 disabled:opacity-70 disabled:shadow-none transition-all"
        >
          {isProcessing ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting to PayU Gateway...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Lock size={18} className="text-emerald-400" />
              <span>{paymentMethod === 'cod' ? `Place Order (₹${breakdown.grandTotal.toFixed(2)})` : `Pay ₹${breakdown.grandTotal.toFixed(2)} with PayU`}</span>
            </div>
          )}
        </button>
        <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">
          <span>PayU India Verified</span>
          <span>•</span>
          <span>100% Secure Checkout</span>
        </div>
      </div>
    </div>
  );
};
