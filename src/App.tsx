import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthStore } from './store/useAuthStore';
import { User } from './types';
import { Layout } from './components/Layout';
import { AnimatedSplash } from './components/AnimatedSplash';
import { Home } from './screens/Home';
import { ShopDetails } from './screens/ShopDetails';
import { Cart } from './screens/Cart';
import { Profile } from './screens/Profile';
import { Login } from './screens/Login';
import { Checkout } from './screens/Checkout';
import { Receipt } from './screens/Receipt';
import { AdminSetup } from './screens/AdminSetup';
import { Search } from './screens/Search';
import { OrderTracking } from './screens/OrderTracking';
import { BecomePartner } from './screens/BecomePartner';
import { VendorDashboard } from './screens/VendorDashboard';
import { DeliveryDashboard } from './screens/DeliveryDashboard';
import { LegalConsentModal, CURRENT_POLICY_VERSION } from './components/LegalConsentModal';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  const { user, setUser, setLoading, loading } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        localStorage.removeItem('arbeez_guest_user');
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        let userData: User;
        if (userSnap.exists()) {
          userData = userSnap.data() as User;
        } else {
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
          await setDoc(userRef, userData);
        }
        setUser(userData);
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  if (showSplash || loading) {
    return <AnimatedSplash onFinish={() => setShowSplash(false)} />;
  }

  const needsLegalConsent = user && (!user.legalConsent || user.legalConsent.policyVersion !== CURRENT_POLICY_VERSION);

  return (
    <BrowserRouter>
      {/* Global Legal Consent Prompt Gate for existing or newly logged in accounts without recorded v1.0.0 consent */}
      {needsLegalConsent && (
        <LegalConsentModal isOpen={true} />
      )}

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
    </BrowserRouter>
  );
}
