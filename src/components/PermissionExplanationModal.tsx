import React, { useState } from 'react';
import { MapPin, Bell, Settings, X, AlertCircle } from 'lucide-react';
import { detectPlatform, requestAndSaveLocation, requestAndSaveNotifications } from '../services/permissionManager.service';
import { useAuthStore } from '../store/useAuthStore';
import { useLocationStore } from '../store/useLocationStore';
import toast from 'react-hot-toast';
import { Loader } from './Loader';
import brandLogo from '../assets/logo';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in safe-area-pt safe-area-pb">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full max-h-full overflow-hidden border border-slate-100 flex flex-col relative">
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col pb-2">
          {/* Header with App Logo & Title */}
          <div className="relative bg-gradient-to-b from-slate-50 to-white p-6 sm:p-8 pb-4">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-slate-50 shadow-sm border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            
            <div className="flex flex-col items-center text-center mt-2">
              <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-5 p-2">
                <img src={brandLogo} alt="App Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">App Permissions & Privacy</h2>
              <p className="text-slate-500 text-sm mt-3 max-w-[260px] mx-auto leading-relaxed">
                We need access to a few features to provide you with the best farm-fresh delivery experience.
              </p>
            </div>
          </div>

          {/* Permission Cards */}
          <div className="px-6 pb-6 space-y-3">
            {step === 'explain' ? (
              <>
                {/* Location item */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Location</h3>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Used to find nearby markets, calculate delivery fees, and track your driver.
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">Not Granted</p>
                  </div>
                </div>

                {/* Notification item */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
                    <Bell size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Receive order status updates, delivery alerts, and exclusive discounts.
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">Not Granted</p>
                  </div>
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
                      Live delivery tracking requires these permissions to be enabled in your settings.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">How to enable in {platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Browser'} Settings:</h4>
                  <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed pl-1">
                    {platform === 'ios' ? (
                      <>
                        <li>Open iOS <strong>Settings</strong> app.</li>
                        <li>Find and tap <strong>Arbeez Fresh</strong>.</li>
                        <li>Set <strong>Location</strong> to <strong>While Using</strong>.</li>
                        <li>Turn <strong>Notifications</strong> ON.</li>
                      </>
                    ) : platform === 'android' ? (
                      <>
                        <li>Open Android <strong>Settings</strong> &gt; <strong>Apps</strong>.</li>
                        <li>Select <strong>Arbeez Fresh</strong>.</li>
                        <li>Under <strong>Permissions</strong>, allow <strong>Location</strong>.</li>
                        <li>Enable <strong>Show notifications</strong>.</li>
                      </>
                    ) : (
                      <>
                        <li>Click the lock icon in your browser address bar.</li>
                        <li>Set <strong>Location</strong> and <strong>Notifications</strong> to "Allow".</li>
                        <li>Refresh this page.</li>
                      </>
                    )}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="p-6 bg-white border-t border-slate-100 mt-auto shrink-0">
          {step === 'explain' ? (
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleGrantPermissions}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-emerald-600/20"
              >
                {loading ? (
                  <Loader size="sm" color="white" />
                ) : (
                  'Grant Permissions'
                )}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="w-full py-3 px-4 rounded-2xl text-slate-500 font-bold text-sm hover:bg-slate-50 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Skip for Now
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (platform === 'ios' || platform === 'android') {
                    alert('Please open your device Settings -> Apps -> Arbeez Fresh to grant permissions.');
                  } else {
                    window.location.reload();
                  }
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-slate-900/20"
              >
                <Settings size={18} />
                Open Settings
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-2xl text-slate-500 font-bold text-sm hover:bg-slate-50 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Continue Anyway
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
