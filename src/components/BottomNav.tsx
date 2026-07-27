import { Home, Search, ShoppingBag, User, Store, Package, Truck, DollarSign, ListOrdered } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';

export const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const items = useCartStore((state) => state.items);
  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const activeRole = user?.activeRole || user?.role || 'customer';

  let navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: ShoppingBag, label: 'Cart', path: '/cart', badge: cartItemCount },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  if (activeRole === 'vendor') {
    navItems = [
      { icon: Store, label: 'Dashboard', path: '/vendor/dashboard' },
      { icon: Package, label: 'Products', path: '/vendor/dashboard?tab=products' },
      { icon: DollarSign, label: 'Payouts', path: '/vendor/dashboard?tab=settlements' },
      { icon: User, label: 'Profile', path: '/profile' },
    ];
  } else if (activeRole === 'delivery') {
    navItems = [
      { icon: Truck, label: 'Deliveries', path: '/delivery/dashboard' },
      { icon: ListOrdered, label: 'Requests', path: '/delivery/dashboard?tab=requests' },
      { icon: DollarSign, label: 'Earnings', path: '/delivery/dashboard?tab=earnings' },
      { icon: User, label: 'Profile', path: '/profile' },
    ];
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-around items-center h-20 px-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe-area-inset-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full relative ${
              isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className="relative">
              <Icon size={22} className={isActive ? 'fill-current' : ''} />
              {item.badge ? (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-black w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className={`text-[10px] mt-1 uppercase tracking-wide ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
