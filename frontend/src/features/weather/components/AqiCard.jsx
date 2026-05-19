// AQI levels follow OpenWeatherMap's 1–5 scale
const AQI_INFO = {
  1: { label: 'Good', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500' },
  2: { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', bar: 'bg-yellow-400' },
  3: { label: 'Moderate', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-500' },
  4: { label: 'Poor', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500' },
  5: { label: 'Very Poor', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', bar: 'bg-purple-600' },
};

const AqiCard = ({ data, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <p className="text-red-500 text-sm">Air quality data load হয়নি।</p>
      </div>
    );
  }

  const aqi = data.list[0].main.aqi;
  const components = data.list[0].components;
  const info = AQI_INFO[aqi];

  // Bar width: aqi 1→20%, 2→40%, 3→60%, 4→80%, 5→100%
  const barWidth = `${aqi * 20}%`;

  return (
    <div className={`bg-white rounded-xl border ${info.border} p-6 shadow-sm`}>
      <p className="text-gray-500 text-sm font-medium mb-3">Air Quality Index</p>

      {/* AQI score */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-4xl font-bold ${info.color}`}>{aqi}</span>
        <span className={`text-lg font-semibold ${info.color}`}>{info.label}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
        <div className={`${info.bar} h-2 rounded-full transition-all`} style={{ width: barWidth }}></div>
      </div>

      {/* Key pollutants */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`${info.bg} rounded-lg p-2 text-center`}>
          <p className="text-xs text-gray-500">PM2.5</p>
          <p className={`text-sm font-semibold ${info.color}`}>{components.pm2_5.toFixed(1)}</p>
        </div>
        <div className={`${info.bg} rounded-lg p-2 text-center`}>
          <p className="text-xs text-gray-500">PM10</p>
          <p className={`text-sm font-semibold ${info.color}`}>{components.pm10.toFixed(1)}</p>
        </div>
        <div className={`${info.bg} rounded-lg p-2 text-center`}>
          <p className="text-xs text-gray-500">CO</p>
          <p className={`text-sm font-semibold ${info.color}`}>{components.co.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
};

export default AqiCard;
