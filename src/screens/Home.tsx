import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shop, Category } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Search, Star, Clock, AlertCircle, Sparkles, Navigation, Map as MapIcon, List, Fish, Carrot, ShoppingCart, ShieldCheck } from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';
import { NotificationCenter } from '../components/NotificationCenter';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { InteractiveMap } from '../components/InteractiveMap';
import { filterAndSortShopsByDistance, classifyShopType } from '../services/location.service';
import brandLogo from '../assets/logo';
import { PermissionExplanationModal } from '../components/PermissionExplanationModal';

export const Home = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'fish_market' | 'vegetable_shop' | 'grocery_store'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showLocationRationale, setShowLocationRationale] = useState(false);

  const { address, city, pinCode, lat, lng, isDetecting, detectCurrentLocation } = useLocationStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shopsRef = collection(db, 'shops');
        const shopsQuery = query(shopsRef, where('status', '==', 'open'), limit(15));
        const shopsSnapshot = await getDocs(shopsQuery);
        const shopList = shopsSnapshot.docs.map((doc) => doc.data() as Shop);

        setShops(shopList);

        const categoriesRef = collection(db, 'categories');
        const categoriesQuery = query(categoriesRef, where('status', '==', 'active'));
        const categoriesSnapshot = await getDocs(categoriesQuery);
        setCategories(categoriesSnapshot.docs.map((doc) => doc.data() as Category));
      } catch (error) {
        console.error('Error fetching home data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRequestLocation = async () => {
    setShowLocationRationale(true);
  };

  const confirmAndDetectLocation = async () => {
    setShowLocationRationale(false);
    await detectCurrentLocation();
  };

  // Filter & Sort Shops by distance from user location
  const userLat = lat || 12.9716;
  const userLng = lng || 77.5946;

  const sortedShops = filterAndSortShopsByDistance(shops, userLat, userLng);

  const filteredShops = sortedShops.filter((shop) => {
    if (selectedCategoryFilter === 'all') return true;
    return classifyShopType(shop) === selectedCategoryFilter;
  });

  // Map markers preparation
  const shopMarkers = filteredShops.map((shop) => ({
    id: shop.id,
    name: shop.name,
    lat: shop.location?.lat || 12.9716,
    lng: shop.location?.lng || 77.5946,
    address: shop.location?.address,
    type: classifyShopType(shop),
    coverageRadiusKm: shop.maxDeliveryDistance || 15,
  }));

  if (loading) {
    return (
      <div className="flex flex-col space-y-4 p-4 animate-pulse font-sans bg-slate-50 min-h-screen">
        <div className="h-20 bg-slate-200 rounded-2xl w-full"></div>
        <div className="h-28 bg-slate-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-full font-sans text-slate-900 pb-28">
      {/* Top Sticky Header */}
      <div className="bg-white p-5 shadow-2xs sticky top-0 z-20 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="h-9">
            <img src={brandLogo} alt="Arbeez Fresh Logo" className="h-full w-auto object-contain" />
          </div>

          <div className="flex items-center gap-2">
            <NotificationCenter />
            <RoleSwitcher />
          </div>
        </div>

        {/* GPS Location Bar */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-2xl mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
              <MapPin size={16} />
            </div>
            <div className="truncate">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Deliver To</span>
              <p className="text-xs font-black text-slate-900 truncate">{address}</p>
            </div>
          </div>

          <button
            onClick={handleRequestLocation}
            disabled={isDetecting}
            className="bg-slate-900 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <Navigation size={13} className={isDetecting ? 'animate-spin' : ''} />
            <span>{isDetecting ? 'Locating...' : 'Update GPS'}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div onClick={() => navigate('/search')} className="relative cursor-pointer">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <div className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-extrabold text-slate-400">
            Search fish markets, fresh vegetables, fruits & grocery stores...
          </div>
        </div>
      </div>

      {/* Location & Notification Permission Modal Rationale */}
      <PermissionExplanationModal
        isOpen={showLocationRationale}
        onClose={() => setShowLocationRationale(false)}
        onSuccess={() => {
          detectCurrentLocation();
        }}
      />

      {/* Arbeez Fresh Plus Membership Subscription Banner */}
      <div className="px-4 sm:px-6 pt-4">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 rounded-[28px] p-5 text-white shadow-md border border-emerald-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Active Offer
              </span>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles size={12} /> Arbeez Fresh Plus
              </span>
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight">FREE Delivery & 0 Platform Fees</h3>
            <p className="text-[11px] font-medium text-slate-300">Enjoy unlimited zero delivery fees on orders above ₹200.</p>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Slider */}
      {categories.length > 0 && (
        <div className="p-4 sm:p-6 bg-white mt-4 border-y border-slate-100">
          <h2 className="font-black text-slate-900 mb-4 uppercase tracking-tight text-sm">Explore Categories</h2>
          <div className="flex overflow-x-auto gap-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => navigate(`/search?category=${category.id}`)}
                className="flex flex-col items-center flex-shrink-0 w-20 cursor-pointer group"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden mb-2 p-2 shadow-2xs border border-slate-100 group-hover:border-emerald-300 transition-all">
                  <img src={category.imageUrl} alt={category.name} className="w-full h-full object-contain" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wide text-center text-slate-700 leading-tight">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Markets Section with Filter Tabs & Map Toggle */}
      <div className="px-4 sm:px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg text-slate-900 uppercase tracking-tight">Nearby Fresh Markets</h2>
            <p className="text-[11px] text-slate-500 font-bold">Sorted by proximity to {city || 'your area'}</p>
          </div>

          <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${
                viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500'
              }`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${
                viewMode === 'map' ? 'bg-slate-900 text-white' : 'text-slate-500'
              }`}
            >
              <MapIcon size={16} />
            </button>
          </div>
        </div>

        {/* Specialized Market Type Filter Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-1 [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
              selectedCategoryFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Markets ({sortedShops.length})
          </button>

          <button
            onClick={() => setSelectedCategoryFilter('fish_market')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              selectedCategoryFilter === 'fish_market'
                ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50'
            }`}
          >
            <Fish size={14} /> Fish Markets
          </button>

          <button
            onClick={() => setSelectedCategoryFilter('vegetable_shop')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              selectedCategoryFilter === 'vegetable_shop'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <Carrot size={14} /> Vegetable Shops
          </button>

          <button
            onClick={() => setSelectedCategoryFilter('grocery_store')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              selectedCategoryFilter === 'grocery_store'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            <ShoppingCart size={14} /> Grocery Stores
          </button>
        </div>

        {/* View Mode: Map vs List */}
        {viewMode === 'map' ? (
          <div className="space-y-3">
            <InteractiveMap
              mode="customer_discovery"
              userLocation={{ lat: userLat, lng: userLng }}
              shops={shopMarkers}
              onSelectShop={(shopId) => navigate(`/shop/${shopId}`)}
              height="380px"
            />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
              Tap any market marker on the map to view inventory & place an order.
            </p>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="bg-white rounded-[28px] p-8 text-center shadow-2xs border border-slate-200 space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight">No Stores Found</h3>
              <p className="text-slate-500 text-xs font-medium">No active markets matched your selected filter nearby.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredShops.map((shop) => (
              <Link
                to={`/shop/${shop.id}`}
                key={shop.id}
                className="bg-white rounded-[28px] p-5 border border-slate-200 flex flex-col gap-3 transition-all hover:border-emerald-300 shadow-2xs block"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                      <img src={shop.logoUrl || shop.bannerUrl} alt={shop.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900 leading-tight mb-1">{shop.name}</h3>
                      <p className="text-slate-500 font-medium text-xs line-clamp-1">{shop.description}</p>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 block">
                        📍 {shop.distanceKm} km away • {shop.location?.address || 'Indiranagar Market'}
                      </span>
                    </div>
                  </div>

                  <span className="font-extrabold text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                    <Star size={12} className="fill-amber-400" /> {shop.rating}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[10px] font-black uppercase tracking-wider">
                  <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1">
                    <Clock size={12} /> {shop.estimatedMins} MINS
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl">
                    ₹{shop.deliveryFee} DELIVERY
                  </span>
                  {shop.freeDeliveryThreshold && (
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl">
                      FREE over ₹{shop.freeDeliveryThreshold}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
