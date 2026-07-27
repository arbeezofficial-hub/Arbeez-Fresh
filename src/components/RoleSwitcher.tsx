import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Role } from '../types';
import { Store, Truck, UserCheck, Sparkles, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const RoleSwitcher = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const currentRole = user.activeRole || user.role || 'customer';
  const approvedRoles: Role[] = user.roles || [user.role || 'customer'];

  const handleSwitchRole = async (targetRole: Role) => {
    if (targetRole === currentRole) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        activeRole: targetRole
      });
      setUser({ ...user, activeRole: targetRole });
      toast.success(`Switched active app to ${targetRole.toUpperCase()}`);
      setOpen(false);

      if (targetRole === 'vendor') {
        navigate('/vendor/dashboard');
      } else if (targetRole === 'delivery') {
        navigate('/delivery/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to switch active role');
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-2xs border border-slate-700"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="capitalize">{currentRole} App</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 space-y-1">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active App Workspace</p>
            <p className="text-xs font-bold text-slate-800">{user.displayName || user.email}</p>
          </div>

          {/* Approved Roles Switch Options */}
          <div className="space-y-1 py-1">
            <button
              onClick={() => handleSwitchRole('customer')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors ${
                currentRole === 'customer' ? 'bg-emerald-50 text-emerald-800 font-black' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <UserCheck size={16} className="text-emerald-600" />
              <span>Customer Workspace</span>
            </button>

            {approvedRoles.includes('vendor') ? (
              <button
                onClick={() => handleSwitchRole('vendor')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors ${
                  currentRole === 'vendor' ? 'bg-indigo-50 text-indigo-800 font-black' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Store size={16} className="text-indigo-600" />
                <span>Vendor Workspace</span>
              </button>
            ) : null}

            {approvedRoles.includes('delivery') ? (
              <button
                onClick={() => handleSwitchRole('delivery')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors ${
                  currentRole === 'delivery' ? 'bg-amber-50 text-amber-800 font-black' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Truck size={16} className="text-amber-600" />
                <span>Delivery Partner Workspace</span>
              </button>
            ) : null}
          </div>

          {/* Partner Applications CTA */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            {!approvedRoles.includes('vendor') && (
              <button
                onClick={() => { setOpen(false); navigate('/become-partner?type=vendor'); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-extrabold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 transition-colors uppercase tracking-wider"
              >
                <span className="flex items-center gap-2">
                  <Store size={14} /> Become Vendor
                </span>
                <Sparkles size={12} />
              </button>
            )}

            {!approvedRoles.includes('delivery') && (
              <button
                onClick={() => { setOpen(false); navigate('/become-partner?type=delivery'); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-extrabold text-amber-600 bg-amber-50/70 hover:bg-amber-100 transition-colors uppercase tracking-wider"
              >
                <span className="flex items-center gap-2">
                  <Truck size={14} /> Become Delivery Partner
                </span>
                <Sparkles size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
