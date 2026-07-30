import React, { useState } from 'react';
import { MapPin, Bell, ShieldCheck, Settings, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { detectPlatform, requestAndSaveLocation, requestAndSaveNotifications } from '../services/permissionManager.service';
import { useAuthStore } from '../store/useAuthStore';
import { useLocationStore } from '../store/useLocationStore';
import toast from 'react-hot-toast';
import { Loader } from './Loader';

interface PermissionExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PermissionExplanationModal: React.FC<PermissionExplanationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const setLocation = useLocationStore((state) => state.setLocation);
  const [loading, setLoading] = useState(false);
  const [deniedState, setDeniedState] = useState(false);
  const [step, setStep] = useState<'explain' | 'settings_guide'>('explain');

  if (!isOpen) return null;

  const platform = detectPlatform();

  const handleGrantPermissions = async () => {
    setLoading(true);
    let locationSuccess = false;
    let notificationSuccess = false;

    try {
      // 1. Request Location
      try {
        const loc = await requestAndSaveLocation(user?.uid);
        if (loc) {
          setLocation(loc.lat, loc.lng, loc.address);
          locationSuccess = true;
        }
      } catch (err) {
        console.warn('Location permission error:', err);
      }

      // 2. Request Notifications
      try {
        const token = await requestAndSaveNotifications(user?.uid);
        if (token) {
          notificationSuccess = true;
        }
      } catch (err) {
        console.warn('Notification permission error:', err);
      }

      if (locationSuccess || notificationSuccess) {
        toast.success('Permissions successfully configured!');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        // Both denied or failed
        setDeniedState(true);
        setStep('settings_guide');
      }
    } catch (error) {
      setDeniedState(true);
      setStep('settings_guide');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast('Permissions skipped. You can enable them anytime from settings.', { icon: 'ℹ️' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-md">
              <ShieldCheck size={28} className="text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold">App Permissions & Privacy</h2>
              <p className="text-emerald-100 text-xs">Arbeez Fresh {platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Web'} App</p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {step === 'explain' ? (
            <>
              <p className="text-slate-600 text-sm leading-relaxed">
                To give you the best farm-fresh delivery experience, Arbeez Fresh requires access to your device location and live notifications:
              </p>

              <div className="space-y-4">
                {/* Location item */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Precise Location Access</h3>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                      Used exclusively to discover nearby local farm markets, compute accurate delivery distance & fees, and track your delivery driver in real time.
                    </p>
                  </div>
                </div>

                {/* Notification item */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="p-2.5 bg-teal-100 text-teal-700 rounded-xl shrink-0">
                    <Bell size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Live Push Notifications</h3>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                      Receive instant status updates on your farm orders, driver dispatch alerts, order delivery confirmation, and exclusive morning harvest discounts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-3.5 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  You can change these permissions anytime in your device or browser settings. We respect your privacy and never share location data.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Not Now
                </button>
                <button
                  type="button"
                  onClick={handleGrantPermissions}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader size="sm" color="white" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Grant Access
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Settings Guide if Denied */
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                <AlertCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-rose-900 text-sm">Permissions Denied or Blocked</h3>
                  <p className="text-rose-700 text-xs mt-1 leading-relaxed">
                    It looks like location or notification permissions were denied. You can still use the app with default search settings, but live delivery tracking requires permissions enabled.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">How to enable in {platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Browser'} Settings:</h4>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
                  {platform === 'ios' ? (
                    <>
                      <li>Open iOS <strong>Settings</strong> app on your device.</li>
                      <li>Scroll down and tap <strong>Arbeez Fresh</strong> or <strong>Safari / Browser</strong>.</li>
                      <li>Tap <strong>Location</strong> and select <strong>While Using the App</strong>.</li>
                      <li>Tap <strong>Notifications</strong> and toggle <strong>Allow Notifications</strong> ON.</li>
                    </>
                  ) : platform === 'android' ? (
                    <>
                      <li>Open Android <strong>Settings</strong> &gt; <strong>Apps</strong>.</li>
                      <li>Select <strong>Arbeez Fresh</strong> (or your browser).</li>
                      <li>Tap <strong>Permissions</strong> &gt; <strong>Location</strong> &gt; Choose <strong>Allow only while using the app</strong>.</li>
                      <li>Tap <strong>Notifications</strong> &gt; Enable <strong>Show notifications</strong>.</li>
                    </>
                  ) : (
                    <>
                      <li>Click the lock/settings icon in your browser address bar.</li>
                      <li>Reset <strong>Location</strong> and <strong>Notifications</strong> permissions to "Allow" or "Ask".</li>
                      <li>Refresh this page.</li>
                    </>
                  )}
                </ol>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Continue Anyway
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (platform === 'ios' || platform === 'android') {
                      alert('Please open your device Settings -> Apps -> Arbeez Fresh to grant permissions.');
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Settings size={18} />
                  Open Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
