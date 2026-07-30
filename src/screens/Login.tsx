import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { loginWithGoogle, loginAnonymously, db } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { CURRENT_POLICY_VERSION, LegalConsentModal } from '../components/LegalConsentModal';
import { ShieldCheck, MapPin, Bell, AlertTriangle, Copy, Check, UserCheck, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import brandLogo from '../assets/logo';

export const Login = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const [notificationConsent, setNotificationConsent] = useState(false);
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [unauthorizedDomainError, setUnauthorizedDomainError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (user) return <Navigate to="/" />;

  const allConsentsChecked = termsAccepted && privacyAccepted && dataConsent && locationConsent && notificationConsent;

  const recordConsent = async (uid: string) => {
    const acceptedAt = Date.now();
    const platform = window.navigator.userAgent.includes('Android') ? 'android' : 
                    window.navigator.userAgent.includes('iPhone') || window.navigator.userAgent.includes('iPad') ? 'ios' : 'web';

    const consentPayload = {
      userId: uid,
      policyVersion: CURRENT_POLICY_VERSION,
      termsAccepted,
      privacyAccepted,
      dataConsent,
      locationConsent,
      notificationConsent,
      acceptedAt,
      platform,
      appVersion: '1.0.0'
    };

    try {
      await setDoc(doc(db, 'users', uid, 'consents', CURRENT_POLICY_VERSION), consentPayload);
      await updateDoc(doc(db, 'users', uid), {
        legalConsent: consentPayload,
        updatedAt: acceptedAt
      }).catch(() => {});
    } catch (e) {
      console.warn("Consent recording notice:", e);
    }
  };

  const handleGoogleLogin = async () => {
    if (!allConsentsChecked) {
      toast.error('Please check and agree to all 5 legal policies and consent permissions.');
      return;
    }

    setIsLoggingIn(true);
    setUnauthorizedDomainError(null);

    try {
      const loggedUser = await loginWithGoogle();
      await recordConsent(loggedUser.uid);
      toast.success('Successfully logged in & legal consent recorded!');
      navigate('/');
    } catch (error: any) {
      console.error("Login error:", error);
      if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        setUnauthorizedDomainError(domain);
        toast.error('Google Auth domain not authorized in Firebase Console.');
      } else {
        toast.error(error?.message || 'Failed to log in with Google. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoGuestLogin = async () => {
    if (!allConsentsChecked) {
      toast.error('Please check and agree to all 5 legal policies and consent permissions.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const loggedUid: string = 'guest-' + Date.now();

      const acceptedAt = Date.now();
      const platform = window.navigator.userAgent.includes('Android') ? 'android' : 
                      window.navigator.userAgent.includes('iPhone') || window.navigator.userAgent.includes('iPad') ? 'ios' : 'web';

      const consentPayload = {
        userId: loggedUid,
        policyVersion: CURRENT_POLICY_VERSION,
        termsAccepted,
        privacyAccepted,
        dataConsent,
        locationConsent,
        notificationConsent,
        acceptedAt,
        platform,
        appVersion: '1.0.0'
      };

      const guestUser: any = {
        uid: loggedUid,
        email: 'guest@arbeezfresh.local',
        displayName: 'Guest / Demo User',
        photoURL: null,
        phoneNumber: null,
        role: 'customer',
        roles: ['customer'],
        activeRole: 'customer',
        legalConsent: consentPayload,
        createdAt: acceptedAt,
      };

      try {
        await setDoc(doc(db, 'users', loggedUid, 'consents', CURRENT_POLICY_VERSION), consentPayload);
        await setDoc(doc(db, 'users', loggedUid), guestUser, { merge: true });
      } catch (dbErr) {
        console.warn("Guest firestore record notice:", dbErr);
      }

      localStorage.setItem('arbeez_guest_user', JSON.stringify(guestUser));
      useAuthStore.getState().setUser(guestUser);

      toast.success('Welcome! Logged in as Demo / Guest user.');
      navigate('/');
    } catch (error: any) {
      console.error("Guest login error:", error);
      toast.error('Failed to start guest session.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCopyDomain = () => {
    const domain = unauthorizedDomainError || window.location.hostname;
    navigator.clipboard.writeText(domain);
    setCopiedDomain(true);
    toast.success('Domain copied to clipboard!');
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 sm:p-10 flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="h-20 mb-4">
          <img src={brandLogo} alt="Arbeez Fresh Logo" className="h-full w-auto object-contain" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm mb-6 text-center leading-relaxed">
          Your daily fresh vegetables, fruits & grocery needs,<br/>delivered straight from local farm markets.
        </p>

        {/* Legal Policies Single Screen Modal Launcher Box */}
        <div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-black text-xs uppercase tracking-wider">
              <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
              <span>Arbeez Fresh Legal Documents</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3">
            Review all policies in one place before signing in or creating an account.
          </p>

          <button
            onClick={() => setShowLegalModal(true)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-slate-400 transition-all cursor-pointer shadow-sm"
          >
            <span>Review Terms, Privacy & All Policies</span>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Unauthorized Domain Alert Banner if Google Auth throws auth/unauthorized-domain */}
        {unauthorizedDomainError && (
          <div className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 mb-6 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300 font-bold text-xs mb-2">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm">Firebase Domain Authorization Required</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-normal">
                  Google Auth prevents sign-in from unauthorized domains. Add this host in Firebase Console:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 my-2">
              <code className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate flex-1">
                {unauthorizedDomainError}
              </code>
              <button
                onClick={handleCopyDomain}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors shrink-0"
              >
                {copiedDomain ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mb-3">
              Go to <strong>Firebase Console → Authentication → Settings → Authorized domains</strong> and add this domain.
            </p>

            <button
              onClick={handleDemoGuestLogin}
              disabled={!allConsentsChecked || isLoggingIn}
              className="w-full py-2.5 px-4 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserCheck size={16} />
              <span>Or Continue via Guest / Demo Login</span>
            </button>
          </div>
        )}

        {/* Mandatory Checkboxes */}
        <div className="w-full space-y-2.5 mb-6 text-left">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block px-1">Mandatory Consents Required</span>

          <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
            termsAccepted ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}>
            <input 
              type="checkbox" 
              checked={termsAccepted} 
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
              I have read and agree to the <button onClick={() => setShowLegalModal(true)} className="text-emerald-600 dark:text-emerald-400 underline font-extrabold">Terms & Conditions</button>.
            </span>
          </label>

          <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
            privacyAccepted ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}>
            <input 
              type="checkbox" 
              checked={privacyAccepted} 
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
              I have read and agree to the <button onClick={() => setShowLegalModal(true)} className="text-emerald-600 dark:text-emerald-400 underline font-extrabold">Privacy Policy</button>.
            </span>
          </label>

          <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
            dataConsent ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}>
            <input 
              type="checkbox" 
              checked={dataConsent} 
              onChange={(e) => setDataConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
              I understand how Arbeez Fresh uses my data.
            </span>
          </label>

          <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
            notificationConsent ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}>
            <input 
              type="checkbox" 
              checked={notificationConsent} 
              onChange={(e) => setNotificationConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight flex items-center gap-1">
              <Bell size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              I agree to receive important order and account notifications.
            </span>
          </label>

          <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
            locationConsent ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}>
            <input 
              type="checkbox" 
              checked={locationConsent} 
              onChange={(e) => setLocationConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight flex items-center gap-1">
              <MapPin size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              I allow location access to discover nearby shops and enable delivery services.
            </span>
          </label>
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={!allConsentsChecked || isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-emerald-600 border border-slate-900 dark:border-emerald-600 rounded-2xl px-6 py-4 text-white font-black uppercase tracking-wide hover:bg-slate-800 dark:hover:bg-emerald-700 transition-all disabled:opacity-40 shadow-md cursor-pointer"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
            <span>{isLoggingIn ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>

          <button
            onClick={handleDemoGuestLogin}
            disabled={!allConsentsChecked || isLoggingIn}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-3 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wide hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-40 cursor-pointer"
          >
            <UserCheck size={16} />
            <span>Continue as Guest / Demo User</span>
          </button>
        </div>

        {!allConsentsChecked && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider mt-3 text-center">
            ⚠️ Check all 5 mandatory checkboxes above to enable sign-in.
          </p>
        )}
      </div>

      {/* Legal Consent Modal Single Screen */}
      <LegalConsentModal 
        isOpen={showLegalModal} 
        onClose={() => setShowLegalModal(false)}
        onAccepted={() => {
          setTermsAccepted(true);
          setPrivacyAccepted(true);
          setDataConsent(true);
          setNotificationConsent(true);
          setLocationConsent(true);
          setShowLegalModal(false);
        }}
      />
    </div>
  );
};

