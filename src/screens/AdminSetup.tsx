import { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { fetchPlatformSettings } from '../services/paymentEngine';

import { Loader } from '../components/Loader';

export const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [platformFee, setPlatformFee] = useState<number>(9.00);
  const [processingFee, setProcessingFee] = useState<number>(9.00);
  const [gstRate, setGstRate] = useState<number>(5.0);

  useEffect(() => {
    async function loadSettings() {
      const current = await fetchPlatformSettings();
      setPlatformFee(current.platformFee);
      setProcessingFee(current.paymentProcessingFee);
      setGstRate(current.gstRate);
    }
    loadSettings();
  }, []);

  const handleUpdateSettings = async () => {
    setLoading(true);
    try {
      const settingsRef = doc(db, 'settings', 'platform_config');
      await setDoc(settingsRef, {
        id: 'platform_config',
        platformFee: Number(platformFee),
        paymentProcessingFee: Number(processingFee),
        gstRate: Number(gstRate),
        otherPlatformCharges: 0,
        updatedAt: Date.now()
      });
      toast.success('Platform Fees & Tax Settings updated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update platform settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setLoading(true);
    try {
      // 0. Seed Platform Config Settings
      const settingsRef = doc(db, 'settings', 'platform_config');
      await setDoc(settingsRef, {
        id: 'platform_config',
        platformFee: 9.00,
        paymentProcessingFee: 9.00,
        gstRate: 5.0,
        otherPlatformCharges: 0,
        updatedAt: Date.now()
      });

      // 1. Create Categories
      const categories = [
        { id: 'cat_veg', name: 'Vegetables', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2329/2329903.png', status: 'active' },
        { id: 'cat_fruits', name: 'Fruits', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3194/3194591.png', status: 'active' },
        { id: 'cat_fish', name: 'Fish & Meat', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2821/2821808.png', status: 'active' },
        { id: 'cat_dairy', name: 'Dairy', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3014/3014419.png', status: 'active' },
      ];

      for (const cat of categories) {
        await setDoc(doc(collection(db, 'categories'), cat.id), cat);
      }

      // 2. Create a Shop
      const shopId = 'shop_test_01';
      const shop = {
        id: shopId,
        vendorId: 'vendor_01',
        name: 'Arbeez Fresh Hub',
        description: 'Fresh vegetables and fruits sourced directly from farms.',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/3143/3143160.png',
        bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000',
        rating: 4.8,
        deliveryTimeMins: 30,
        deliveryFee: 40,
        deliveryAvailable: true,
        freeDeliveryThreshold: 200, // Free delivery on orders >= ₹200
        maxDeliveryDistance: 15,
        status: 'open',
        categories: ['cat_veg', 'cat_fruits'],
        location: { lat: 12.9716, lng: 77.5946, address: 'Bangalore, India' },
        createdAt: Date.now()
      };
      await setDoc(doc(collection(db, 'shops'), shopId), shop);

      // 3. Create Products for the shop
      const products = [
        {
          id: 'prod_01',
          shopId: shopId,
          categoryId: 'cat_veg',
          name: 'Fresh Tomatoes',
          description: 'Farm fresh red tomatoes',
          price: 45,
          originalPrice: 60,
          imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=500',
          inStock: true,
          quantityAvailable: 100,
          unit: 'kg',
          createdAt: Date.now()
        },
        {
          id: 'prod_02',
          shopId: shopId,
          categoryId: 'cat_veg',
          name: 'Onions',
          description: 'Premium grade onions',
          price: 35,
          imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=500',
          inStock: true,
          quantityAvailable: 200,
          unit: 'kg',
          createdAt: Date.now()
        },
        {
          id: 'prod_03',
          shopId: shopId,
          categoryId: 'cat_fruits',
          name: 'Bananas',
          description: 'Sweet yellow bananas',
          price: 60,
          imageUrl: 'https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?auto=format&fit=crop&q=80&w=500',
          inStock: true,
          quantityAvailable: 50,
          unit: 'dozen',
          createdAt: Date.now()
        }
      ];

      for (const prod of products) {
        await setDoc(doc(collection(db, 'products'), prod.id), prod);
      }

      toast.success('Database & Settings seeded successfully!');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Failed to seed database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-left space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Admin & Dev Tools</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage global marketplace payment fees and initialize database records.
          </p>
        </div>

        {/* Platform Settings Configuration Form */}
        <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Firestore Platform Fees Settings</h3>
          
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Platform Fee (₹)</label>
            <input 
              type="number" 
              value={platformFee} 
              onChange={(e) => setPlatformFee(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Payment Processing Fee (₹)</label>
            <input 
              type="number" 
              value={processingFee} 
              onChange={(e) => setProcessingFee(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">GST Rate (%)</label>
            <input 
              type="number" 
              value={gstRate} 
              onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
            />
          </div>

          <button
            onClick={handleUpdateSettings}
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wide hover:bg-slate-800 transition-colors"
          >
            Save Fee Settings to Firestore
          </button>
        </div>

        <button
          onClick={handleSeedData}
          disabled={loading}
          className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors uppercase tracking-wide text-sm shadow-sm flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <Loader size="sm" color="white" />
              Seeding...
            </>
          ) : (
            'Populate Sample Database & Settings'
          )}
        </button>
      </div>
    </div>
  );
};

