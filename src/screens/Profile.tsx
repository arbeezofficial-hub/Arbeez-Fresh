import { useEffect, useState } from 'react';
import { logout, db } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, Package, CreditCard, ShieldCheck, MapPin, FileText, ChevronRight, Download, Lock, CheckCircle2, Truck, Store, ExternalLink, Sparkles, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Receipt, Invoice } from '../types';
import { PermissionExplanationModal } from '../components/PermissionExplanationModal';
import { LegalConsentModal } from '../components/LegalConsentModal';

export const Profile = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'invoices' | 'legal'>('menu');
  const [loading, setLoading] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetchUserHistory() {
      setLoading(true);
      try {
        // Fetch User Receipts
        const recQ = query(
          collection(db, 'receipts'),
          where('customerId', '==', user.uid)
        );
        const recSnap = await getDocs(recQ);
        const recList = recSnap.docs.map(d => d.data() as Receipt);
        recList.sort((a, b) => b.createdAt - a.createdAt);
        setReceipts(recList);

        // Fetch User Invoices
        const invQ = query(
          collection(db, 'invoices'),
          where('customerId', '==', user.uid)
        );
        const invSnap = await getDocs(invQ);
        const invList = invSnap.docs.map(d => d.data() as Invoice);
        invList.sort((a, b) => b.createdAt - a.createdAt);
        setInvoices(invList);
      } catch (err) {
        console.warn('Error fetching payment history:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserHistory();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const legalConsent = user?.legalConsent;

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-28">
      {/* Profile Header */}
      <div className="bg-white p-6 pb-8 rounded-b-[36px] shadow-2xs mb-6 border-b border-slate-100">
        <h1 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight">Account</h1>
        <div className="flex items-center gap-5">
          <div className="w-18 h-18 bg-emerald-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-emerald-600">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1.5">{user?.displayName || 'User'}</h2>
            <p className="text-xs text-slate-500 font-medium mb-2">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {user?.roles?.map((r) => (
                <span key={r} className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-widest">
                  {r}
                </span>
              ))}
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck size={10} /> Consents Verified
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mt-6 overflow-x-auto gap-1">
          <button 
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all shrink-0 ${activeTab === 'menu' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
          >
            Menu
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all shrink-0 ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
          >
            Payments ({receipts.length})
          </button>
          <button 
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all shrink-0 ${activeTab === 'invoices' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
          >
            Invoices ({invoices.length})
          </button>
          <button 
            onClick={() => setActiveTab('legal')}
            className={`flex-1 py-2.5 px-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all shrink-0 ${activeTab === 'legal' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
          >
            Legal & Policy
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="px-4 sm:px-6 space-y-4">
        {activeTab === 'menu' && (
          <div className="space-y-3">
            <button
              onClick={() => setActiveTab('legal')}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-2xs border border-slate-200 hover:border-emerald-200 transition-all text-left"
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShieldCheck size={20} />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Privacy, Terms & Legal Consents</p>
                <p className="text-xs text-slate-400">View recorded consents & store policies</p>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-2xs border border-slate-200 hover:border-emerald-200 transition-all text-left"
            >
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Package size={20} />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">My Orders & Payment Logs</p>
                <p className="text-xs text-slate-400">View PayU order logs and payment receipts</p>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>

            <button
              onClick={() => setShowPermissionModal(true)}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-2xs border border-slate-200 hover:border-emerald-200 transition-all text-left"
            >
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <MapPin size={20} />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">App Permissions (Location & Alerts)</p>
                <p className="text-xs text-slate-400">Manage GPS location & live push notifications</p>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-2xs border border-slate-200 hover:border-emerald-200 transition-all text-left"
            >
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Tax Invoices</p>
                <p className="text-xs text-slate-400">Download official PDF & printable tax invoices</p>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>

            {/* Become Partner Options */}
            <div className="pt-2 space-y-2">
              {!user?.roles?.includes('vendor') && (
                <Link
                  to="/become-partner?type=vendor"
                  className="w-full flex items-center justify-between p-4 bg-indigo-900 text-white rounded-2xl shadow-sm text-left hover:bg-indigo-950 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Store size={20} className="text-indigo-300" />
                    <div>
                      <p className="font-black text-sm uppercase tracking-wide">Register as Merchant Vendor</p>
                      <p className="text-[11px] text-indigo-200">Sell farm produce & groceries on Arbeez Fresh</p>
                    </div>
                  </div>
                  <Sparkles size={16} className="text-amber-400" />
                </Link>
              )}

              {!user?.roles?.includes('delivery') && (
                <Link
                  to="/become-partner?type=delivery"
                  className="w-full flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-sm text-left hover:bg-slate-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Truck size={20} className="text-amber-400" />
                    <div>
                      <p className="font-black text-sm uppercase tracking-wide">Apply as Delivery Executive</p>
                      <p className="text-[11px] text-slate-300">Earn per order with flexible hyperlocal navigation</p>
                    </div>
                  </div>
                  <Sparkles size={16} className="text-amber-400" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* LEGAL & CONSENTS TAB */}
        {activeTab === 'legal' && (
          <div className="space-y-4">
            {/* Record Consents Summary Card */}
            <div className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-emerald-600" />
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Your Legal Consents Record</h3>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-200">
                  {legalConsent?.policyVersion || 'v1.0.0'}
                </span>
              </div>

              <div className="text-xs space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Consent Status:</span>
                  <strong className="text-emerald-600 font-black uppercase">Verified & Active</strong>
                </div>
                <div className="flex justify-between">
                  <span>Accepted Date:</span>
                  <strong className="text-slate-900 font-bold">
                    {legalConsent?.acceptedAt ? new Date(legalConsent.acceptedAt).toLocaleString() : 'Accepted on Auth'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Device Platform:</span>
                  <strong className="text-slate-900 font-bold uppercase">{legalConsent?.platform || 'Web App'}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/50 p-2 rounded-xl">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Terms & Conditions</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/50 p-2 rounded-xl">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Privacy Policy</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/50 p-2 rounded-xl">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Location Access</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/50 p-2 rounded-xl">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Notifications</span>
                </div>
              </div>
            </div>

            {/* Documents List */}
            <div className="bg-white p-5 rounded-[24px] border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-xs text-slate-400">View Legal Documents</h3>

              <div className="grid grid-cols-1 gap-2 text-xs font-black">
                <button 
                  onClick={() => setShowLegalModal(true)} 
                  className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-slate-500" /> Review Legal Documents & Policies
                  </span>
                  <ExternalLink size={14} className="text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment History View */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {receipts.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <Package size={36} className="mx-auto text-slate-300" />
                <h3 className="font-black uppercase tracking-tight text-slate-800">No Orders Found</h3>
                <p className="text-xs text-slate-400">Your past PayU payment receipts will appear here.</p>
              </div>
            ) : (
              receipts.map((rec) => (
                <div 
                  key={rec.id}
                  onClick={() => navigate(`/receipt/${rec.id}`)}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <p className="font-black text-xs uppercase tracking-tight text-slate-900">{rec.shopName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(rec.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase">
                      ₹{rec.grandTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Method: <strong className="uppercase text-slate-900">{rec.paymentMethod}</strong></span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      View Receipt <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tax Invoices View */}
        {activeTab === 'invoices' && (
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <FileText size={36} className="mx-auto text-slate-300" />
                <h3 className="font-black uppercase tracking-tight text-slate-800">No Invoices Generated</h3>
                <p className="text-xs text-slate-400">Complete an order to generate official tax invoices.</p>
              </div>
            ) : (
              invoices.map((inv) => (
                <div 
                  key={inv.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="font-black text-xs text-indigo-600 block">{inv.invoiceNumber}</span>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(inv.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="text-xs font-black text-slate-900">₹{inv.grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Merchant: <strong className="text-slate-900">{inv.shopName}</strong></div>
                    <div>Gateway: <strong className="text-slate-900">{inv.gatewayName}</strong> (Txn: {inv.payuTxnId || 'N/A'})</div>
                  </div>

                  <button 
                    onClick={() => navigate(`/receipt/${inv.orderId}?invoiceId=${inv.id}`)}
                    className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                  >
                    <Download size={14} /> View / Print Tax Invoice
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Logout Button */}
        <div className="pt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-rose-500 hover:text-white transition-all shadow-2xs cursor-pointer"
          >
            <LogOut size={18} />
            Log Out Account
          </button>
        </div>
      </div>

      <PermissionExplanationModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
      />

      <LegalConsentModal 
        isOpen={showLegalModal} 
        onClose={() => setShowLegalModal(false)}
      />
    </div>
  );
};
