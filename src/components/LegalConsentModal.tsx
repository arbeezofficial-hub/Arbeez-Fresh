import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { ShieldCheck, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface LegalConsentModalProps {
  onAccepted?: () => void;
  onClose?: () => void;
  isOpen: boolean;
}

export const CURRENT_POLICY_VERSION = 'v1.1.0';

const LEGAL_SECTIONS = [
  {
    title: 'Terms & Conditions',
    content: `Welcome to Arbeez Fresh. By accessing or using our application, you agree to be bound by these terms. 
You must be at least 18 years old to use our services. You agree to provide accurate information when creating an account and placing orders. 
We reserve the right to suspend or terminate accounts that violate our terms or engage in fraudulent activities.`
  },
  {
    title: 'Privacy Policy',
    content: `Your privacy is important to us. We collect personal information such as your name, email, phone number, and delivery address to fulfill your orders.
We do not sell your personal data to third parties. We may share necessary information with our delivery partners and vendors strictly for the purpose of completing your order.
Your payment information is securely processed by our authorized payment gateways.`
  },
  {
    title: 'Community Guidelines',
    content: `Arbeez Fresh is a community of local vendors, delivery partners, and customers.
We expect all users to communicate respectfully. Harassment, abuse, or inappropriate language towards our staff, delivery partners, or vendors will not be tolerated and may result in immediate account termination.
Please ensure someone is available to receive your delivery at the specified address.`
  },
  {
    title: 'Refund & Cancellation Policy',
    content: `Orders can be cancelled before they are accepted by the vendor for a full refund.
Once an order is accepted and being prepared, cancellations may incur a fee. 
If you receive damaged or incorrect items, please contact customer support within 24 hours of delivery with photos of the items. Refunds for valid claims will be processed within 5-7 business days.`
  },
  {
    title: 'Delivery Policy',
    content: `We strive to deliver your orders within the estimated time frame shown at checkout. 
Delivery times may vary based on weather, traffic, and vendor preparation time.
You can track your delivery partner in real-time through the app once the order is picked up. 
If a delivery cannot be completed due to an incorrect address or unreachable customer, the order may be cancelled without a refund.`
  },
  {
    title: 'Data Usage & Cookie Policy',
    content: `We use cookies and similar tracking technologies to track activity on our app and store certain information.
This helps us improve our service, remember your preferences, and provide a personalized experience.
By using Arbeez Fresh, you consent to our use of these tracking technologies as described in this policy.`
  }
];

export const LegalConsentModal = ({ onAccepted, onClose, isOpen }: LegalConsentModalProps) => {
  const { user, setUser } = useAuthStore();

  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  
  const hasLatestConsent = user?.legalConsent?.policyVersion === CURRENT_POLICY_VERSION;

  const [termsAccepted, setTermsAccepted] = useState(hasLatestConsent ? (user?.legalConsent?.termsAccepted ?? false) : false);
  const [privacyAccepted, setPrivacyAccepted] = useState(hasLatestConsent ? (user?.legalConsent?.privacyAccepted ?? false) : false);
  const [dataConsent, setDataConsent] = useState(hasLatestConsent ? (user?.legalConsent?.dataConsent ?? false) : false);
  const [notificationConsent, setNotificationConsent] = useState(hasLatestConsent ? (user?.legalConsent?.notificationConsent ?? false) : false);
  const [locationConsent, setLocationConsent] = useState(hasLatestConsent ? (user?.legalConsent?.locationConsent ?? false) : false);
  const [saving, setSaving] = useState(false);

  if (!isOpen || !user) return null;

  const allRequiredChecked = termsAccepted && privacyAccepted && dataConsent && notificationConsent && locationConsent;

  const handleAcceptAll = async () => {
    // Check if we are just re-accepting the same version from profile
    if (user.legalConsent?.policyVersion === CURRENT_POLICY_VERSION && allRequiredChecked) {
      toast.success('Legal consents are already up to date!');
      if (onAccepted) onAccepted();
      if (onClose) onClose();
      return;
    }

    if (!allRequiredChecked) {
      toast.error('Please accept all required agreements & consents to continue.');
      return;
    }

    setSaving(true);
    try {
      const acceptedAt = Date.now();
      const platform = window.navigator.userAgent.includes('Android') ? 'android' : 
                      window.navigator.userAgent.includes('iPhone') || window.navigator.userAgent.includes('iPad') ? 'ios' : 'web';

      const consentPayload = {
        userId: user.uid,
        policyVersion: CURRENT_POLICY_VERSION,
        termsAccepted,
        privacyAccepted,
        dataConsent,
        locationConsent,
        notificationConsent,
        acceptedAt,
        platform,
        appVersion: '1.0.0' // Assuming standard app version
      };

      // Store in subcollection for audit trail
      const consentRef = doc(db, 'users', user.uid, 'consents', CURRENT_POLICY_VERSION);
      await setDoc(consentRef, consentPayload);

      // Update user profile
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
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving consents:', error);
      toast.error('Failed to save legal consents. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      // If user refuses at gate, log them out
      signOut(auth);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Review Arbeez Fresh Legal Documents</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Please review the following policies before signing in or creating an account.
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-4 pb-8">
          
          {LEGAL_SECTIONS.map((section, idx) => {
            const isExpanded = expandedSection === idx;
            return (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all duration-300"
              >
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{idx + 1}. {section.title}</span>
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400 shrink-0" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Consent Area */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none shrink-0 p-6">
        <div className="max-w-3xl mx-auto">
          
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={termsAccepted} 
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded-md text-emerald-600 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                I have read and agree to the Terms & Conditions.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={privacyAccepted} 
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded-md text-emerald-600 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                I have read and agree to the Privacy Policy.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={dataConsent} 
                onChange={(e) => setDataConsent(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded-md text-emerald-600 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                I understand how Arbeez Fresh uses my data.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={notificationConsent} 
                onChange={(e) => setNotificationConsent(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded-md text-emerald-600 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                I agree to receive important order and account notifications.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={locationConsent} 
                onChange={(e) => setLocationConsent(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded-md text-emerald-600 border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                I allow location access to discover nearby shops and enable delivery services.
              </span>
            </label>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              disabled={saving}
              className="px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleAcceptAll}
              disabled={!allRequiredChecked || saving}
              className="flex-1 py-4 rounded-2xl bg-slate-900 dark:bg-emerald-600 text-white font-black text-sm uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {saving ? 'Saving...' : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Agree & Continue</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

