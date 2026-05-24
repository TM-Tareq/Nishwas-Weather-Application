import { useEffect, useRef, useState } from 'react';
import useProfileStore from '@/features/profile/store/profileStore';

const AQI_LABEL = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };
const NOTIFY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour between same-level notifications

export function useNotificationPermission() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const request = async () => {
    if (typeof Notification === 'undefined') return 'denied';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  return { permission, request };
}

export default function useAqiNotification(aqiLevel, cityName) {
  const aqiThreshold = useProfileStore((s) => s.aqiThreshold);
  const lastNotifiedRef = useRef(null);

  useEffect(() => {
    if (
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted' ||
      !aqiLevel ||
      aqiLevel < aqiThreshold
    ) return;

    const now = Date.now();
    if (lastNotifiedRef.current && now - lastNotifiedRef.current < NOTIFY_COOLDOWN_MS) return;

    lastNotifiedRef.current = now;

    const label = AQI_LABEL[aqiLevel] ?? 'Poor';
    const city = cityName || 'your area';

    new Notification(`🌿 Nishwas Air Alert — ${label}`, {
      body: `AQI level ${aqiLevel} (${label}) in ${city}. ${
        aqiLevel >= 4 ? 'Stay indoors if possible.' : 'Limit outdoor activity.'
      }`,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: 'aqi-alert',
    });
  }, [aqiLevel, aqiThreshold, cityName]);
}
