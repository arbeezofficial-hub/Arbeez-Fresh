import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthStore } from './store/useAuthStore';
import { User } from './types';
import { Layout } from './components/Layout';
import { AnimatedSplash } from './components/AnimatedSplash';
import { LegalConsentModal, CURRENT_POLICY_VERSION } from './components/LegalConsentModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader } from './components/Loader';

// Lazy-loaded screens
const Home = lazy(() => import('./screens/Home').then(module => ({ default: module.Home })));
const ShopDetails = lazy(() => import('./screens/ShopDetails').then(module => ({ default: module.ShopDetails })));
const Cart = lazy(() => import('./screens/Cart').then(module => ({ default: module.Cart })));
const Profile = lazy(() => import('./screens/Profile').then(module => ({ default: module.Profile })));
const Login = lazy(() => import('./screens/Login').then(module => ({ default: module.Login })));
const Checkout = lazy(() => import('./screens/Checkout').then(module => ({ default: module.Checkout })));
const Receipt = lazy(() => import('./screens/Receipt').then(module => ({ default: module.Receipt })));
const AdminSetup = lazy(() => import('./screens/AdminSetup').then(module => ({ default: module.AdminSetup })));
const Search = lazy(() => import('./screens/Search').then(module => ({ default: module.Search })));
const OrderTracking = lazy(() => import('./screens/OrderTracking').then(module => ({ default: module.OrderTracking })));
const BecomePartner = lazy(() => import('./screens/BecomePartner').then(module => ({ default: module.BecomePartner })));
const VendorDashboard = lazy(() => import('./screens/VendorDashboard').then(module => ({ default: module.VendorDashboard })));
const DeliveryDashboard = lazy(() => import('./screens/DeliveryDashboard').then(module => ({ default: module.DeliveryDashboard })));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <Loader size="lg" color="primary" />
  </div>
);

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-[9999] font-bold text-sm shadow-md animate-in slide-in-from-top">
      No internet connection. Please check your network.
    </div>
  );
};

export default function App() {
  const { user, setUser, setLoading, loading } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[Auth] onAuthStateChanged triggered. User:", firebaseUser?.uid || 'null');
      try {
        if (firebaseUser) {
          localStorage.removeItem('arbeez_guest_user');
          const userRef = doc(db, 'users', firebaseUser.uid);
          try {
            console.log("[Firestore Read] Fetching user profile...");
            const userSnap = await getDoc(userRef);
            let userData: User;
            
            if (userSnap.exists()) {
              console.log("[Firestore Read] Profile found.");
              userData = userSnap.data() as User;
            } else {
              console.log("[Firestore Write] Profile not found. Creating...");
              userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                phoneNumber: firebaseUser.phoneNumber,
                role: 'customer',
                roles: ['customer'],
                activeRole: 'customer',
                createdAt: Date.now(),
              };
              await setDoc(userRef, userData, { merge: true }).catch(console.warn);
              console.log("[Firestore Write] Profile created.");
            }
            setUser(userData);
          } catch (error: any) {
            if (error?.message?.includes('offline') || error?.code === 'unavailable') {
              console.warn("Client is offline, using fallback user state.");
            } else {
              console.error("Error fetching user data:", error);
            }
            // Fallback if offline
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              phoneNumber: firebaseUser.phoneNumber,
              role: 'customer',
              roles: ['customer'],
              activeRole: 'customer',
              createdAt: Date.now(),
            } as User);
          }
        } else {
          const localGuest = localStorage.getItem('arbeez_guest_user');
          if (localGuest) {
            try {
              setUser(JSON.parse(localGuest));
            } catch (e) {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  if (showSplash || loading) {
    return <AnimatedSplash onFinish={() => setShowSplash(false)} />;
  }

  const needsLegalConsent = user && (!user.legalConsent || user.legalConsent.policyVersion !== CURRENT_POLICY_VERSION);

  return (
    <ErrorBoundary>
      <OfflineIndicator />
      <BrowserRouter>
        {needsLegalConsent && (
          <LegalConsentModal isOpen={true} />
        )}
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin/setup" element={<AdminSetup />} />
            
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/shop/:id" element={<ShopDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/receipt/:id" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />
              <Route path="/order-tracking/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
              <Route path="/become-partner" element={<ProtectedRoute><BecomePartner /></ProtectedRoute>} />
              <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
              <Route path="/delivery/dashboard" element={<ProtectedRoute><DeliveryDashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
