import { useState } from 'react';
import { MapPin, ArrowRight, CheckCircle2, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '@/features/auth/store/authStore';
import useProfileStore from '@/features/profile/store/profileStore';
import useGeolocation from '@/hooks/useGeolocation';
import useWeather from '@/features/weather/hooks/useWeather';
import useAirQuality from '@/features/weather/hooks/useAirQuality';
import useForecast from '@/features/weather/hooks/useForecast';
import useDecisionEngine from '@/features/suggestion/hooks/useDecisionEngine';
import WeatherCard from '@/features/weather/components/WeatherCard';
import AqiCard from '@/features/weather/components/AqiCard';
import ForecastCard from '@/features/weather/components/ForecastCard';
import ForecastChartCard from '@/features/weather/components/ForecastChartCard';
import HealthTipsCard from '@/features/weather/components/HealthTipsCard';
import TodayHighlights from '@/features/weather/components/TodayHighlights';
import CitySearchBar from '@/features/weather/components/CitySearchBar';
import StatsCard from '@/features/gamification/components/StatsCard';
import useUserStats from '@/features/gamification/hooks/useUserStats';
import useCheckIn from '@/features/gamification/hooks/useCheckIn';
import Navbar from '@/components/organisms/Navbar';

// ─── Outdoor Status Teaser ────────────────────────────────────────────────────

const AQI_GRADIENT = {
  1: 'from-green-500 to-emerald-600',
  2: 'from-yellow-400 to-amber-500',
  3: 'from-orange-400 to-orange-600',
  4: 'from-red-500 to-red-700',
  5: 'from-purple-600 to-purple-900',
};

const OutdoorStatusCard = ({ aqi, isLoading, error }) => {
  const navigate = useNavigate();
  const { healthProfile } = useProfileStore();
  const rec = useDecisionEngine(aqi ?? 1, healthProfile);

  const Icon =
    rec.canGoOutside === 'YES'              ? CheckCircle2 :
    rec.canGoOutside === 'YES WITH CAUTION' ? AlertTriangle :
    rec.canGoOutside === 'AVOID / NO'       ? ShieldAlert :
    XCircle;

  if (isLoading) {
    return (
      <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
    );
  }
  if (error || !aqi) return null;

  const gradient = AQI_GRADIENT[aqi] ?? AQI_GRADIENT[1];

  return (
    <div className={`rounded-2xl bg-gradient-to-r ${gradient} p-4 flex items-center gap-4 shadow-md`}>
      <Icon className="w-9 h-9 text-white/90 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/70 font-semibold uppercase tracking-widest">Should I go outside?</p>
        <p className="text-lg font-extrabold text-white tracking-tight truncate">{rec.canGoOutside}</p>
        <p className="text-xs text-white/80 truncate">{rec.duration} · {rec.mask}</p>
      </div>
      <button
        onClick={() => navigate('/outdoor')}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shrink-0"
      >
        Full Analysis
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [selectedCity, setSelectedCity] = useState(null);
  const { data: statsData, isLoading: statsLoading } = useUserStats();
  useCheckIn(); // auto check-in on first daily visit

  const { location: geoLocation, isLoading: locationLoading, error: locationError } = useGeolocation();
  const activeLocation = selectedCity || geoLocation;

  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useWeather(activeLocation);
  const { data: aqiData, isLoading: aqiLoading, error: aqiError } = useAirQuality(activeLocation);
  const { data: forecastData, isLoading: forecastLoading, error: forecastError } = useForecast(activeLocation);

  const isInitialLoading = locationLoading && !selectedCity;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* Welcome + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('dashboard.greeting', { name: user?.name })} 👋
            </h2>
            {locationError && !selectedCity ? (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-500">{locationError}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-0.5">{t('dashboard.subtitle')}</p>
            )}
          </div>
          <CitySearchBar onCitySelect={setSelectedCity} />
        </div>

        {/* Weather + AQI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <WeatherCard
            data={weatherData}
            isLoading={isInitialLoading || weatherLoading}
            error={weatherError}
          />
          <AqiCard
            data={aqiData}
            isLoading={isInitialLoading || aqiLoading}
            error={aqiError}
          />
        </div>

        {/* Outdoor Status Teaser */}
        <div className="mb-4">
          <OutdoorStatusCard
            aqi={aqiData?.list?.[0]?.main?.aqi}
            isLoading={isInitialLoading || aqiLoading}
            error={aqiError}
          />
        </div>

        {/* Today's Highlights */}
        <div className="mb-4">
          <TodayHighlights
            data={weatherData}
            isLoading={isInitialLoading || weatherLoading}
          />
        </div>

        {/* 5-Day Trend Charts */}
        <div className="mb-4">
          <ForecastChartCard
            data={forecastData}
            isLoading={isInitialLoading || forecastLoading}
          />
        </div>

        {/* Health Tips */}
        <div className="mb-4">
          <HealthTipsCard
            aqiData={aqiData}
            isLoading={isInitialLoading || aqiLoading}
            error={aqiError}
          />
        </div>

        {/* Activity Stats */}
        <div className="mb-4">
          <StatsCard data={statsData} isLoading={statsLoading} />
        </div>

        {/* 5-Day Forecast */}
        <div className="mb-4">
          <ForecastCard
            data={forecastData}
            isLoading={isInitialLoading || forecastLoading}
            error={forecastError}
          />
        </div>

        {/* User info strip */}
        <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm border border-brand-100 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <span className="text-xs text-brand-400 font-medium bg-brand-50 px-3 py-1 rounded-full">Member</span>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
