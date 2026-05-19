import { useState } from 'react';
import { MapPin } from 'lucide-react';
import useAuthStore from '@/features/auth/store/authStore';
import useGeolocation from '@/hooks/useGeolocation';
import useWeather from '@/features/weather/hooks/useWeather';
import useAirQuality from '@/features/weather/hooks/useAirQuality';
import useForecast from '@/features/weather/hooks/useForecast';
import WeatherCard from '@/features/weather/components/WeatherCard';
import AqiCard from '@/features/weather/components/AqiCard';
import ForecastCard from '@/features/weather/components/ForecastCard';
import CitySearchBar from '@/features/weather/components/CitySearchBar';
import Navbar from '@/components/organisms/Navbar';

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [selectedCity, setSelectedCity] = useState(null);

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
              Good day, {user?.name}! 👋
            </h2>
            {locationError && !selectedCity ? (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-500">{locationError}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-0.5">Here's today's weather overview</p>
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