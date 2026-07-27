import { useState, FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RoleApplication, Role } from '../types';
import { Store, Truck, ArrowLeft, ShieldCheck, CheckCircle2, Sparkles, Building2, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export const BecomePartner = () => {
  const [searchParams] = useSearchParams();
  const targetType = (searchParams.get('type') as 'vendor' | 'delivery') || 'vendor';
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const [businessName, setBusinessName] = useState('');
  const [addressArea, setAddressArea] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!businessName.trim() || !addressArea.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const timestamp = Date.now();
      const appId = `app_${targetType}_${user.uid}_${timestamp}`;

      const applicationDoc: RoleApplication = {
        id: appId,
        userId: user.uid,
        applicantName: user.displayName || user.email || 'Applicant',
        applicantEmail: user.email || '',
        applicantPhone: phone,
        requestedRole: targetType,
        businessOrVehicleName: businessName,
        addressOrArea: addressArea,
        status: 'pending',
        appliedAt: timestamp
      };

      await setDoc(doc(db, 'role_applications', appId), applicationDoc);

      // Create initial Shop record if vendor application
      if (targetType === 'vendor') {
        const shopId = `shop_${user.uid}`;
        await setDoc(doc(db, 'shops', shopId), {
          id: shopId,
          vendorId: user.uid,
          name: businessName,
          description: 'Fresh local farm produce & organic grocery shop',
          logoUrl: 'https://cdn-icons-png.flaticon.com/512/862/862856.png',
          bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80',
          rating: 4.9,
          deliveryTimeMins: 25,
          deliveryFee: 30,
          deliveryAvailable: true,
          freeDeliveryThreshold: 200,
          maxDeliveryDistance: 15,
          status: 'open',
          categories: ['cat_veg', 'cat_fruits'],
          location: { lat: 12.9716, lng: 77.5946, address: addressArea },
          createdAt: timestamp
        });
      }

      setSubmitted(true);
      toast.success('Application submitted for review!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  // Dev Instant Approval Option for Testing Workflows
  const handleDevInstantApprove = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const newRole: Role = targetType === 'vendor' ? 'vendor' : 'delivery';
      
      const currentApprovedRoles = user.roles || [user.role || 'customer'];
      const updatedRoles = Array.from(new Set([...currentApprovedRoles, newRole]));

      await updateDoc(userRef, {
        roles: updatedRoles,
        activeRole: newRole
      });

      setUser({
        ...user,
        roles: updatedRoles,
        activeRole: newRole
      });

      toast.success(`Application approved! Switched to ${targetType.toUpperCase()} App.`);
      if (newRole === 'vendor') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/delivery/dashboard');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to auto-approve role');
    } finally {
      setLoading(false);
    }
  };

  const isVendor = targetType === 'vendor';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-28">
      {/* Header */}
      <div className="bg-white p-6 shadow-2xs flex items-center gap-4 sticky top-0 z-10 border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-900 rounded-full hover:bg-slate-100">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            Become a {isVendor ? 'Vendor Partner' : 'Delivery Partner'}
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Arbeez Fresh Marketplace Network
          </p>
        </div>
        {isVendor ? <Store size={26} className="text-indigo-600" /> : <Truck size={26} className="text-amber-600" />}
      </div>

      <div className="p-4 sm:p-6 max-w-xl mx-auto w-full space-y-6">
        {/* Banner */}
        <div className={`rounded-[28px] p-6 text-white shadow-sm transition-all ${
          isVendor ? 'bg-gradient-to-br from-indigo-900 to-indigo-700' : 'bg-gradient-to-br from-amber-600 to-amber-800'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles size={22} className="text-amber-300 animate-pulse" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
              Partner Registration
            </span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            {isVendor ? 'Grow Your Grocery Business' : 'Earn Money on Every Delivery'}
          </h2>
          <p className="text-xs font-medium text-white/80 mt-1 leading-relaxed">
            {isVendor 
              ? 'Connect directly with thousands of fresh produce customers in Bangalore. Receive verified PayU orders with instant vendor settlements.' 
              : 'Flexible working hours, live GPS order navigation, instant payout reports, and high delivery commission.'}
          </p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-[28px] p-8 border border-slate-200 text-center space-y-4 shadow-2xs">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Application Submitted</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">
              Your application is under review by Arbeez Fresh Admins. You will be notified once approved.
            </p>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                onClick={handleDevInstantApprove}
                disabled={loading}
                className="w-full bg-slate-900 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Instant Approve & Open {isVendor ? 'Vendor App' : 'Delivery App'}</span>
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full bg-slate-100 text-slate-700 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
              >
                Return to Customer App
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-[28px] p-6 border border-slate-200 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 size={16} className="text-slate-400" />
                {isVendor ? 'Shop / Business Name' : 'Full Name & Vehicle Type'}
              </label>
              <input
                type="text"
                required
                placeholder={isVendor ? 'e.g., Organic Green Fresh Farm' : 'e.g., John Doe (Honda Activa)'}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin size={16} className="text-slate-400" />
                {isVendor ? 'Shop Address & Locality' : 'Preferred Delivery Operating Area'}
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Indiranagar 100ft Road, Bangalore"
                value={addressArea}
                onChange={(e) => setAddressArea(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone size={16} className="text-slate-400" />
                Contact Phone Number
              </label>
              <input
                type="tel"
                required
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm"
              >
                {loading ? 'Submitting Application...' : 'Submit Partner Application'}
              </button>

              <button
                type="button"
                onClick={handleDevInstantApprove}
                disabled={loading}
                className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold py-3 rounded-2xl text-xs uppercase tracking-wider hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Instant Test Approval & Switch Role</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
