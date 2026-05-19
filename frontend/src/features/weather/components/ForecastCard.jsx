import { format } from 'date-fns';

const getDailyForecasts = (list) => {
  const days = {};
  list.forEach((item) => {
    const date = item.dt_txt.split(' ')[0];
    const hour = item.dt_txt.split(' ')[1];
    if (!days[date] || hour === '12:00:00') {
      days[date] = item;
    }
  });
  return Object.values(days).slice(1, 6);
};

// Gradient per weather condition
const getConditionStyle = (main) => {
  const styles = {
    Clear:        { bg: 'from-amber-400 to-orange-400',   text: 'text-amber-50' },
    Clouds:       { bg: 'from-slate-400 to-slate-500',    text: 'text-slate-50' },
    Rain:         { bg: 'from-blue-500 to-blue-700',      text: 'text-blue-50' },
    Drizzle:      { bg: 'from-sky-400 to-blue-500',       text: 'text-sky-50' },
    Thunderstorm: { bg: 'from-purple-600 to-gray-800',    text: 'text-purple-50' },
    Snow:         { bg: 'from-sky-200 to-blue-300',       text: 'text-sky-900' },
    Haze:         { bg: 'from-yellow-300 to-orange-300',  text: 'text-yellow-900' },
    Mist:         { bg: 'from-gray-300 to-gray-400',      text: 'text-gray-700' },
  };
  return styles[main] || { bg: 'from-brand-500 to-brand-600', text: 'text-white' };
};

const ForecastCard = ({ data, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-5"></div>
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-6">
        <p className="text-red-400 text-sm">Forecast data load হয়নি।</p>
      </div>
    );
  }

  const forecasts = getDailyForecasts(data.list);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">5-Day Forecast</p>

      <div className="grid grid-cols-5 gap-3">
        {forecasts.map((item, index) => {
          const date       = new Date(item.dt * 1000);
          const dayName    = index === 0 ? 'Tomorrow' : format(date, 'EEE');
          const dateLabel  = format(date, 'MMM d');
          const temp       = Math.round(item.main.temp);
          const feelsLike  = Math.round(item.main.feels_like);
          const iconCode   = item.weather[0].icon;
          const condition  = item.weather[0].main;
          const { bg, text } = getConditionStyle(condition);

          return (
            <div
              key={index}
              className={`bg-gradient-to-b ${bg} rounded-2xl p-3 flex flex-col items-center gap-1 shadow-sm hover:scale-105 transition-transform duration-200`}
            >
              <p className={`text-xs font-bold ${text} opacity-90`}>{dayName}</p>
              <p className={`text-[10px] ${text} opacity-60`}>{dateLabel}</p>
              <img
                src={`https://openweathermap.org/img/wn/${iconCode}@2x.png`}
                alt={condition}
                className="w-14 h-14 drop-shadow-md"
              />
              <p className={`text-lg font-extrabold ${text}`}>{temp}°</p>
              <p className={`text-[10px] ${text} opacity-70`}>Feels {feelsLike}°</p>
              <p className={`text-[10px] ${text} opacity-80 font-medium`}>{condition}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ForecastCard;
