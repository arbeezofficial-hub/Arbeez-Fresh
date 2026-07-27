import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notification } from '../types';
import { Bell, Check, X, Package, Truck, DollarSign, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationCenter = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const notifQ = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsub = onSnapshot(notifQ, (snap) => {
      const list = snap.docs.map(d => d.data() as Notification);
      list.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(list);
    });

    return () => unsub();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (notifId: string, orderId?: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        read: true
      });
      setOpen(false);
      if (orderId) {
        navigate(`/order-tracking/${orderId}`);
      }
    } catch (err) {
      console.warn('Error marking notification read:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-[24px] shadow-2xl border border-slate-200 z-50 p-4 space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-500" /> In-App Notifications
            </h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">No new notifications.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.orderId)}
                  className={`p-3 rounded-2xl border transition-colors cursor-pointer space-y-1 ${
                    n.read ? 'bg-slate-50 border-slate-100 opacity-70' : 'bg-emerald-50/60 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900">{n.title}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-tight">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
