import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Toaster } from 'react-hot-toast';

export const Layout = () => {
  const location = useLocation();
  // Hide bottom nav on specific screens like checkout or specific shop
  const hideBottomNav = location.pathname.includes('/checkout');

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative overflow-x-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto pb-20">
          <Outlet />
        </div>
        {!hideBottomNav && <BottomNav />}
        <Toaster position="top-center" />
      </div>
    </div>
  );
};
