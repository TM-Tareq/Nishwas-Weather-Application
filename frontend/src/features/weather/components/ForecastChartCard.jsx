import { useState } from 'react';
import {
  ComposedChart, Area, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { Thermometer, CloudRain } from 'lucide-react';

const TABS = [
  { id: 'temp', label: 'Temperature', icon: Thermometer },
  { id: 'rain', label: 'Rain & Humidity', icon: CloudRain },
];

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass border border-white/10 rounded-xl shadow-2xl px-3 py-2.5 text-xs min-w-[130px]">
      <p className="font-semibold text-white/60 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3 mb-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-white/40">{p.name}</span>
          </div>
          <span className="font-bold text-white">{p.value}{p.unit}</span>
        </div>
      ))}
    </div>
  );
};

const ForecastChartCard = ({ data, isLoading }) => {
  const [tab, setTab] = useState('temp');

  if (isLoading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="h-3.5 bg-white/5 rounded w-1/3 mb-4" />
        <div className="h-52 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (!data?.list) return null;

  const chartData = data.list
    .filter((_, i) => i % 2 === 0)
    .map((item) => ({
      time:      format(new Date(item.dt * 1000), 'EEE HH:mm'),
      temp:      Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity:  item.main.humidity,
      pop:       Math.round((item.pop ?? 0) * 100),
    }));

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">5-Day Trends</p>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                tab === id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        {tab === 'temp' ? (
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} tickLine={false} axisLine={false} unit="°" width={30} />
            <Tooltip content={<DarkTooltip />} />
            <Area type="monotone" dataKey="temp" name="Temperature" stroke="#10B981" strokeWidth={2.5} fill="url(#tempGrad)" dot={false} activeDot={{ r: 4, fill: '#059669' }} unit="°C" />
            <Line type="monotone" dataKey="feelsLike" name="Feels Like" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 4" dot={false} activeDot={{ r: 3, fill: '#94a3b8' }} unit="°C" />
          </ComposedChart>
        ) : (
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} tickLine={false} axisLine={false} unit="%" width={30} domain={[0, 100]} />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="pop" name="Rain Chance" fill="rgba(56,189,248,0.25)" radius={[3, 3, 0, 0]} unit="%" maxBarSize={14} />
            <Line type="monotone" dataKey="humidity" name="Humidity" stroke="#38bdf8" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#38bdf8' }} unit="%" />
          </ComposedChart>
        )}
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-5 mt-3">
        {tab === 'temp' ? (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-emerald-500 rounded-full" />
              <span className="text-[11px] text-white/30">Temperature</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 border-t-2 border-dashed border-slate-400" />
              <span className="text-[11px] text-white/30">Feels Like</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(56,189,248,0.25)' }} />
              <span className="text-[11px] text-white/30">Rain Chance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-sky-400 rounded-full" />
              <span className="text-[11px] text-white/30">Humidity</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForecastChartCard;
