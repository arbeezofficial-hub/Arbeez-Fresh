import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Order, Shop } from '../types';
import { Truck, Navigation, MapPin, CheckCircle2, Phone, Power, Store, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { InteractiveMap } from '../components/InteractiveMap';
import { liveTrackingController } from '../services/location.service';
import { sendNotificationViaServer } from '../services/messaging.service';

export const DeliveryDashboard = () => {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [availableRequests, setAvailableRequests] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'requests' | 'earnings'>('active');
  const [shopsMap, setShopsMap] = useState<Record<string, Shop>>({});

  useEffect(() => {
    if (!user) return;

    // Listen to orders assigned to this delivery partner or ready for pickup
    const ordersQ = query(
      collection(db, 'orders'),
      where('status', 'in', ['ready', 'out_for_delivery', 'preparing', 'delivered'])
    );

    const unsub = onSnapshot(ordersQ, (snap) => {
      const allOrders = snap.docs.map((d) => d.data() as Order);

      // Filter orders assigned specifically to this partner or unassigned ready orders
      const myOrders = allOrders.filter(
        (o) => o.deliveryPartnerId === user.uid && o.status === 'out_for_delivery'
      );
      const unassigned = allOrders.filter((o) => !o.deliveryPartnerId && o.status === 'ready');

      setAssignedOrders(myOrders);
      setAvailableRequests(unassigned);

      // Start Live Location GPS Tracking for active orders
      myOrders.forEach((activeOrd) => {
        liveTrackingController.startLiveTracking(activeOrd.id, user.uid);
      });
    });

    // Fetch Shop locations for map pins
    const fetchShops = async () => {
      const unsubShops = onSnapshot(collection(db, 'shops'), (snap) => {
        const sMap: Record<string, Shop> = {};
        snap.docs.forEach((d) => {
          sMap[d.id] = d.data() as Shop;
        });
        setShopsMap(sMap);
      });
      return unsubShops;
    };
    fetchShops();

    return () => {
      unsub();
    };
  }, [user]);

  const handleAcceptDelivery = async (order: Order) => {
    if (!user) return;
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        deliveryPartnerId: user.uid,
        status: 'out_for_delivery',
        updatedAt: Date.now(),
      });

      // Start GPS Live Tracking
      liveTrackingController.startLiveTracking(order.id, user.uid);

      toast.success('Delivery accepted! Live GPS Navigation & Customer Location Sharing active.');

      // Dispatch Notification to Customer
      sendNotificationViaServer({
        userId: order.customerId,
        role: 'customer',
        title: 'Delivery Partner Assigned',
        message: `${user.displayName || 'A delivery partner'} has accepted your order and is heading to the shop!`,
        type: 'DELIVERY_PARTNER_ASSIGNED',
        orderId: order.id,
      });

      // Dispatch Notification to Vendor
      sendNotificationViaServer({
        userId: order.shopId,
        role: 'vendor',
        title: 'Delivery Partner En Route',
        message: `Delivery partner ${user.displayName || ''} is assigned for Order #${order.id.substring(0, 8)}.`,
        type: 'DELIVERY_ASSIGNED',
        orderId: order.id,
      });
    } catch (err) {
      toast.error('Failed to accept delivery');
    }
  };

  const handleCompleteDelivery = async (order: Order) => {
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'delivered',
        paymentStatus: 'completed',
        updatedAt: Date.now(),
      });

      // Stop GPS Live Tracking immediately to save battery
      await liveTrackingController.stopLiveTracking(order.id);

      toast.success('Delivery completed! Commission credited to your partner wallet.');

      // Dispatch Notification to Customer
      sendNotificationViaServer({
        userId: order.customerId,
        role: 'customer',
        title: 'Order Delivered',
        message: 'Your order has been delivered successfully! Thank you for ordering with Arbeez Fresh.',
        type: 'ORDER_DELIVERED',
        orderId: order.id,
      });

      // Dispatch Notification to Vendor
      sendNotificationViaServer({
        userId: order.shopId,
        role: 'vendor',
        title: 'Delivery Completed',
        message: `Order #${order.id.substring(0, 8)} has been delivered to the customer.`,
        type: 'DELIVERY_COMPLETED',
        orderId: order.id,
      });
    } catch (err) {
      toast.error('Failed to mark delivery completed');
    }
  };

  const totalEarnings = assignedOrders
    .filter((o) => o.status === 'delivered')
    .reduce((acc, o) => acc + (o.deliveryFee || 40), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 shadow-md rounded-b-[32px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
              <Truck size={26} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">Delivery Partner App</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {isOnline ? 'Online & Receiving Delivery Requests' : 'Offline'}
              </p>
            </div>
          </div>
          <RoleSwitcher />
        </div>

        {/* Status Switcher & Today's Earnings */}
        <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 mt-2">
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Today's Delivery Earnings</span>
            <span className="text-2xl font-black text-amber-400">₹{totalEarnings.toFixed(2)}</span>
          </div>

          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm ${
              isOnline ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
            }`}
          >
            <Power size={16} />
            <span>{isOnline ? 'Online' : 'Go Online'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-4">
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === 'active' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500'
            }`}
          >
            Active Deliveries ({assignedOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === 'requests' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500'
            }`}
          >
            Available Requests ({availableRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === 'earnings' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500'
            }`}
          >
            Earnings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {activeTab === 'active' && (
          <div className="space-y-4">
            {assignedOrders.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <Truck size={36} className="mx-auto text-slate-300" />
                <h3 className="font-black text-slate-800 uppercase tracking-tight">No Active Deliveries</h3>
                <p className="text-xs text-slate-400">Accept available order requests to start live GPS navigation.</p>
              </div>
            ) : (
              assignedOrders.map((ord) => {
                const partnerShop = shopsMap[ord.shopId];
                return (
                  <div key={ord.id} className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="font-black text-xs text-slate-900">Order #{ord.id.substring(0, 10)}</span>
                      <span className="bg-amber-50 text-amber-800 font-extrabold text-[10px] px-3 py-1 rounded-full border border-amber-200 uppercase">
                        Out for Delivery
                      </span>
                    </div>

                    {/* Interactive GPS Navigation Route Map */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold px-1">
                        <span className="flex items-center gap-1 text-emerald-600">
                          <Navigation size={14} className="animate-pulse" /> Live GPS Navigation
                        </span>
                        <span className="text-[10px] text-slate-400">Sharing GPS location with Customer</span>
                      </div>

                      <InteractiveMap
                        mode="delivery_partner_route"
                        vendorLocation={{
                          id: ord.shopId,
                          name: partnerShop?.name || 'Pickup Market',
                          lat: partnerShop?.location?.lat || 12.9716,
                          lng: partnerShop?.location?.lng || 77.5946,
                        }}
                        customerDrop={{
                          address: ord.deliveryAddress.address,
                          lat: ord.deliveryAddress.lat || 12.9716,
                          lng: ord.deliveryAddress.lng || 77.5946,
                        }}
                        height="260px"
                      />
                    </div>

                    {/* Pickup & Drop Address Details */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl">
                        <Store size={18} className="text-indigo-600 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pickup Shop</span>
                          <span className="font-bold text-slate-900">{partnerShop?.name || 'Indiranagar Fresh Market'}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                        <MapPin size={18} className="text-emerald-600 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Customer Drop Address</span>
                          <span className="font-bold text-slate-900">{ord.deliveryAddress.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Complete Delivery Action */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Commission</span>
                        <span className="font-black text-emerald-600 text-lg">₹{(ord.deliveryFee || 40).toFixed(2)}</span>
                      </div>

                      <button
                        onClick={() => handleCompleteDelivery(ord)}
                        className="bg-emerald-600 text-white font-black px-5 py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-2xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={16} /> Mark Delivered
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-3">
            {availableRequests.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <Truck size={36} className="mx-auto text-slate-300" />
                <h3 className="font-black text-slate-800 uppercase tracking-tight">No Pending Pickup Requests</h3>
                <p className="text-xs text-slate-400">New delivery orders ready at nearby shops will pop up here.</p>
              </div>
            ) : (
              availableRequests.map((req) => (
                <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-900">Order #{req.id.substring(0, 10)}</span>
                    <span className="font-black text-emerald-600 text-xs">Payout: ₹{(req.deliveryFee || 40).toFixed(2)}</span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Deliver to: <strong className="text-slate-900">{req.deliveryAddress.address}</strong>
                  </p>

                  <button
                    onClick={() => handleAcceptDelivery(req)}
                    className="w-full bg-slate-900 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
                  >
                    Accept Delivery Request
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Earnings Overview</h3>
            <p className="text-xs text-slate-500">100% of delivery fees are credited directly to your partner wallet.</p>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex justify-between items-center">
              <span className="text-xs font-bold text-amber-900">Total Completed Payouts</span>
              <span className="font-black text-amber-900 text-xl">₹{totalEarnings.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
