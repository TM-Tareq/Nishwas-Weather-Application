import { Bell, BellOff, X } from 'lucide-react';
import { useState } from 'react';
import { useNotificationPermission } from '@/hooks/useAqiNotification';

const DISMISSED_KEY = 'nishwas-notif-dismissed';

const NotificationPermissionBanner = () => {
  const { permission, request } = useNotificationPermission();
  const [dismissed, setDismissed] = useState(
    () => !!localStorage.getItem(DISMISSED_KEY)
  );

  if (permission !== 'default' || dismissed) return null;

  const handleAllow = async () => {
    await request();
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  return (
    <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-2xl px-4 py-3 mb-4">
      <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
        <Bell className="w-4 h-4 text-brand-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-800">Get AQI alerts</p>
        <p className="text-xs text-brand-600">We'll notify you when air quality exceeds your threshold.</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleAllow}
          className="text-xs font-bold px-3 py-1.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
        >
          Allow
        </button>
        <button
          onClick={handleDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-brand-400 hover:text-brand-600 hover:bg-brand-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;
