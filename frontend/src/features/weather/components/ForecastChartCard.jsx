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

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-[130px]">
      <p className="font-semibold text-gray-600 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3 mb-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-500">{p.name}</span>
          </div>
          <span className="font-bold text-gray-800">
            {p.value}{p.unit}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ForecastChartCard = ({ data, isLoading }) => {
  const [tab, setTab] = useState('temp');

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-52 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!data?.list) return null;

  // Every 2nd entry = 6-hour intervals → ~20 points across 5 days
  const chartData = data.list
    .filter((_, i) => i % 2 === 0)
    .map((item) => ({
      time: format(new Date(item.dt * 1000), 'EEE HH:mm'),
      temp: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      pop: Math.round((item.pop ?? 0) * 100),
    }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

      {/* Header + Tab switcher */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          5-Day Trends
        </p>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                tab === id
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        {tab === 'temp' ? (
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              unit="°"
              width={30}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="temp"
              name="Temperature"
              stroke="#22c55e"
              strokeWidth={2.5}
              fill="url(#tempGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#16a34a' }}
              unit="°C"
            />
            <Line
              type="monotone"
              dataKey="feelsLike"
              name="Feels Like"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 3, fill: '#94a3b8' }}
              unit="°C"
            />
          </ComposedChart>
        ) : (
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              unit="%"
              width={30}
              domain={[0, 100]}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar
              dataKey="pop"
              name="Rain Chance"
              fill="#bae6fd"
              radius={[3, 3, 0, 0]}
              unit="%"
              maxBarSize={14}
            />
            <Line
              type="monotone"
              dataKey="humidity"
              name="Humidity"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6' }}
              unit="%"
            />
          </ComposedChart>
        )}
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-3">
        {tab === 'temp' ? (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-green-500 rounded-full" />
              <span className="text-[11px] text-gray-500">Temperature</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 border-t-2 border-dashed border-gray-400" />
              <span className="text-[11px] text-gray-500">Feels Like</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-200 rounded-sm" />
              <span className="text-[11px] text-gray-500">Rain Chance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-blue-500 rounded-full" />
              <span className="text-[11px] text-gray-500">Humidity</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForecastChartCard;
