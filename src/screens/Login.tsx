import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { loginWithGoogle, db } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { CURRENT_POLICY_VERSION } from '../components/LegalConsentModal';
import { ShieldCheck, MapPin, Bell, Lock, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import brandLogo from '../assets/logo';

export const Login = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const [notificationConsent, setNotificationConsent] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (user) return <Navigate to="/" />;

  const allConsentsChecked = termsAccepted && privacyAccepted && locationConsent && notificationConsent;

  const handleGoogleLogin = async () => {
    if (!allConsentsChecked) {
      toast.error('Please check and agree to all legal policies and consent permissions.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const loggedUser = await loginWithGoogle();

      const acceptedAt = Date.now();
      const platform = window.navigator.userAgent.includes('Android') ? 'android' : 'web';

      const consentPayload = {
        userId: loggedUser.uid,
        policyVersion: CURRENT_POLICY_VERSION,
        termsAccepted,
        privacyAccepted,
        locationConsent,
        notificationConsent,
        acceptedAt,
        platform
      };

      // Save consent to Firestore
      await setDoc(doc(db, 'users', loggedUser.uid, 'consents', CURRENT_POLICY_VERSION), consentPayload);
      await updateDoc(doc(db, 'users', loggedUser.uid), {
        legalConsent: consentPayload,
        updatedAt: acceptedAt
      }).catch(() => {});

      toast.success('Successfully logged in & legal consent recorded!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to log in. Please try again.');
      console.error(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden p-6 sm:p-10 flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="h-20 mb-4">
          <img src={brandLogo} alt="Arbeez Fresh Logo" className="h-full w-auto object-contain" />
        </div>
        <p className="text-slate-500 font-medium text-xs sm:text-sm mb-6 text-center leading-relaxed">
          Your daily fresh vegetables, fruits & grocery needs,<br/>delivered straight from local farm markets.
        </p>

        {/* Legal Policies Quick Links Box */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-1.5 text-slate-900 font-black text-xs uppercase tracking-wider mb-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Review Arbeez Fresh Legal Documents</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mb-3">
            Please read our policies prior to signing in:
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-extrabold">
            <Link to="/legal/terms" target="_blank" className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 bg-white p-2 rounded-xl border border-slate-200">
              <FileText size={12} className="text-slate-400" />
              <span>Terms & Conditions</span>
            </Link>
            <Link to="/legal/privacy" target="_blank" className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 bg-white p-2 rounded-xl border border-slate-200">
              <Lock size={12} className="text-slate-400" />
              <span>Privacy Policy</span>
            </Link>
            <Link to="/legal/community" target="_blank" className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 bg-white p-2 rounded-xl border border-slate-200">
              <CheckCircle2 size={12} className="text-slate-400" />
              <span>Community Guidelines</span>
            </Link>
            <Link to="/legal/refund" target="_blank" className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 bg-white p-2 rounded-xl border border-slate-200">
              <FileText size={12} className="text-slate-400" />
              <span>Refund & Cancellation</span>
            </Link>
            <Link to="/legal/delivery" target="_blank" className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 bg-white p-2 rounded-xl border border-slate-200">
              <FileText size={12} className="text-slate-400" />
              <span>Delivery Policy</span>
            </Link>
            <Link to="/legal/cookies" target="_blank" className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 bg-white p-2 rounded-xl border border-slate-200">
              <Lock size={12} className="text-slate-400" />
              <span>Data Usage & Cookies</span>
            </Link>
          </div>
        </div>

        {/* Mandatory Checkboxes */}
        <div className="w-full space-y-2.5 mb-6 text-left">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Mandatory Consents Required</span>

          <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
            termsAccepted ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <input 
              type="checkbox" 
              checked={termsAccepted} 
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 leading-tight">
              I have read and agree to the <Link to="/legal/terms" target="_blank" className="text-emerald-600 underline">Terms & Conditions</Link>.
            </span>
          </label>

          <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
            privacyAccepted ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <input 
              type="checkbox" 
              checked={privacyAccepted} 
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 leading-tight">
              I agree to the <Link to="/legal/privacy" target="_blank" className="text-emerald-600 underline">Privacy Policy</Link>.
            </span>
          </label>

          <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
            locationConsent ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <input 
              type="checkbox" 
              checked={locationConsent} 
              onChange={(e) => setLocationConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
              <MapPin size={12} className="text-emerald-600 shrink-0" />
              I allow Arbeez Fresh to use my location to discover nearby shops and provide delivery services.
            </span>
          </label>

          <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
            notificationConsent ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <input 
              type="checkbox" 
              checked={notificationConsent} 
              onChange={(e) => setNotificationConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
              <Bell size={12} className="text-emerald-600 shrink-0" />
              I allow Arbeez Fresh to send order updates and important notifications.
            </span>
          </label>
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={!allConsentsChecked || isLoggingIn}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 border border-slate-900 rounded-2xl px-6 py-4 text-white font-black uppercase tracking-wide hover:bg-slate-800 transition-all disabled:opacity-40 shadow-md cursor-pointer"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
          <span>{isLoggingIn ? 'Signing in...' : 'Sign in with Google'}</span>
        </button>

        {!allConsentsChecked && (
          <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider mt-3 text-center">
            ⚠️ Check all 4 checkboxes above to enable sign-in.
          </p>
        )}
      </div>
    </div>
  );
};
