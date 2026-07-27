import { useState, useEffect, FormEvent } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import { Order, Product, Shop, Settlement } from '../types';
import { Store, Package, ShoppingBag, Clock, CheckCircle2, XCircle, ArrowRight, Plus, RefreshCw, DollarSign, BellRing, Eye, EyeOff, Truck, Navigation, MapPin, Power, Sparkles, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { InteractiveMap } from '../components/InteractiveMap';
import { sendNotificationViaServer } from '../services/messaging.service';

export const VendorDashboard = () => {
  const { user } = useAuthStore();

  const [shop, setShop] = useState<Shop | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  // Delivery Partner states when combined mode is active
  const [availableDeliveryRequests, setAvailableDeliveryRequests] = useState<Order[]>([]);
  const [myAssignedDeliveries, setMyAssignedDeliveries] = useState<Order[]>([]);

  // Combined mode toggle state
  const isApprovedForBoth = (user?.roles?.includes('vendor') && user?.roles?.includes('delivery')) || false;
  const [combinedWorkspace, setCombinedWorkspace] = useState<boolean>(isApprovedForBoth);

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'delivery' | 'settlements' | 'coverage'>('orders');

  // New product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('kg');
  const [newProdCategory, setNewProdCategory] = useState('cat_veg');
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80');

  useEffect(() => {
    if (!user) return;

    const shopId = `shop_${user.uid}`;

    // 1. Listen to Vendor Shop Doc
    const shopRef = doc(db, 'shops', shopId);
    const unsubShop = onSnapshot(shopRef, (snap) => {
      if (snap.exists()) {
        setShop(snap.data() as Shop);
      } else {
        const defaultShop: Shop = {
          id: shopId,
          vendorId: user.uid,
          name: user.displayName ? `${user.displayName}'s Fresh Market` : 'Arbeez Fresh Merchant Store',
          description: 'Local farm-fresh produce merchant',
          logoUrl: 'https://cdn-icons-png.flaticon.com/512/862/862856.png',
          bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80',
          rating: 4.9,
          deliveryTimeMins: 25,
          deliveryFee: 40,
          deliveryAvailable: true,
          freeDeliveryThreshold: 200,
          maxDeliveryDistance: 15,
          status: 'open',
          categories: ['cat_veg', 'cat_fruits'],
          location: { lat: 12.9716, lng: 77.5946, address: 'Indiranagar Market, Bangalore' },
          createdAt: Date.now(),
        };
        setDoc(shopRef, defaultShop);
        setShop(defaultShop);
      }
    });

    // 2. Listen to Orders for this Shop
    const ordersQ = query(collection(db, 'orders'), where('shopId', '==', shopId));
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      const list = snap.docs.map((d) => d.data() as Order);
      list.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(list);
    });

    // 3. Listen to Products for this Shop
    const productsQ = query(collection(db, 'products'), where('shopId', '==', shopId));
    const unsubProducts = onSnapshot(productsQ, (snap) => {
      const list = snap.docs.map((d) => d.data() as Product);
      setProducts(list);
    });

    // 4. Listen to Delivery Orders if Delivery Role is available
    const unsubDeliveries = onSnapshot(
      query(collection(db, 'orders'), where('status', 'in', ['ready', 'out_for_delivery'])),
      (snap) => {
        const allReadyOrders = snap.docs.map((d) => d.data() as Order);
        setAvailableDeliveryRequests(allReadyOrders.filter((o) => !o.deliveryPartnerId && o.status === 'ready'));
        setMyAssignedDeliveries(allReadyOrders.filter((o) => o.deliveryPartnerId === user.uid && o.status === 'out_for_delivery'));
      }
    );

    // 5. Fetch Settlements
    const fetchSettlements = async () => {
      try {
        const stlQ = query(collection(db, 'settlements'), where('vendorId', '==', user.uid));
        const stlSnap = await getDocs(stlQ);
        setSettlements(stlSnap.docs.map((d) => d.data() as Settlement));
      } catch (err) {
        console.warn('Settlements fetch error:', err);
      }
    };
    fetchSettlements();

    return () => {
      unsubShop();
      unsubOrders();
      unsubProducts();
      unsubDeliveries();
    };
  }, [user]);

  const handleUpdateOrderStatus = async (ord: Order, nextStatus: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', ord.id);
      const updates: Partial<Order> = {
        status: nextStatus,
        updatedAt: Date.now(),
      };

      if (nextStatus === 'preparing' || nextStatus === 'ready') {
        updates.deliveryPartnerId = `dp_partner_${Math.floor(1 + Math.random() * 5)}`;
      }

      await updateDoc(orderRef, updates);
      toast.success(`Order #${ord.id.substring(0, 8)} updated to ${nextStatus.replace(/_/g, ' ').toUpperCase()}`);

      // Dispatch Notifications
      if (nextStatus === 'preparing') {
        sendNotificationViaServer({
          userId: ord.customerId,
          role: 'customer',
          title: 'Preparing Your Order',
          message: `${shop?.name || 'The merchant'} has started preparing your fresh produce order!`,
          type: 'PREPARING_ORDER',
          orderId: ord.id,
        });
      } else if (nextStatus === 'ready') {
        sendNotificationViaServer({
          userId: ord.customerId,
          role: 'customer',
          title: 'Order Ready for Pickup',
          message: 'Your order is packed and awaiting delivery partner pickup!',
          type: 'VENDOR_ACCEPTED',
          orderId: ord.id,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update order status');
    }
  };

  const handleToggleProductStock = async (prodId: string, currentStock: boolean) => {
    try {
      await updateDoc(doc(db, 'products', prodId), { inStock: !currentStock });
      toast.success('Product availability updated');
    } catch (err) {
      toast.error('Failed to update product stock');
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    if (!newProdName || !newProdPrice) {
      toast.error('Please enter product name and price');
      return;
    }

    try {
      const prodId = `prod_${Date.now()}`;
      const newProd: Product = {
        id: prodId,
        shopId: shop.id,
        categoryId: newProdCategory,
        name: newProdName,
        description: 'Fresh farm produce sourced directly from local growers',
        price: Number(newProdPrice),
        originalPrice: Number(newProdPrice) * 1.2,
        imageUrl: newProdImage,
        inStock: true,
        quantityAvailable: 100,
        unit: newProdUnit,
        createdAt: Date.now(),
      };

      await setDoc(doc(db, 'products', prodId), newProd);
      toast.success('New product added to catalog!');
      setNewProdName('');
      setNewProdPrice('');
    } catch (err) {
      toast.error('Failed to add product');
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'accepted' || o.status === 'pending');
  const preparingOrders = orders.filter((o) => o.status === 'preparing' || o.status === 'ready');
  const totalVendorRevenue = orders.filter((o) => o.paymentStatus === 'completed').reduce((acc, o) => acc + o.totalAmount, 0);
  const totalDeliveryEarnings = myAssignedDeliveries.filter((o) => o.status === 'delivered').reduce((acc, o) => acc + (o.deliveryFee || 40), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 shadow-md rounded-b-[32px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-2xl text-indigo-400">
              <Store size={26} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">{shop?.name || 'Vendor Workspace'}</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${shop?.status === 'open' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                {shop?.status === 'open' ? 'Shop Active & Receiving Orders' : 'Shop Closed'}
              </p>
            </div>
          </div>
          <RoleSwitcher />
        </div>

        {/* Combined Mode Toggle Banner if Dual Approved */}
        {isApprovedForBoth ? (
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-amber-950 border border-amber-500/30 p-3.5 rounded-2xl mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                <Layers size={18} />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 block">Vendor + Delivery Combined Mode</span>
                <span className="text-[10px] text-slate-300 font-medium">Manage shop items & accept delivery routes in 1 view.</span>
              </div>
            </div>

            <button
              onClick={() => setCombinedWorkspace(!combinedWorkspace)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                combinedWorkspace
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {combinedWorkspace ? 'Combined Active' : 'Enable Combined'}
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700 mb-4 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Want to earn delivering orders too?</span>
            <a href="/become-partner?type=delivery" className="text-amber-400 font-black uppercase text-[10px] flex items-center gap-1 hover:underline">
              Apply for Delivery Mode <Sparkles size={12} />
            </a>
          </div>
        )}

        {/* Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-center">
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Shop Sales</span>
            <span className="text-lg font-black text-emerald-400">₹{totalVendorRevenue.toFixed(0)}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Pending Orders</span>
            <span className="text-lg font-black text-amber-400">{pendingOrders.length + preparingOrders.length}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Delivery Earnings</span>
            <span className="text-lg font-black text-amber-300">₹{totalDeliveryEarnings.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="p-4">
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'orders' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500'
            }`}
          >
            <ShoppingBag size={14} />
            <span>Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'products' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500'
            }`}
          >
            <Package size={14} />
            <span>Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coverage')}
            className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'coverage' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500'
            }`}
          >
            <MapPin size={14} />
            <span>Coverage Map</span>
          </button>

          <button
            onClick={() => setActiveTab('settlements')}
            className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'settlements' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500'
            }`}
          >
            <DollarSign size={14} />
            <span>Payouts</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="px-4 space-y-4">
        {/* SHOP ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <BellRing size={36} className="mx-auto text-slate-300 animate-pulse" />
                <h3 className="font-black text-slate-800 uppercase tracking-tight">No Incoming Shop Orders</h3>
                <p className="text-xs text-slate-400">Paid customer orders for your shop will appear here automatically.</p>
              </div>
            ) : (
              orders.map((ord) => (
                <div key={ord.id} className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Order ID</span>
                      <span className="font-black text-sm text-slate-900">{ord.id}</span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${
                        ord.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-800">Items Ordered:</p>
                    {ord.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600">
                        <span>
                          {it.quantity}x {it.name}
                        </span>
                        <span className="font-bold text-slate-900">₹{(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Customer Amount</span>
                      <span className="font-black text-emerald-600 text-base">₹{ord.grandTotal.toFixed(2)}</span>
                    </div>

                    <div className="flex gap-2">
                      {ord.status === 'accepted' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord, 'preparing')}
                          className="bg-slate-900 text-white font-extrabold px-4 py-2 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
                        >
                          Start Preparing
                        </button>
                      )}

                      {ord.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord, 'ready')}
                          className="bg-indigo-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs uppercase tracking-wider hover:bg-indigo-700 transition-colors"
                        >
                          Mark Ready for Pickup
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CATALOG & PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <form onSubmit={handleAddProduct} className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Plus size={16} className="text-emerald-600" /> Add New Item to Shop Catalog
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Item Name (e.g., Farm Tomatoes)"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                >
                  <option value="cat_veg">Vegetables</option>
                  <option value="cat_fruits">Fruits</option>
                  <option value="cat_herbs">Herbs & Leafy</option>
                  <option value="cat_fish">Fish & Seafood</option>
                </select>

                <select
                  value={newProdUnit}
                  onChange={(e) => setNewProdUnit(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                >
                  <option value="kg">per kg</option>
                  <option value="500g">per 500g</option>
                  <option value="bunch">per bunch</option>
                  <option value="piece">per piece</option>
                </select>

                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-2xs"
                >
                  Add Item
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {products.map((prod) => (
                <div key={prod.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <img src={prod.imageUrl} alt={prod.name} className="w-12 h-12 object-cover rounded-xl border border-slate-100" />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">{prod.name}</h4>
                      <p className="text-[11px] text-slate-500 font-bold">
                        ₹{prod.price} / {prod.unit}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleProductStock(prod.id, prod.inStock)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                      prod.inStock
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {prod.inStock ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span>{prod.inStock ? 'In Stock' : 'Out of Stock'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHOP LOCATION & DELIVERY COVERAGE MAP TAB */}
        {activeTab === 'coverage' && (
          <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Shop Location & Delivery Radius</h3>
              <p className="text-xs text-slate-500 font-medium">
                Customers within your delivery coverage radius ({shop?.maxDeliveryDistance || 15} km) can discover and order from your market.
              </p>
            </div>

            <InteractiveMap
              mode="vendor_coverage"
              vendorLocation={{
                id: shop?.id || 'shop_main',
                name: shop?.name || 'Indiranagar Fresh Market',
                lat: shop?.location?.lat || 12.9716,
                lng: shop?.location?.lng || 77.5946,
                coverageRadiusKm: shop?.maxDeliveryDistance || 15,
              }}
              height="320px"
            />
          </div>
        )}

        {/* PAYOUTS TAB */}
        {activeTab === 'settlements' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Settlement & Earnings Summary</h3>
              <p className="text-xs text-slate-500">
                Calculated after platform fee waivers, GST adjustments, and direct delivery commissions.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Shop Sales Payouts</span>
                  <span className="font-black text-emerald-600 text-lg">₹{totalVendorRevenue.toFixed(2)}</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl">
                  <span className="text-[10px] text-amber-800 font-black uppercase tracking-wider block">Delivery Commissions</span>
                  <span className="font-black text-amber-800 text-lg">₹{totalDeliveryEarnings.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
