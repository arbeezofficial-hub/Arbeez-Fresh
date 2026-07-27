import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, Review, LiveLocation, Shop } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, MapPin, Store, Truck, CheckCircle2, Phone, Star, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { InteractiveMap } from '../components/InteractiveMap';
import { haversineDistance, estimateDeliveryTime } from '../services/location.service';
import { sendNotificationViaServer } from '../services/messaging.service';

export const OrderTracking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [nearNotified, setNearNotified] = useState(false);

  // Rating & Review Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;

    // 1. Listen to Order doc
    const orderRef = doc(db, 'orders', id);
    const unsubOrder = onSnapshot(orderRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Order;
        setOrder(data);

        // Fetch Shop location details if shopId present
        if (data.shopId) {
          const shopRef = doc(db, 'shops', data.shopId);
          onSnapshot(shopRef, (shopSnap) => {
            if (shopSnap.exists()) setShop(shopSnap.data() as Shop);
          });
        }

        // Auto open review modal when delivered
        if (data.status === 'delivered' && !reviewSubmitted) {
          setShowReviewModal(true);
        }
      }
      setLoading(false);
    });

    // 2. Listen to Live Driver Location in liveLocations/{orderId}
    const liveLocRef = doc(db, 'liveLocations', id);
    const unsubLive = onSnapshot(liveLocRef, (snap) => {
      if (snap.exists()) {
        const loc = snap.data() as LiveLocation;
        setLiveLocation(loc);

        // Check if Delivery Partner is Near You (< 0.5 km / 500m)
        if (order && order.deliveryAddress && !nearNotified) {
          const distKm = haversineDistance(
            loc.lat,
            loc.lng,
            order.deliveryAddress.lat,
            order.deliveryAddress.lng
          );

          if (distKm <= 0.5 && distKm > 0) {
            setNearNotified(true);
            toast.success('Your Delivery Partner is near your drop address (within 500m)!', { duration: 6000 });
            
            // Dispatch notification via server
            sendNotificationViaServer({
              userId: order.customerId,
              role: 'customer',
              title: 'Delivery Partner Near You',
              message: 'Your Arbeez Fresh driver is within 500 meters of your drop address!',
              type: 'DELIVERY_PARTNER_NEAR_YOU',
              orderId: order.id,
            });
          }
        }
      }
    });

    return () => {
      unsubOrder();
      unsubLive();
    };
  }, [id, reviewSubmitted, nearNotified, order]);

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!order || !user) return;

    try {
      const revId = `rev_${order.id}`;
      const newReview: Review = {
        id: revId,
        orderId: order.id,
        customerId: user.uid,
        customerName: user.displayName || user.email || 'Customer',
        shopId: order.shopId,
        rating,
        comment: reviewComment,
        createdAt: Date.now(),
      };

      await setDoc(doc(db, 'reviews', revId), newReview);
      toast.success('Thank you for rating your order!');
      setReviewSubmitted(true);
      setShowReviewModal(false);
    } catch (err) {
      toast.error('Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <Truck size={36} className="mx-auto text-emerald-600 animate-bounce" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Loading Order Tracking GPS...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center font-sans text-center">
        <p className="text-slate-500 font-bold mb-4">Order not found.</p>
        <button onClick={() => navigate('/')} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider">
          Return to Home
        </button>
      </div>
    );
  }

  const steps = [
    { key: 'accepted', title: 'Order Confirmed', desc: 'Paid & Verified' },
    { key: 'preparing', title: 'Preparing Items', desc: 'Fresh produce being packed' },
    { key: 'ready', title: 'Ready for Pickup', desc: 'Awaiting delivery partner' },
    { key: 'out_for_delivery', title: 'Out for Delivery', desc: 'On the way to your door' },
    { key: 'delivered', title: 'Delivered', desc: 'Enjoy your fresh produce!' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);
  const activeStepIdx = currentStepIndex >= 0 ? currentStepIndex : 1;

  // Calculate live ETA
  const shopLat = shop?.location?.lat || 12.9716;
  const shopLng = shop?.location?.lng || 77.5946;
  const customerLat = order.deliveryAddress?.lat || 12.9716;
  const customerLng = order.deliveryAddress?.lng || 77.5946;

  const activeDriverLat = liveLocation?.lat || (shopLat + customerLat) / 2;
  const activeDriverLng = liveLocation?.lng || (shopLng + customerLng) / 2;

  const remainingDist = haversineDistance(activeDriverLat, activeDriverLng, customerLat, customerLng);
  const etaMins = estimateDeliveryTime(remainingDist);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28">
      {/* Top Bar */}
      <div className="bg-white p-5 shadow-2xs flex items-center gap-4 sticky top-0 z-10 border-b border-slate-100">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-900 rounded-full hover:bg-slate-100">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Live GPS Order Tracking</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Order #{order.id.substring(0, 10)}
          </p>
        </div>
        <button
          onClick={() => navigate(`/receipt/${order.id}`)}
          className="bg-slate-100 text-slate-800 p-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold hover:bg-slate-200"
        >
          <FileText size={16} />
          <span>Receipt</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5">
        {/* Real GPS Interactive Map View */}
        <div className="bg-white rounded-[28px] p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex justify-between items-center px-1">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Real-time GPS Tracking
              </span>
              <h3 className="text-lg font-black text-slate-900">
                {order.status === 'delivered' ? 'Order Delivered' : `ETA: ~${etaMins} Mins (${remainingDist} km)`}
              </h3>
            </div>

            {liveLocation?.speed !== undefined && (
              <span className="bg-amber-50 text-amber-800 font-black text-xs px-3 py-1 rounded-xl border border-amber-200">
                ⚡ {liveLocation.speed} km/h
              </span>
            )}
          </div>

          <InteractiveMap
            mode="live_order_tracking"
            vendorLocation={{
              id: order.shopId,
              name: shop?.name || 'Fresh Market',
              lat: shopLat,
              lng: shopLng,
            }}
            driverLocation={{
              driverId: order.deliveryPartnerId || 'dp_assigned',
              lat: activeDriverLat,
              lng: activeDriverLng,
              speed: liveLocation?.speed || 22,
            }}
            customerDrop={{
              address: order.deliveryAddress.address,
              lat: customerLat,
              lng: customerLng,
            }}
            height="320px"
          />

          <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5 px-1">
            <MapPin size={14} className="text-emerald-600 shrink-0" />
            <span className="truncate">Drop Location: {order.deliveryAddress.address}</span>
          </div>
        </div>

        {/* Order Step Progress Timeline */}
        <div className="bg-white rounded-[28px] p-6 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Order Status Timeline</h3>

          <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {steps.map((step, idx) => {
              const isPassed = idx <= activeStepIdx;
              const isCurrent = idx === activeStepIdx;

              return (
                <div key={step.key} className="flex items-start gap-4 relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
                      isPassed ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 size={18} /> : idx + 1}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-black text-xs uppercase tracking-wide ${
                        isCurrent ? 'text-emerald-600' : isPassed ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Merchant & Partner Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Merchant</span>
            <p className="font-black text-xs text-slate-900 truncate">{shop?.name || 'Arbeez Merchant Store'}</p>
            <button
              onClick={() => toast('Connecting call to Merchant Support...')}
              className="w-full bg-slate-100 text-slate-800 font-bold py-2 rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1"
            >
              <Phone size={12} /> Contact Shop
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Delivery Partner</span>
            <p className="font-black text-xs text-slate-900 truncate">Arbeez Express Driver</p>
            <button
              onClick={() => toast('Connecting call to Delivery Partner...')}
              className="w-full bg-emerald-50 text-emerald-800 font-bold py-2 rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 border border-emerald-200"
            >
              <Phone size={12} /> Call Partner
            </button>
          </div>
        </div>
      </div>

      {/* Rating & Review Modal when Delivered */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 text-center font-sans">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Order Delivered!</h3>
              <p className="text-xs text-slate-500 font-medium">How was your fresh produce and delivery experience?</p>
            </div>

            {/* Star Rating Controls */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)} className="p-1 hover:scale-110 transition-transform">
                  <Star size={32} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              placeholder="Write a brief review for the vendor..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                Skip
              </button>

              <button
                type="button"
                onClick={handleReviewSubmit}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
