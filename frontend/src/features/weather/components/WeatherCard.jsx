import { Wind, Droplets, Thermometer } from 'lucide-react';

const WeatherCard = ({ data, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <p className="text-red-500 text-sm">Weather data load হয়নি। আবার try করো।</p>
      </div>
    );
  }

  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const humidity = data.main.humidity;
  const windSpeed = (data.wind.speed * 3.6).toFixed(1); // m/s → km/h
  const description = data.weather[0].description;
  const iconCode = data.weather[0].icon;
  const cityName = data.name;
  const country = data.sys.country;

  return (
    <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-6 text-white shadow-sm">
      {/* City */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-brand-200 text-sm font-medium">Current Weather</p>
          <h3 className="text-xl font-bold">{cityName}, {country}</h3>
        </div>
        <img
          src={`https://openweathermap.org/img/wn/${iconCode}@2x.png`}
          alt={description}
          className="w-16 h-16"
        />
      </div>

      {/* Temperature */}
      <div className="mb-4">
        <span className="text-6xl font-bold">{temp}°</span>
        <span className="text-brand-200 ml-1 text-xl">C</span>
        <p className="text-brand-200 capitalize mt-1">{description}</p>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-brand-500">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-brand-200" />
          <div>
            <p className="text-xs text-brand-200">Feels like</p>
            <p className="text-sm font-medium">{feelsLike}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="w-4 h-4 text-brand-200" />
          <div>
            <p className="text-xs text-brand-200">Humidity</p>
            <p className="text-sm font-medium">{humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-4 h-4 text-brand-200" />
          <div>
            <p className="text-xs text-brand-200">Wind</p>
            <p className="text-sm font-medium">{windSpeed} km/h</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
