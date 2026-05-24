import { Wind } from 'lucide-react';
import { format } from 'date-fns';

const AQI_META = {
  1: { label: 'Good',      circle: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'rgba(16,185,129,0.08)' },
  2: { label: 'Fair',      circle: 'bg-yellow-400',  text: 'text-yellow-400',  border: 'border-yellow-500/20',  bg: 'rgba(234,179,8,0.08)'  },
  3: { label: 'Moderate',  circle: 'bg-orange-500',  text: 'text-orange-400',  border: 'border-orange-500/20',  bg: 'rgba(249,115,22,0.08)' },
  4: { label: 'Poor',      circle: 'bg-red-500',     text: 'text-red-400',     border: 'border-red-500/20',     bg: 'rgba(239,68,68,0.08)'  },
  5: { label: 'Very Poor', circle: 'bg-purple-600',  text: 'text-purple-400',  border: 'border-purple-500/20',  bg: 'rgba(168,85,247,0.08)' },
};

const getDailyAqi = (list) => {
  if (!list?.length) return [];
  const days = {};
  list.forEach(item => {
    const key = new Date(item.dt * 1000).toISOString().split('T')[0];
    if (!days[key]) days[key] = { dt: item.dt, items: [] };
    days[key].items.push(item);
  });
  const today = new Date().toISOString().split('T')[0];
  return Object.entries(days)
    .filter(([k]) => k > today)
    .slice(0, 5)
    .map(([, { dt, items }]) => ({
      dt,
      aqi:  Math.max(...items.map(i => i.main.aqi)),
      pm25: (items.reduce((s, i) => s + (i.components.pm2_5 ?? 0), 0) / items.length).toFixed(1),
    }));
};

const AqiForecastCard = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="h-3.5 bg-white/5 rounded w-1/3 mb-5" />
        <div className="grid grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data?.list?.length) return null;

  const days = getDailyAqi(data.list);
  if (!days.length) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wind className="w-4 h-4 text-emerald-400" />
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">5-Day AQI Forecast</p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {days.map(({ dt, aqi, pm25 }, i) => {
          const meta = AQI_META[aqi] ?? AQI_META[1];
          const date = new Date(dt * 1000);
          return (
            <div
              key={i}
              className={`flex flex-col items-center gap-1.5 rounded-xl border ${meta.border} p-2 sm:p-3`}
              style={{ background: meta.bg }}
            >
              <p className="text-[10px] font-bold text-white/50 uppercase">
                {i === 0 ? 'Tmrw' : format(date, 'EEE')}
              </p>
              <p className="text-[10px] text-white/30">{format(date, 'MMM d')}</p>
              <div className={`w-9 h-9 rounded-full ${meta.circle} flex items-center justify-center mt-0.5 shadow-sm`}>
                <span className="text-sm font-extrabold text-white">{aqi}</span>
              </div>
              <p className={`text-[10px] font-bold ${meta.text} text-center leading-tight`}>
                {meta.label}
              </p>
              <p className="text-[10px] text-white/30 text-center leading-tight mt-0.5">
                PM2.5<br />
                <span className={`font-semibold ${meta.text}`}>{pm25}</span>
                <span className="text-[9px]"> μg/m³</span>
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-white/20 mt-3 text-right">
        Worst-case daily AQI · PM2.5 daily avg
      </p>
    </div>
  );
};

export default AqiForecastCard;
