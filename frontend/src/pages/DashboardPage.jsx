import { useState, useMemo } from 'react';
import {
  ArrowRight, Share2, Navigation2, Map, Leaf, Trophy,
  Users, BarChart2, BookHeart, TrendingUp, Wind, Droplets,
  Thermometer, Activity, AlertTriangle, CheckCircle2, XCircle, ShieldAlert, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore    from '@/features/auth/store/authStore';
import useProfileStore from '@/features/profile/store/profileStore';
import useGeolocation  from '@/hooks/useGeolocation';
import useWeather      from '@/features/weather/hooks/useWeather';
import useAirQuality   from '@/features/weather/hooks/useAirQuality';
import useForecast     from '@/features/weather/hooks/useForecast';
import useAqiForecast  from '@/features/weather/hooks/useAqiForecast';
import useDecisionEngine from '@/features/suggestion/hooks/useDecisionEngine';
import CitySearchBar   from '@/features/weather/components/CitySearchBar';
import ForecastChartCard from '@/features/weather/components/ForecastChartCard';
import HealthTipsCard  from '@/features/weather/components/HealthTipsCard';
import AqiForecastCard from '@/features/weather/components/AqiForecastCard';
import StatsCard       from '@/features/gamification/components/StatsCard';
import useUserStats    from '@/features/gamification/hooks/useUserStats';
import useCheckIn      from '@/features/gamification/hooks/useCheckIn';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';
import useWebSocket from '@/hooks/useWebSocket';
import AqiAlertBanner  from '@/components/organisms/AqiAlertBanner';
import OnboardingModal from '@/components/organisms/OnboardingModal';
import NotificationPermissionBanner from '@/components/organisms/NotificationPermissionBanner';
import ShareCardModal  from '@/components/organisms/ShareCardModal';
import useAqiNotification from '@/hooks/useAqiNotification';

//  Aero-Score computation 
// Higher = safer air. 0–100 composite score.
const calcAeroScore = (aqi = 1, humidity = 60, windSpeed = 3, temp = 28) => {
  const aqiBase      = ((aqi - 1) / 4) * 60;                           // 0–60
  const humidPenalty = humidity > 70 ? (humidity - 70) * 0.4 : 0;      // 0–12
  const windBonus    = Math.min(windSpeed * 2, 20);                     // 0–20
  const heatPenalty  = temp > 34 ? (temp - 34) * 0.5 : 0;             // 0–~8
  const raw = aqiBase + humidPenalty - windBonus + heatPenalty;
  return Math.max(0, Math.min(100, Math.round(100 - raw)));
};

const aeroLabel = (score) => {
  if (score >= 80) return { labelKey: 'excellent', color: 'text-emerald-400', ring: 'stroke-emerald-400' };
  if (score >= 60) return { labelKey: 'good',      color: 'text-yellow-400',  ring: 'stroke-yellow-400'  };
  if (score >= 40) return { labelKey: 'moderate',  color: 'text-orange-400',  ring: 'stroke-orange-400'  };
  if (score >= 20) return { labelKey: 'poor',      color: 'text-red-400',     ring: 'stroke-red-400'     };
  return               { labelKey: 'hazardous',  color: 'text-purple-400',  ring: 'stroke-purple-400'  };
};

//  Bio-climatic adaptive header copy
const getBioClimaticCopy = (aqi, humidity, temp, name, t) => {
  const alerts = [];
  if (humidity > 80)  alerts.push(t('dashboard.bio.humidity'));
  if (aqi >= 4)       alerts.push(t('dashboard.bio.pm25d'));
  else if (aqi >= 3)  alerts.push(t('dashboard.bio.pm25e'));
  if (temp > 36)      alerts.push(t('dashboard.bio.heat'));

  const headline = t('dashboard.greeting', { name });

  if (!alerts.length) {
    return { headline, sub: t('dashboard.bio.clean'), hasAlerts: false };
  }
  return {
    headline,
    sub: `${alerts.join(' + ')} — ${t('dashboard.bio.stress')}`,
    hasAlerts: true,
  };
};

//  Aero-Score radial gauge 
const AeroGauge = ({ score, label, color, ring }) => {
  const r    = 40;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[100px] h-[100px]">
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r} fill="none"
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            className={`transition-all duration-700 ${ring}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-extrabold ${color}`}>{score}</span>
          <span className="text-[10px] text-white/40 uppercase tracking-widest">Aero</span>
        </div>
      </div>
      <span className={`text-xs font-bold ${color}`}>{label}</span>
    </div>
  );
};

//  AQI meta 
const AQI_META = {
  1: { label: 'Good',      gradient: 'from-emerald-500 to-emerald-700', text: 'text-emerald-400' },
  2: { label: 'Fair',      gradient: 'from-yellow-400 to-amber-600',    text: 'text-yellow-400'  },
  3: { label: 'Moderate',  gradient: 'from-orange-400 to-orange-600',   text: 'text-orange-400'  },
  4: { label: 'Poor',      gradient: 'from-red-500 to-red-700',         text: 'text-red-400'     },
  5: { label: 'Very Poor', gradient: 'from-purple-500 to-purple-800',   text: 'text-purple-400'  },
};

//  Quick stat pill — clickable variant when onClick provided
const StatPill = ({ icon: Icon, label, value, color = 'text-white/70', onClick }) => (
  <div
    className={`glass-card px-3 py-2.5 flex items-center gap-2.5 transition-all duration-150 ${
      onClick ? 'cursor-pointer hover:border-white/20 hover:bg-white/5 active:scale-[0.97]' : ''
    }`}
    onClick={onClick}
  >
    <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-white/30 uppercase tracking-widest leading-none">{label}</p>
      <p className={`text-sm font-bold ${color} mt-0.5`}>{value}</p>
    </div>
    {onClick && <span className="text-[9px] text-white/20 flex-shrink-0">↑</span>}
  </div>
);

//  Environmental Parameter Detail Sheet
const ParamDetailSheet = ({ paramKey, humidity, windSpd, temp, feelsLike, aqi, pm25, onClose, t }) => {
  if (!paramKey) return null;

  const configs = {
    humidity: {
      Icon: Droplets,
      color: 'text-blue-400',
      from: '#3b82f6', to: '#06b6d4',
      label: t('weather.humidity'),
      value: `${humidity}%`,
      pct: Math.min(humidity, 100),
      ranges: [
        { label: '< 30  Dry',          color: '#f59e0b' },
        { label: '30–60  Comfortable', color: '#10b981' },
        { label: '60–80  Humid',       color: '#f97316' },
        { label: '80+  Very Humid',    color: '#ef4444' },
      ],
      status: humidity < 30
        ? { text: 'Dry air — may irritate airways',           color: 'text-amber-400',   bg: 'bg-amber-500/10'   }
        : humidity < 60
        ? { text: 'Comfortable humidity range',               color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
        : humidity < 80
        ? { text: 'Moderately humid — carry water',           color: 'text-orange-400',  bg: 'bg-orange-500/10'  }
        : { text: 'High humidity — allergen risk elevated',   color: 'text-red-400',     bg: 'bg-red-500/10'     },
      desc: 'Relative humidity is the water vapour in the air relative to its maximum capacity. High humidity traps pollutants near the ground and amplifies heat stress.',
    },
    wind: {
      Icon: Wind,
      color: (windSpd * 3.6) > 10 ? 'text-emerald-400' : 'text-amber-400',
      from: '#10b981', to: '#06b6d4',
      label: t('weather.wind'),
      value: `${(windSpd * 3.6).toFixed(1)} km/h`,
      pct: Math.min((windSpd * 3.6) / 60 * 100, 100),
      ranges: [
        { label: '0–10  Calm/Stagnant',   color: '#ef4444' },
        { label: '10–20  Light Breeze',   color: '#f59e0b' },
        { label: '20–40  Good Airflow',   color: '#10b981' },
        { label: '40+  Strong Wind',      color: '#3b82f6' },
      ],
      status: (windSpd * 3.6) < 10
        ? { text: 'Calm air — pollutants may accumulate',     color: 'text-red-400',     bg: 'bg-red-500/10'     }
        : (windSpd * 3.6) < 20
        ? { text: 'Light breeze — moderate dispersal',        color: 'text-amber-400',   bg: 'bg-amber-500/10'   }
        : { text: 'Good wind — pollutants dispersing well',   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      desc: 'Wind speed determines how well airborne pollutants disperse. Low wind means stagnant air where PM2.5 and NO₂ can accumulate near the surface.',
    },
    feelsLike: {
      Icon: Thermometer,
      color: feelsLike > 35 ? 'text-red-400' : feelsLike > 28 ? 'text-orange-400' : 'text-emerald-400',
      from: feelsLike > 35 ? '#ef4444' : '#f97316', to: '#f59e0b',
      label: t('weather.feelsLike'),
      value: `${Math.round(feelsLike)}°C`,
      pct: Math.min(Math.max((feelsLike - 10) / 40 * 100, 0), 100),
      ranges: [
        { label: '< 18  Cool',       color: '#3b82f6' },
        { label: '18–27  Ideal',     color: '#10b981' },
        { label: '27–33  Warm',      color: '#f59e0b' },
        { label: '33+  Hot',         color: '#ef4444' },
      ],
      status: feelsLike < 18
        ? { text: 'Cool — dress in layers',              color: 'text-blue-400',    bg: 'bg-blue-500/10'    }
        : feelsLike < 27
        ? { text: 'Comfortable apparent temperature',    color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
        : feelsLike < 33
        ? { text: 'Warm — stay hydrated outdoors',       color: 'text-amber-400',   bg: 'bg-amber-500/10'   }
        : { text: 'Hot — limit prolonged outdoor time',  color: 'text-red-400',     bg: 'bg-red-500/10'     },
      desc: `Actual temperature: ${Math.round(temp)}°C. Apparent temperature accounts for humidity and wind chill. High humidity makes heat feel more intense; wind provides cooling.`,
    },
    aqi: {
      Icon: Activity,
      color: ['', 'text-emerald-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-purple-400'][aqi] ?? 'text-white',
      from: ['', '#10b981', '#eab308', '#f97316', '#ef4444', '#a855f7'][aqi] ?? '#10b981',
      to:   ['', '#06b6d4', '#f59e0b', '#ea580c', '#dc2626', '#7c3aed'][aqi] ?? '#06b6d4',
      label: t('dashboard.aqiLevel'),
      value: `${t(`aqi.level.${aqi}`)}  (${aqi}/5)`,
      pct: ((aqi - 1) / 4) * 100,
      ranges: [
        { label: '1  Good',      color: '#10b981' },
        { label: '2  Fair',      color: '#eab308' },
        { label: '3  Moderate',  color: '#f97316' },
        { label: '4  Poor',      color: '#ef4444' },
        { label: '5  Very Poor', color: '#a855f7' },
      ],
      status: !aqi ? { text: 'No data', color: 'text-white/40', bg: 'bg-white/5' }
        : aqi <= 1 ? { text: 'Good — enjoy outdoor activities',               color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
        : aqi === 2 ? { text: 'Fair — sensitive groups should take care',     color: 'text-yellow-400',  bg: 'bg-yellow-500/10'  }
        : aqi === 3 ? { text: 'Moderate — reduce prolonged outdoor activity', color: 'text-orange-400',  bg: 'bg-orange-500/10'  }
        : aqi === 4 ? { text: 'Poor — limit outdoor exposure',                color: 'text-red-400',     bg: 'bg-red-500/10'     }
        :             { text: 'Very Poor — stay indoors',                     color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
      desc: 'AQI (1–5) is a composite of PM2.5, PM10, NO₂, O₃, SO₂ and CO concentrations per WHO 2021 guidelines. Values above 3 indicate a measurable risk to respiratory health.',
      extra: pm25 != null ? `PM2.5: ${pm25.toFixed(1)} μg/m³  ·  WHO 24h safe limit: 15 μg/m³` : null,
    },
    pm25: {
      Icon: Wind,
      color: pm25 > 75 ? 'text-purple-400' : pm25 > 35 ? 'text-red-400' : pm25 > 15 ? 'text-orange-400' : 'text-emerald-400',
      from: pm25 > 75 ? '#a855f7' : pm25 > 35 ? '#ef4444' : pm25 > 15 ? '#f97316' : '#10b981',
      to:   pm25 > 75 ? '#7c3aed' : pm25 > 35 ? '#dc2626' : '#f59e0b',
      label: 'PM2.5',
      value: `${pm25?.toFixed(1) ?? '—'} μg/m³`,
      pct: pm25 != null ? Math.min(pm25 / 75 * 100, 100) : 0,
      ranges: [
        { label: '0–15  WHO Safe',    color: '#10b981' },
        { label: '15–35  Moderate',   color: '#f59e0b' },
        { label: '35–75  Unhealthy',  color: '#ef4444' },
        { label: '75+  Hazardous',    color: '#a855f7' },
      ],
      status: pm25 == null
        ? { text: 'No data available',                           color: 'text-white/40',  bg: 'bg-white/5'        }
        : pm25 <= 15
        ? { text: 'Within WHO safe limits (≤15 μg/m³)',          color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
        : pm25 <= 35
        ? { text: 'Moderate — sensitive groups at risk',          color: 'text-amber-400',   bg: 'bg-amber-500/10'   }
        : pm25 <= 75
        ? { text: 'Unhealthy — limit outdoor exposure',           color: 'text-red-400',     bg: 'bg-red-500/10'     }
        : { text: 'Hazardous — stay indoors immediately',         color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
      desc: 'PM2.5 are fine particles ≤2.5 μm in diameter. They penetrate deep into the lungs and enter the bloodstream, increasing risk of heart disease and stroke.',
    },
  };

  const cfg = configs[paramKey];
  if (!cfg) return null;
  const { Icon, color, from, to, label, value, pct, ranges, status, desc, extra } = cfg;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div
          className="rounded-t-3xl p-6 pb-10 max-h-[78vh] overflow-y-auto scrollbar-hide"
          style={{ background: 'linear-gradient(160deg, #0c1828 0%, #090D16 100%)', borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          {/* Drag handle */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${from}22` }}>
                <Icon className={`w-7 h-7 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">{label}</p>
                <p className={`text-3xl font-extrabold leading-none ${color}`}>{value}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:bg-white/15 hover:text-white/70 transition-all flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <div className="h-2.5 w-full rounded-full bg-white/8 overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {ranges.map(r => (
                <span key={r.label} className="text-[10px] font-medium" style={{ color: r.color }}>{r.label}</span>
              ))}
            </div>
          </div>

          {/* Status badge */}
          <div className={`${status.bg} border border-white/8 rounded-xl px-4 py-2.5 mb-4`}>
            <p className={`text-sm font-semibold ${status.color}`}>{status.text}</p>
          </div>

          {/* Description */}
          <p className="text-sm text-white/50 leading-relaxed">{desc}</p>

          {extra && (
            <p className="text-xs text-white/30 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 mt-3">{extra}</p>
          )}
        </div>
      </div>
    </>
  );
};

//  Quick nav chip 
const NavChip = ({ label, path, icon: Icon, color, navigate }) => (
  <button
    onClick={() => navigate(path)}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${color}`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);

//  Outdoor verdict card
const OutdoorVerdictCard = ({ aqi, isLoading }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { healthProfile } = useProfileStore();
  const rec = useDecisionEngine(aqi ?? 1, healthProfile);

  const VIcon =
    rec.canGoOutside === 'YES'              ? CheckCircle2 :
    rec.canGoOutside === 'YES WITH CAUTION' ? AlertTriangle :
    rec.canGoOutside === 'AVOID / NO'       ? ShieldAlert  : XCircle;

  const aqiMeta = AQI_META[aqi] ?? AQI_META[1];

  if (isLoading) return <div className="glass-card h-20 animate-pulse" />;
  if (!aqi) return null;

  return (
    <div className={`glass-card bg-gradient-to-r ${aqiMeta.gradient} bg-opacity-20 p-4 flex items-center gap-4`}
      style={{ background: 'rgba(15,23,42,0.5)' }}>
      <div className={`bg-gradient-to-br ${aqiMeta.gradient} p-2.5 rounded-xl flex-shrink-0`}>
        <VIcon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/40 font-semibold uppercase tracking-widest">{t('dashboard.shouldGoOutside')}</p>
        <p className="text-base font-extrabold text-white truncate">{rec.canGoOutside}</p>
        <p className="text-xs text-white/50 truncate">{rec.duration} · {rec.mask}</p>
      </div>
      <button
        onClick={() => navigate('/biometrics?tab=outdoor')}
        className="flex items-center gap-1.5 glass-accent text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl transition-all flex-shrink-0"
      >
        {t('dashboard.fullAnalysis')} <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};

//  Dashboard Page 
const DashboardPage = () => {
  const { t }      = useTranslation();
  const navigate   = useNavigate();
  const user       = useAuthStore((s) => s.user);
  const [selectedCity, setSelectedCity]     = useState(null);
  const [showShareCard, setShowShareCard]   = useState(false);
  const [selectedParam, setSelectedParam]   = useState(null);
  const { data: statsData, isLoading: statsLoading } = useUserStats();
  useCheckIn();

  const { location: geoLocation, isLoading: locationLoading } = useGeolocation();
  const activeLocation = selectedCity || geoLocation;

  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useWeather(activeLocation);
  const { data: aqiData,     isLoading: aqiLoading,     error: aqiError     } = useAirQuality(activeLocation);
  const { data: forecastData, isLoading: forecastLoading }                    = useForecast(activeLocation);
  const { data: aqiForecastData, isLoading: aqiForecastLoading }              = useAqiForecast(activeLocation);

  const isInitialLoading = locationLoading && !selectedCity;

  // Live AQI via WebSocket — receives { CityName: aqiLevel } map every 30 min
  const [liveAqiMap, setLiveAqiMap] = useState({});
  const { connected: wsConnected } = useWebSocket({
    '/topic/aqi': setLiveAqiMap,
  });

  // Match current city name (from OWM) to the live map
  const liveAqi = useMemo(() => {
    const name = weatherData?.name ?? '';
    const key = Object.keys(liveAqiMap).find(
      (k) => k.toLowerCase() === name.toLowerCase()
    );
    return key ? liveAqiMap[key] : null;
  }, [liveAqiMap, weatherData?.name]);

  useAqiNotification(aqiData?.list?.[0]?.main?.aqi, weatherData?.name);

  //  Derive data
  const aqi      = aqiData?.list?.[0]?.main?.aqi;
  const humidity = weatherData?.main?.humidity ?? 60;
  const windSpd  = weatherData?.wind?.speed ?? 3;
  const temp     = weatherData?.main?.temp ?? 28;
  const feelsLike = weatherData?.main?.feels_like ?? temp;
  const pm25     = aqiData?.list?.[0]?.components?.pm2_5;
  const pm10     = aqiData?.list?.[0]?.components?.pm10;

  const aeroScore = calcAeroScore(aqi, humidity, windSpd, temp);
  const aeroMeta  = aeroLabel(aeroScore);
  const bioText   = getBioClimaticCopy(aqi, humidity, temp, user?.name ?? '', t);
  const aqiMeta   = AQI_META[aqi] ?? AQI_META[1];

  return (
    <div className="min-h-screen page-enter bg-page">
      <OnboardingModal />
      <Navbar />
      <BottomNav />
      {showShareCard && (
        <ShareCardModal weatherData={weatherData} aqiData={aqiData} onClose={() => setShowShareCard(false)} />
      )}

      <div className="max-w-1440 mx-auto px-4 lg:px-8 py-6 pb-24 md:pb-8">

        {/*  Bio-Climatic Header  */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            {isInitialLoading ? (
              <div className="space-y-2">
                <div className="h-7 bg-white/5 rounded-lg w-64 animate-pulse" />
                <div className="h-4 bg-white/5 rounded w-80 animate-pulse" />
              </div>
            ) : (
              <>
                <h2 className={`text-2xl font-extrabold leading-tight ${
                  bioText.hasAlerts
                    ? aqi >= 4 ? 'text-red-400' : 'text-orange-400'
                    : 'text-white'
                }`}>
                  {bioText.headline} {bioText.hasAlerts ? (aqi >= 4 ? '⚠️' : '😷') : '👋'}
                </h2>
                <p className="text-sm text-white/40 mt-0.5">{bioText.sub}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* WebSocket live indicator */}
            {wsConnected && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 glass-accent px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live{liveAqi ? ` · AQI ${liveAqi}` : ''}
              </span>
            )}
            <CitySearchBar onCitySelect={setSelectedCity} />
            {weatherData && aqiData && (
              <button
                onClick={() => setShowShareCard(true)}
                className="flex items-center gap-1.5 glass-accent text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl"
              >
                <Share2 className="w-3.5 h-3.5" />
                {t('dashboard.share')}
              </button>
            )}
          </div>
        </div>

        <NotificationPermissionBanner />
        <AqiAlertBanner aqiLevel={aqi} cityName={weatherData?.name} />

        {/*  Quick nav  */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { label: t('nav.spatialHub'),  path: '/spatial-hub', icon: Navigation2, color: 'border-teal-500/20 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'     },
            { label: t('nav.biometrics'),  path: '/biometrics',  icon: Activity,    color: 'border-violet-500/20 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'},
            { label: t('nav.analytics'),   path: '/analytics',   icon: TrendingUp,  color: 'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'   },
            { label: t('nav.nexus'),       path: '/nexus',       icon: Users,       color: 'border-pink-500/20 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20'       },
          ].map(p => <NavChip key={p.path} {...p} navigate={navigate} />)}
        </div>

        {/*  Unified Atmospheric Vector  */}
        <div className="glass-card p-5 mb-5">
          <div className="flex flex-col lg:flex-row gap-5">

            {/* Aero-Score gauge */}
            <div className="flex flex-col items-center justify-center lg:w-48 flex-shrink-0">
              <AeroGauge score={isInitialLoading || aqiLoading ? 0 : aeroScore} label={t(`dashboard.aeroScore.${aeroMeta.labelKey}`)} color={aeroMeta.color} ring={aeroMeta.ring} />
              <p className="text-[10px] text-white/30 mt-2 text-center uppercase tracking-widest">{t('dashboard.compositeAirSafety')}</p>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px bg-white/8 self-stretch" />

            {/* Weather + AQI metrics */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {isInitialLoading || weatherLoading ? (
                [...Array(6)].map((_, i) => <div key={i} className="glass-card h-16 animate-pulse" />)
              ) : weatherData ? (
                <>
                  <div className="glass-card px-3 py-2.5 col-span-2 sm:col-span-1 flex items-center gap-3">
                    <img src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`} alt="" className="w-12 h-12" />
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest">{weatherData.name}</p>
                      <p className="text-2xl font-extrabold text-white">{Math.round(temp)}°C</p>
                      <p className="text-xs text-white/40 capitalize">{weatherData.weather[0].description}</p>
                    </div>
                  </div>
                  <StatPill icon={Droplets}    label={t('weather.humidity')}   value={`${humidity}%`}                       color={humidity > 80 ? 'text-blue-400' : 'text-white/70'} onClick={() => setSelectedParam('humidity')} />
                  <StatPill icon={Wind}        label={t('weather.wind')}       value={`${(windSpd * 3.6).toFixed(1)} km/h`} color={windSpd > 5 ? 'text-emerald-400' : 'text-white/70'} onClick={() => setSelectedParam('wind')} />
                  <StatPill icon={Thermometer} label={t('weather.feelsLike')}  value={`${Math.round(feelsLike)}°C`}         onClick={() => setSelectedParam('feelsLike')} />
                  {aqi && (
                    <>
                      <StatPill icon={Activity} label={t('dashboard.aqiLevel')} value={`${aqi} · ${t(`aqi.level.${aqi}`)}`} color={aqiMeta.text} onClick={() => setSelectedParam('aqi')} />
                      <StatPill icon={Wind}      label="PM2.5"                   value={`${pm25?.toFixed(1)} μg/m³`}          color={aqiMeta.text} onClick={() => setSelectedParam('pm25')} />
                    </>
                  )}
                </>
              ) : (
                <p className="text-white/30 text-sm col-span-3">{t('dashboard.weatherUnavailable')}</p>
              )}
            </div>
          </div>
        </div>

        {/*  Outdoor verdict  */}
        <div className="mb-5">
          <OutdoorVerdictCard aqi={aqi} isLoading={isInitialLoading || aqiLoading} />
        </div>

        {/*  Forecast charts  */}
        <div className="mb-5">
          <ForecastChartCard data={forecastData} isLoading={isInitialLoading || forecastLoading} />
        </div>

        {/*  AQI Forecast */}
        <div className="mb-5">
          <AqiForecastCard data={aqiForecastData} isLoading={isInitialLoading || aqiForecastLoading} />
        </div>

        {/*  Health Tips + Stats side by side  */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <HealthTipsCard aqiData={aqiData} isLoading={isInitialLoading || aqiLoading} />
          <StatsCard data={statsData} isLoading={statsLoading} />
        </div>

        {/*  User identity strip  */}
        <div className="glass-card flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-white/30">{user?.email}</p>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-medium glass-accent px-3 py-1 rounded-full">{t('dashboard.member')}</span>
        </div>

      </div>

      {selectedParam && (
        <ParamDetailSheet
          paramKey={selectedParam}
          humidity={humidity}
          windSpd={windSpd}
          temp={temp}
          feelsLike={feelsLike}
          aqi={aqi}
          pm25={pm25}
          onClose={() => setSelectedParam(null)}
          t={t}
        />
      )}
    </div>
  );
};

export default DashboardPage;
