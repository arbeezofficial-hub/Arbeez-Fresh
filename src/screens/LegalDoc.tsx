import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Scale, FileText, Lock, RefreshCw, Truck, HeartHandshake, CheckCircle2 } from 'lucide-react';

export const LegalDoc = () => {
  const { docType } = useParams<{ docType: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>(docType || 'privacy');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28">
      {/* Sticky Top Header */}
      <div className="bg-slate-900 text-white p-5 shadow-md sticky top-0 z-20 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white hover:bg-slate-800 rounded-full">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-400" />
              Arbeez Fresh Legal & Policies
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Version 1.0.0 • Effective July 2026
            </p>
          </div>
        </div>
      </div>

      {/* Policy Category Tabs */}
      <div className="p-4 bg-white border-b border-slate-200 sticky top-[69px] z-10 shadow-2xs">
        <div className="flex overflow-x-auto gap-2 pb-1 [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'privacy', label: 'Privacy Policy', icon: Lock },
            { id: 'terms', label: 'Terms & Conditions', icon: Scale },
            { id: 'community', label: 'Community Guidelines', icon: HeartHandshake },
            { id: 'refund', label: 'Refunds & Cancellations', icon: RefreshCw },
            { id: 'delivery', label: 'Delivery Policy', icon: Truck },
            { id: 'cookies', label: 'Data & Cookies', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-2xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        {/* PRIVACY POLICY */}
        {activeTab === 'privacy' && (
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6 text-sm leading-relaxed text-slate-700">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                Google Play & Apple App Store Compliant
              </span>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Privacy Policy</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Last Updated: July 26, 2026</p>
            </div>

            <section className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base uppercase">1. Information We Collect</h3>
              <p>Arbeez Fresh ("we", "our", or "us") respects your privacy. When you access or use our mobile and web marketplace applications, we collect:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Personal Identity Information:</strong> Name, email address, phone number, and profile photo when authenticating via Google Sign-In or Phone OTP.</li>
                <li><strong>Precise Location Data:</strong> GPS coordinates collected in the foreground and background to connect you with nearby grocery shops, calculate delivery fees, and power live order tracking.</li>
                <li><strong>Delivery Addresses:</strong> Saved delivery street addresses and delivery instructions provided during checkout.</li>
                <li><strong>Transaction & Payment Records:</strong> PayU India transaction IDs, order history, tax invoices, and payment receipts. We do NOT store complete credit card or net banking credentials on our servers.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base uppercase">2. How We Use Your Information</h3>
              <p>We process your data strictly to fulfill marketplace service obligations:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Discovering farm-fresh produce and local markets within your delivery radius.</li>
                <li>Dispatching live delivery tracking details to assigned delivery partners.</li>
                <li>Sending real-time Firebase Cloud Messaging (FCM) notifications for order status updates, payment alerts, and vendor dispatch reminders.</li>
                <li>Generating digital tax invoices and verified PayU payment receipts.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base uppercase">3. Firebase Services & Data Security</h3>
              <p>
                We use Google Firebase Authentication, Cloud Firestore, and Firebase App Check to secure your account. All communications are encrypted over TLS 1.3. Your personal data is stored securely and never sold to third-party data brokers.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base uppercase">4. Account Deletion & User Rights</h3>
              <p>
                You have the right to access, rectify, or delete your account data at any time. You can initiate account deletion directly from your Account Profile screen or by contacting our Data Protection Officer at <strong>support@arbeezfresh.com</strong>.
              </p>
            </section>
          </div>
        )}

        {/* TERMS & CONDITIONS */}
        {activeTab === 'terms' && (
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6 text-sm leading-relaxed text-slate-700">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 inline-block mb-2">
                Marketplace Agreement
              </span>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Terms & Conditions</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Effective Date: July 26, 2026</p>
            </div>

            <section className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base uppercase">1. User Responsibilities</h3>
              <p>
                By registering or placing an order on Arbeez Fresh, you agree to provide accurate delivery addresses, valid phone numbers, and authorized payment instruments. Fraudulent order attempts or abusive behavior toward delivery executives will result in immediate account termination.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base uppercase">2. Vendor & Delivery Partner Rules</h3>
              <p>
                Vendors listed on Arbeez Fresh guarantee that all fresh vegetables, fruits, and organic produce comply with FSSAI food quality standards. Approved vendors and delivery partners operate as independent service providers.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base uppercase">3. Payment Terms & Gateway Processing</h3>
              <p>
                All online payments are securely processed via PayU Gateway India. Prices listed include applicable GST unless specified otherwise. Platform fees and delivery charges are clearly itemized before order confirmation.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base uppercase">4. Governing Law & Dispute Resolution</h3>
              <p>
                These terms shall be governed by the laws of India, with exclusive jurisdiction in the courts of Bangalore, Karnataka.
              </p>
            </section>
          </div>
        )}

        {/* COMMUNITY GUIDELINES */}
        {activeTab === 'community' && (
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6 text-sm leading-relaxed text-slate-700">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Community Guidelines</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Respect, Quality & Fairness in Fresh Grocery Delivery</p>
            </div>

            <p>
              Arbeez Fresh brings together organic farmers, local store owners, delivery partners, and household customers. We enforce zero tolerance for harassment, discrimination, or abusive reviews.
            </p>
          </div>
        )}

        {/* REFUNDS & CANCELLATIONS */}
        {activeTab === 'refund' && (
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6 text-sm leading-relaxed text-slate-700">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Refund & Cancellation Policy</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Guaranteed Fresh Quality</p>
            </div>

            <section className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base uppercase">Freshness Guarantee</h3>
              <p>
                If any delivered item is damaged or fails to meet fresh quality expectations upon delivery, submit a photo review within 2 hours for instant refund processing or replacement credit.
              </p>
            </section>
          </div>
        )}

        {/* DELIVERY POLICY */}
        {activeTab === 'delivery' && (
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6 text-sm leading-relaxed text-slate-700">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Delivery Policy</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Hyperlocal Express Express</p>
            </div>

            <p>
              Orders are dispatched from local vendors within 15–30 minutes. Real-time GPS location sharing enables accurate drop-off navigation.
            </p>
          </div>
        )}

        {/* DATA & COOKIES */}
        {activeTab === 'cookies' && (
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6 text-sm leading-relaxed text-slate-700">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Data Usage & Cookie Notice</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Essential Local Cache & Session Storage</p>
            </div>

            <p>
              We use standard browser localStorage and session cookies exclusively to maintain user authentication states, cart selections, and active role preferences.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
