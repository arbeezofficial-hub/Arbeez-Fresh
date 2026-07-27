import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { ShieldCheck, Lock, MapPin, Bell, FileText, Check, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface LegalConsentModalProps {
  onAccepted?: () => void;
  isOpen: boolean;
}

export const CURRENT_POLICY_VERSION = 'v1.0.0';

export const LegalConsentModal = ({ onAccepted, isOpen }: LegalConsentModalProps) => {
  const { user, setUser } = useAuthStore();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const [notificationConsent, setNotificationConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen || !user) return null;

  const allRequiredChecked = termsAccepted && privacyAccepted && locationConsent && notificationConsent;

  const handleAcceptAll = async () => {
    if (!allRequiredChecked) {
      toast.error('Please accept all required agreements & consents to continue.');
      return;
    }

    setSaving(true);
    try {
      const acceptedAt = Date.now();
      const platform = window.navigator.userAgent.includes('Android') ? 'android' : 'web';

      const consentPayload = {
        userId: user.uid,
        policyVersion: CURRENT_POLICY_VERSION,
        termsAccepted,
        privacyAccepted,
        locationConsent,
        notificationConsent,
        acceptedAt,
        platform
      };

      // Store in subcollection
      const consentRef = doc(db, 'users', user.uid, 'consents', CURRENT_POLICY_VERSION);
      await setDoc(consentRef, consentPayload);

      // Also update user profile with primary legalConsent status
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        legalConsent: consentPayload,
        updatedAt: acceptedAt
      });

      // Update local state
      setUser({
        ...user,
        legalConsent: consentPayload
      });

      toast.success('Legal consents recorded successfully!');
      if (onAccepted) onAccepted();
    } catch (error) {
      console.error('Error saving consents:', error);
      toast.error('Failed to save legal consents. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto font-sans">
        
        {/* Header */}
        <div className="text-center mb-6 space-y-2">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Terms & Legal Consents</h2>
          <p className="text-xs text-slate-500 font-medium">
            Please review and accept our mandatory policies and permissions to use Arbeez Fresh ({CURRENT_POLICY_VERSION}).
          </p>
        </div>

        {/* Clickable Quick Links */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-6">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Review Full Legal Documents</span>
          <div className="grid grid-cols-2 gap-2 text-xs font-black">
            <a href="/legal/terms" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 bg-white p-2 rounded-xl border border-slate-200">
              <FileText size={14} className="text-slate-400" />
              <span>Terms & Conditions</span>
              <ExternalLink size={10} className="ml-auto text-slate-400" />
            </a>
            <a href="/legal/privacy" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 bg-white p-2 rounded-xl border border-slate-200">
              <Lock size={14} className="text-slate-400" />
              <span>Privacy Policy</span>
              <ExternalLink size={10} className="ml-auto text-slate-400" />
            </a>
            <a href="/legal/refund" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 bg-white p-2 rounded-xl border border-slate-200">
              <FileText size={14} className="text-slate-400" />
              <span>Refunds & Returns</span>
              <ExternalLink size={10} className="ml-auto text-slate-400" />
            </a>
            <a href="/legal/delivery" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 bg-white p-2 rounded-xl border border-slate-200">
              <FileText size={14} className="text-slate-400" />
              <span>Delivery Policy</span>
              <ExternalLink size={10} className="ml-auto text-slate-400" />
            </a>
          </div>
        </div>

        {/* Checkboxes List */}
        <div className="space-y-3 mb-6">
          {/* Checkbox 1: Terms */}
          <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
            termsAccepted ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <input 
              type="checkbox" 
              checked={termsAccepted} 
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-extrabold text-slate-900 block mb-0.5">I have read and agree to the Terms & Conditions</span>
              <p className="text-slate-500 font-medium text-[11px] leading-tight">Covers user responsibilities, marketplace rules, and payment policies.</p>
            </div>
          </label>

          {/* Checkbox 2: Privacy Policy */}
          <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
            privacyAccepted ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <input 
              type="checkbox" 
              checked={privacyAccepted} 
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-extrabold text-slate-900 block mb-0.5">I agree to the Privacy Policy</span>
              <p className="text-slate-500 font-medium text-[11px] leading-tight">Explains data collection, Google Sign-In, and PayU transaction security.</p>
            </div>
          </label>

          {/* Checkbox 3: Location Consent */}
          <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
            locationConsent ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <input 
              type="checkbox" 
              checked={locationConsent} 
              onChange={(e) => setLocationConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-extrabold text-slate-900 flex items-center gap-1 mb-0.5">
                <MapPin size={12} className="text-emerald-600" />
                Location Access Consent
              </span>
              <p className="text-slate-500 font-medium text-[11px] leading-tight">I allow Arbeez Fresh to use my location to discover nearby shops and provide delivery services.</p>
            </div>
          </label>

          {/* Checkbox 4: Notification Consent */}
          <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
            notificationConsent ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <input 
              type="checkbox" 
              checked={notificationConsent} 
              onChange={(e) => setNotificationConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-extrabold text-slate-900 flex items-center gap-1 mb-0.5">
                <Bell size={12} className="text-emerald-600" />
                Notification Access Consent
              </span>
              <p className="text-slate-500 font-medium text-[11px] leading-tight">I allow Arbeez Fresh to send order updates, live delivery tracking, and important alerts.</p>
            </div>
          </label>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAcceptAll}
          disabled={!allRequiredChecked || saving}
          className="w-full bg-slate-900 text-white font-black uppercase tracking-wider py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-md cursor-pointer"
        >
          {saving ? 'Recording Consent...' : (
            <>
              <Check size={18} />
              <span>Accept & Continue to App</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
