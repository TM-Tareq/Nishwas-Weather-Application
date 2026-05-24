import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchCurrentWeather, fetchAirQuality } from '@/features/weather/api/weatherApi';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';
import { Wind, Droplets, Thermometer, Crown, Plus, X, BarChart2 } from 'lucide-react';

const BD_CITIES = [
  { name: 'Dhaka',       lat: 23.8103, lon: 90.4125 },
  { name: 'Chittagong',  lat: 22.3569, lon: 91.7832 },
  { name: 'Sylhet',      lat: 24.8949, lon: 91.8687 },
  { name: 'Rajshahi',    lat: 24.3745, lon: 88.6042 },
  { name: 'Khulna',      lat: 22.8456, lon: 89.5403 },
  { name: 'Barisal',     lat: 22.7010, lon: 90.3535 },
  { name: 'Rangpur',     lat: 25.7439, lon: 89.2752 },
  { name: 'Mymensingh',  lat: 24.7471, lon: 90.4203 },
  { name: 'Comilla',     lat: 23.4607, lon: 91.1809 },
  { name: 'Narayanganj', lat: 23.6238, lon: 90.4991 },
];

const AQI_META = {
  1: { label: 'Good',      gradient: 'from-emerald-400 to-emerald-600', badge: 'bg-emerald-100 text-emerald-800',  bar: 'from-emerald-400 to-emerald-500' },
  2: { label: 'Fair',      gradient: 'from-yellow-300 to-amber-500',    badge: 'bg-yellow-100 text-yellow-800',    bar: 'from-yellow-300 to-amber-400'    },
  3: { label: 'Moderate',  gradient: 'from-orange-400 to-orange-600',   badge: 'bg-orange-100 text-orange-800',    bar: 'from-orange-400 to-orange-500'   },
  4: { label: 'Poor',      gradient: 'from-red-400 to-red-600',         badge: 'bg-red-100 text-red-800',          bar: 'from-red-400 to-red-500'         },
  5: { label: 'Very Poor', gradient: 'from-purple-500 to-purple-700',   badge: 'bg-purple-100 text-purple-800',    bar: 'from-purple-500 to-purple-600'   },
};

const StatPill = ({ icon: Icon, label, value }) => (
  <div className="flex flex-col items-center bg-gray-50 rounded-xl px-2 py-2.5 gap-0.5">
    <Icon className="w-3.5 h-3.5 text-gray-400" />
    <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">{label}</span>
    <span className="text-sm font-bold text-gray-700">{value}</span>
  </div>
);

const PollutantBar = ({ label, value, max, unit }) => {
  const pct = value != null ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
        <span className="font-medium">{label}</span>
        <span>{value != null ? `${value.toFixed(1)} ${unit}` : '—'}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const CityCard = ({ city, weather, aqi, isWinner, onRemove, slotIdx, slots, onChangeCity }) => {
  const aqiLevel = aqi?.list?.[0]?.main?.aqi;
  const meta = AQI_META[aqiLevel] ?? AQI_META[3];
  const comp = aqi?.list?.[0]?.components ?? {};
  const temp = weather?.main?.temp;
  const humidity = weather?.main?.humidity;
  const wind = weather?.wind?.speed;
  const feelsLike = weather?.main?.feels_like;
  const iconCode = weather?.weather?.[0]?.icon;
  const usedNames = slots.filter(Boolean).map(s => s.name);

  return (
    <div className={`rounded-2xl overflow-hidden border-2 shadow-md bg-white flex flex-col transition-shadow
      ${isWinner ? 'border-yellow-400 shadow-lg shadow-yellow-100/60' : 'border-gray-200'}`}>

      {/* City selector row */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white">
        <select
          value={city.name}
          onChange={e => {
            const found = BD_CITIES.find(c => c.name === e.target.value);
            if (found) onChangeCity(slotIdx, found);
          }}
          className="flex-1 font-bold text-gray-800 text-base bg-transparent outline-none cursor-pointer"
        >
          {BD_CITIES.map(c => (
            <option
              key={c.name}
              value={c.name}
              disabled={usedNames.includes(c.name) && c.name !== city.name}
              className="text-gray-800 bg-white"
            >
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* AQI + temp gradient banner */}
      <div className={`relative bg-gradient-to-br ${meta.gradient} px-4 py-5`}>
        {isWinner && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-yellow-400/95 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
            <Crown className="w-3 h-3" /> Cleanest
          </span>
        )}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-white/75 text-xs font-semibold uppercase tracking-wider mb-0.5">Air Quality</div>
            <div className="text-white font-extrabold text-4xl leading-none">{aqiLevel ?? '—'}</div>
            <div className="text-white/90 font-semibold text-sm mt-1">{meta.label}</div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            {iconCode && (
              <img
                src={`https://openweathermap.org/img/wn/${iconCode}@2x.png`}
                alt="weather"
                className="w-12 h-12 drop-shadow"
              />
            )}
            <div className="text-3xl font-extrabold text-white">
              {temp != null ? `${Math.round(temp)}°C` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats + pollutants */}
      <div className="p-4 flex flex-col gap-4 flex-1">
        <div className="grid grid-cols-3 gap-2">
          <StatPill icon={Droplets}    label="Humidity" value={humidity != null ? `${humidity}%` : '—'}              />
          <StatPill icon={Wind}        label="Wind"     value={wind != null ? `${wind} m/s` : '—'}                   />
          <StatPill icon={Thermometer} label="Feels"    value={feelsLike != null ? `${Math.round(feelsLike)}°` : '—'} />
        </div>

        <div className="space-y-2.5">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pollutants</div>
          <PollutantBar label="PM2.5" value={comp.pm2_5} max={75}  unit="μg/m³" />
          <PollutantBar label="PM10"  value={comp.pm10}  max={150} unit="μg/m³" />
          <PollutantBar label="NO₂"   value={comp.no2}   max={200} unit="μg/m³" />
        </div>
      </div>
    </div>
  );
};

const EmptySlot = ({ onAdd }) => (
  <button
    onClick={onAdd}
    className="rounded-2xl border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50/50 transition-all duration-200 min-h-64 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-brand-600 group"
  >
    <div className="w-12 h-12 rounded-2xl border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
      <Plus className="w-6 h-6" />
    </div>
    <span className="text-sm font-semibold">Add City</span>
  </button>
);

const LoadingCard = ({ cityName }) => (
  <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-md min-h-64 flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    <div className="text-sm text-gray-400 font-medium">Loading {cityName}…</div>
  </div>
);

const ComparePage = () => {
  const [slots, setSlots] = useState([BD_CITIES[0], BD_CITIES[2], null]);

  const weatherResults = useQueries({
    queries: slots.map(city => ({
      queryKey: ['compare-weather', city?.lat, city?.lon],
      queryFn: () => fetchCurrentWeather({ lat: city.lat, lon: city.lon }),
      enabled: !!city,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const aqiResults = useQueries({
    queries: slots.map(city => ({
      queryKey: ['compare-aqi', city?.lat, city?.lon],
      queryFn: () => fetchAirQuality({ lat: city.lat, lon: city.lon }),
      enabled: !!city,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const combined = slots.map((city, i) => ({
    city,
    weather: weatherResults[i]?.data,
    aqi: aqiResults[i]?.data,
    loading: !!city && (weatherResults[i]?.isLoading || aqiResults[i]?.isLoading),
    aqiLevel: aqiResults[i]?.data?.list?.[0]?.main?.aqi,
  }));

  const filledWithData = combined.filter(r => r.city && r.aqiLevel != null);
  const minAqi = filledWithData.length > 1
    ? Math.min(...filledWithData.map(r => r.aqiLevel))
    : null;

  const handleRemove = (i) => {
    setSlots(prev => { const n = [...prev]; n[i] = null; return n; });
  };

  const handleAdd = () => {
    const usedNames = slots.filter(Boolean).map(s => s.name);
    const next = BD_CITIES.find(c => !usedNames.includes(c.name));
    if (!next) return;
    setSlots(prev => {
      const copy = [...prev];
      const emptyIdx = copy.findIndex(s => s === null);
      if (emptyIdx !== -1) copy[emptyIdx] = next;
      return copy;
    });
  };

  const handleChangeCity = (slotIdx, newCity) => {
    setSlots(prev => { const copy = [...prev]; copy[slotIdx] = newCity; return copy; });
  };

  const sortedForSummary = [...filledWithData].sort((a, b) => a.aqiLevel - b.aqiLevel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50/20 page-enter">
      <Navbar />
      <BottomNav />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-md shadow-brand-200 flex-shrink-0">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">City Comparison</h1>
            <p className="text-sm text-gray-500 mt-0.5">Compare real-time air quality across Bangladesh cities</p>
            <p className="text-xs text-gray-400 mt-1">
              🏆 Crown = cleanest air &nbsp;·&nbsp; Select up to 3 cities &nbsp;·&nbsp; Data refreshes every 5 min
            </p>
          </div>
        </div>

        {/* Comparison grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {combined.map((r, i) => {
            if (!r.city) return <EmptySlot key={`empty-${i}`} onAdd={handleAdd} />;
            if (r.loading) return <LoadingCard key={`loading-${i}`} cityName={r.city.name} />;
            return (
              <CityCard
                key={r.city.name}
                city={r.city}
                weather={r.weather}
                aqi={r.aqi}
                isWinner={minAqi != null && r.aqiLevel === minAqi}
                slotIdx={i}
                slots={slots}
                onRemove={() => handleRemove(i)}
                onChangeCity={handleChangeCity}
              />
            );
          })}
        </div>

        {/* AQI summary ranking — shown when 2+ cities have data */}
        {sortedForSummary.length >= 2 && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">AQI Ranking</h2>
            <div className="flex flex-col gap-4">
              {sortedForSummary.map((r, rank) => {
                const meta = AQI_META[r.aqiLevel] ?? AQI_META[3];
                const barPct = (r.aqiLevel / 5) * 100;
                return (
                  <div key={r.city.name} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-4 text-right">{rank + 1}</span>
                    <span className="font-semibold text-gray-800 w-28 text-sm">{r.city.name}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${meta.bar} transition-all duration-700`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${meta.badge}`}>
                      {meta.label}
                    </span>
                    {rank === 0 && <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparePage;
