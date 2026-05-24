import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, BarChart,
} from 'recharts';
import { format } from 'date-fns';
import {
  TrendingUp, BarChart2, BookHeart, Wind, Smile, Activity,
  Crown, Droplets, Thermometer, Loader2, ArrowRight,
} from 'lucide-react';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';
import { useMyDiary } from '@/features/diary/hooks/useMyDiary';
import { fetchCurrentWeather, fetchAirQuality } from '@/features/weather/api/weatherApi';

//  Constants 
const FEELING_SCORE = { GOOD: 4, OKAY: 3, UNWELL: 2, SICK: 1 };
const FEELING_EMOJI = { GOOD: '😊', OKAY: '😐', UNWELL: '😷', SICK: '🤒' };

const AQI_COLOR = { 1: '#10b981', 2: '#f59e0b', 3: '#f97316', 4: '#ef4444', 5: '#9333ea' };

const AQI_META = {
  1: { label: 'Good',      gradient: 'from-emerald-500 to-emerald-700', text: 'text-emerald-400', bar: 'from-emerald-400 to-emerald-500', badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' },
  2: { label: 'Fair',      gradient: 'from-yellow-400 to-amber-600',    text: 'text-yellow-400',  bar: 'from-yellow-400 to-amber-400',    badge: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'   },
  3: { label: 'Moderate',  gradient: 'from-orange-400 to-orange-600',   text: 'text-orange-400',  bar: 'from-orange-400 to-orange-500',   badge: 'bg-orange-500/15 border-orange-500/30 text-orange-400'   },
  4: { label: 'Poor',      gradient: 'from-red-500 to-red-700',         text: 'text-red-400',     bar: 'from-red-400 to-red-500',         badge: 'bg-red-500/15 border-red-500/30 text-red-400'            },
  5: { label: 'Very Poor', gradient: 'from-purple-500 to-purple-700',   text: 'text-purple-400',  bar: 'from-purple-500 to-purple-600',   badge: 'bg-purple-500/15 border-purple-500/30 text-purple-400'   },
};

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
  { name: 'Narayanganj', lat: 23.6238, lon: 90.4995 },
];

const SYMPTOMS_ALL = [
  'Cough', 'Runny Nose', 'Headache', 'Eye Irritation',
  'Chest Tightness', 'Fatigue', 'Shortness of Breath', 'Throat Irritation',
];

//  Custom dark tooltip 
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass border border-white/10 rounded-xl px-3 py-2.5 text-xs min-w-[150px]">
      <p className="font-semibold text-white/60 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-3 mb-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-white/40">{p.name}</span>
          </div>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

//  Stat card 
const StatCard = ({ icon: Icon, label, value, sub, iconClass }) => (
  <div className="glass-card p-4 flex items-center gap-4">
    <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
      <Icon className={`w-5 h-5 ${iconClass}`} />
    </div>
    <div>
      <p className="text-[10px] text-white/30 font-medium uppercase tracking-wide leading-none mb-0.5">{label}</p>
      <p className="text-xl font-extrabold text-white leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
    </div>
  </div>
);

//  Insights Tab
const InsightsTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: history, isLoading } = useMyDiary();
  const entries = history ?? [];

  const totalEntries  = entries.length;
  const aqiEntries    = entries.filter(e => e.aqiAtTime != null);
  const avgAqi        = aqiEntries.length ? (aqiEntries.reduce((s, e) => s + e.aqiAtTime, 0) / aqiEntries.length).toFixed(1) : null;

  const feelingCounts = entries.reduce((acc, e) => { acc[e.feeling] = (acc[e.feeling] ?? 0) + 1; return acc; }, {});
  const topFeeling    = Object.entries(feelingCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const symptomCounts = {};
  entries.forEach(e => (e.symptoms ?? []).forEach(s => { symptomCounts[s] = (symptomCounts[s] ?? 0) + 1; }));
  const topSymptom    = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const chartData = [...entries].slice(0, 14).reverse().map(e => ({
    date:       format(new Date(e.date), 'MMM d'),
    aqi:        e.aqiAtTime ?? null,
    aqiColor:   AQI_COLOR[e.aqiAtTime] ?? '#94a3b8',
    feeling:    FEELING_SCORE[e.feeling] ?? null,
  }));

  const symptomChart = SYMPTOMS_ALL
    .map(s => ({ symptom: s, count: symptomCounts[s] ?? 0 }))
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 gap-3 text-white/30">
      <Loader2 className="w-6 h-6 animate-spin" /> {t('analytics.insights.loading')}
    </div>
  );

  if (totalEntries === 0) return (
    <div className="text-center py-16 px-4">
      <span className="text-6xl block mb-4">📊</span>
      <p className="text-lg font-bold text-white mb-1">{t('analytics.insights.empty')}</p>
      <p className="text-sm text-white/30 mb-6">{t('analytics.insights.emptyDesc')}</p>
      <button
        onClick={() => navigate('/biometrics?tab=diary')}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
      >
        <BookHeart className="w-4 h-4" />
        {t('analytics.insights.logBtn')}
        <ArrowRight className="w-4 h-4" />
      </button>
      <p className="text-xs text-white/20 mt-4">{t('analytics.insights.logHint')}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={BookHeart}  label={t('analytics.insights.daysLogged')} value={totalEntries} sub={t('analytics.insights.daysLoggedSub')} iconClass="text-emerald-400" />
        <StatCard icon={Wind}       label={t('analytics.insights.avgAqi')}     value={avgAqi ?? '—'} sub={avgAqi ? t(`aqi.level.${Math.round(avgAqi)}`) : t('analytics.insights.noAqiData')} iconClass="text-orange-400" />
        <StatCard icon={Smile}      label={t('analytics.insights.topFeeling')} value={topFeeling ? `${FEELING_EMOJI[topFeeling]} ${t(`biometrics.feelings.${topFeeling}`)}` : '—'} sub={topFeeling ? `${feelingCounts[topFeeling]} days` : ''} iconClass="text-emerald-400" />
        <StatCard icon={Activity}   label={t('analytics.insights.topSymptom')} value={topSymptom ?? '—'} sub={topSymptom ? `${symptomCounts[topSymptom]} times` : t('analytics.insights.none')} iconClass="text-red-400" />
      </div>

      {/* AQI vs Feeling chart */}
      {chartData.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold text-white mb-1">{t('analytics.insights.aqiChart')}</h2>
          <p className="text-xs text-white/30 mb-5">{t('analytics.insights.aqiChartDesc')}</p>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
              <YAxis yAxisId="aqi" domain={[0, 5]} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
              <YAxis yAxisId="feel" orientation="right" domain={[0, 5]} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
              <Tooltip content={<DarkTooltip />} />
              <Bar yAxisId="aqi" dataKey="aqi" name="AQI" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {chartData.map((e, i) => <Cell key={i} fill={e.aqiColor} fillOpacity={0.8} />)}
              </Bar>
              <Line yAxisId="feel" type="monotone" dataKey="feeling" name={t('analytics.insights.feeling')} stroke="#10b981" strokeWidth={2.5}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/5">
            {[1, 2, 3, 4, 5].map(lvl => (
              <div key={lvl} className="flex items-center gap-1.5 text-xs text-white/40">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: AQI_COLOR[lvl] }} />{t(`aqi.level.${lvl}`)}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-white/40 ml-2">
              <div className="w-6 h-0.5 bg-emerald-400 rounded" />{t('analytics.insights.feeling')}
            </div>
          </div>
        </div>
      )}

      {/* Symptom frequency */}
      {symptomChart.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold text-white mb-1">{t('analytics.insights.symptomChart')}</h2>
          <p className="text-xs text-white/30 mb-5">{t('analytics.insights.symptomChartDesc')}</p>
          <ResponsiveContainer width="100%" height={symptomChart.length * 38 + 20}>
            <BarChart data={symptomChart} layout="vertical" margin={{ top: 0, right: 32, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
              <YAxis type="category" dataKey="symptom" width={130} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
              <Tooltip formatter={v => [`${v} time${v > 1 ? 's' : ''}`, 'Reported']} contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" name="Times" fill="#10b981" fillOpacity={0.8} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Feeling breakdown */}
      {Object.keys(feelingCounts).length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold text-white mb-4">{t('analytics.insights.feelingBreakdown')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['GOOD', 'OKAY', 'UNWELL', 'SICK'].map(key => {
              const count = feelingCounts[key] ?? 0;
              const pct   = totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0;
              return (
                <div key={key} className="text-center p-3 glass rounded-xl">
                  <div className="text-2xl mb-1">{FEELING_EMOJI[key]}</div>
                  <div className="text-lg font-extrabold text-white">{pct}%</div>
                  <div className="text-xs text-white/40 font-medium">{t(`biometrics.feelings.${key}`)}</div>
                  <div className="text-xs text-white/20 mt-0.5">{count} day{count !== 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

//  Compare Tab
const CompareTab = () => {
  const { t } = useTranslation();
  const [slots, setSlots] = useState([BD_CITIES[0], BD_CITIES[1]]);

  const queries = useQueries({
    queries: slots.flatMap((city, i) => [
      { queryKey: ['weather', city.lat, city.lon], queryFn: () => fetchCurrentWeather(city), staleTime: 600000 },
      { queryKey: ['aqi',     city.lat, city.lon], queryFn: () => fetchAirQuality(city),     staleTime: 600000 },
    ]),
  });

  const cityData = slots.map((city, i) => ({
    city,
    weather: queries[i * 2]?.data,
    aqi:     queries[i * 2 + 1]?.data,
    loading: queries[i * 2]?.isLoading || queries[i * 2 + 1]?.isLoading,
  }));

  const aqiLevels  = cityData.map(d => d.aqi?.list?.[0]?.main?.aqi);
  const winnerIdx  = aqiLevels.reduce((bi, v, i) => {
    if (v == null) return bi;
    if (bi == null) return i;
    return v < aqiLevels[bi] ? i : bi;
  }, null);

  const addCity = () => {
    if (slots.length >= 4) return;
    const next = BD_CITIES.find(c => !slots.find(s => s.name === c.name));
    if (next) setSlots(s => [...s, next]);
  };

  const removeCity = (i) => setSlots(s => s.filter((_, idx) => idx !== i));

  const changeCity = (i, city) => setSlots(s => s.map((c, idx) => idx === i ? city : c));

  // ── Compare Summary ─────────────────────────────────────────────────────────
  const loadedCities = cityData.filter(d => d.weather && d.aqi && !d.loading);
  const withAqi = loadedCities
    .map(d => ({ ...d, lvl: d.aqi?.list?.[0]?.main?.aqi, pm25: d.aqi?.list?.[0]?.components?.pm2_5 }))
    .filter(d => d.lvl != null);

  const cleanest = withAqi.length ? withAqi.reduce((a, b) => a.lvl < b.lvl ? a : b) : null;
  const dirtiest = withAqi.length > 1 ? withAqi.reduce((a, b) => a.lvl > b.lvl ? a : b) : null;
  const avgLvl   = withAqi.length ? (withAqi.reduce((s, d) => s + d.lvl, 0) / withAqi.length).toFixed(1) : null;
  const aqiDiff  = cleanest && dirtiest ? dirtiest.lvl - cleanest.lvl : 0;

  const summaryText = () => {
    if (!cleanest || withAqi.length < 2) return null;
    if (aqiDiff === 0)
      return `All compared cities have similar air quality today (AQI ${cleanest.lvl} · ${AQI_META[cleanest.lvl]?.label}).`;
    if (cleanest.lvl <= 2 && dirtiest.lvl >= 4)
      return `${cleanest.city.name} has significantly cleaner air than ${dirtiest.city.name}. Sensitive individuals should avoid ${dirtiest.city.name} for outdoor activities today.`;
    if (cleanest.lvl <= 2)
      return `${cleanest.city.name} has the best air quality today. Outdoor activities are safe there.`;
    if (dirtiest.lvl >= 4)
      return `Air quality is poor across most compared cities. Wearing an N95 mask is recommended for all outdoor activities.`;
    return `${cleanest.city.name} leads with the cleanest air (AQI ${cleanest.lvl}), while ${dirtiest.city.name} has the highest pollution (AQI ${dirtiest.lvl}) today.`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30">{t('analytics.compare.hint')}</p>
        {slots.length < 4 && (
          <button onClick={addCity} className="glass-accent text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl">
            {t('analytics.compare.addCity')}
          </button>
        )}
      </div>

      {/* ── Summary card ── */}
      {summaryText() && (
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-white">{t('analytics.compare.summary')}</h2>

          <p className="text-sm text-white/60 leading-relaxed">{summaryText()}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cleanest && (
              <div className="glass px-3 py-3 rounded-xl text-center">
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{t('analytics.compare.cleanest')}</p>
                <p className="text-sm font-extrabold text-emerald-400">{cleanest.city.name}</p>
                <p className="text-xs text-white/40 mt-0.5">AQI {cleanest.lvl} · {t(`aqi.level.${cleanest.lvl}`)}</p>
              </div>
            )}
            {dirtiest && dirtiest.city.name !== cleanest?.city.name && (
              <div className="glass px-3 py-3 rounded-xl text-center">
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{t('analytics.compare.polluted')}</p>
                <p className={`text-sm font-extrabold ${AQI_META[dirtiest.lvl]?.text ?? 'text-red-400'}`}>{dirtiest.city.name}</p>
                <p className="text-xs text-white/40 mt-0.5">AQI {dirtiest.lvl} · {t(`aqi.level.${dirtiest.lvl}`)}</p>
              </div>
            )}
            {avgLvl && (
              <div className="glass px-3 py-3 rounded-xl text-center">
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{t('analytics.compare.avgAqi')}</p>
                <p className={`text-sm font-extrabold ${AQI_META[Math.round(avgLvl)]?.text ?? 'text-white'}`}>{avgLvl}</p>
                <p className="text-xs text-white/40 mt-0.5">{t(`aqi.level.${Math.round(avgLvl)}`)}</p>
              </div>
            )}
            {aqiDiff > 0 && (
              <div className="glass px-3 py-3 rounded-xl text-center">
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{t('analytics.compare.aqiGap')}</p>
                <p className="text-sm font-extrabold text-white">{aqiDiff} level{aqiDiff > 1 ? 's' : ''}</p>
                <p className="text-xs text-white/40 mt-0.5">{t('analytics.compare.bestWorst')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`grid gap-4 ${slots.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : slots.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
        {cityData.map(({ city, weather, aqi, loading }, i) => {
          const aqiLevel = aqi?.list?.[0]?.main?.aqi;
          const meta     = AQI_META[aqiLevel] ?? AQI_META[3];
          const comp     = aqi?.list?.[0]?.components ?? {};
          const temp     = weather?.main?.temp;
          const humidity = weather?.main?.humidity;
          const wind     = weather?.wind?.speed;
          const icon     = weather?.weather?.[0]?.icon;
          const usedNames = slots.filter(Boolean).map(s => s.name);

          return (
            <div key={i} className={`glass-card overflow-hidden ${i === winnerIdx ? 'neon-border' : ''}`}>
              {/* City selector */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
                <select
                  value={city.name}
                  onChange={e => { const found = BD_CITIES.find(c => c.name === e.target.value); if (found) changeCity(i, found); }}
                  className="flex-1 font-bold text-sm outline-none cursor-pointer rounded px-1"
                >
                  {BD_CITIES.map(c => (
                    <option key={c.name} value={c.name} disabled={usedNames.includes(c.name) && c.name !== city.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {slots.length > 2 && (
                  <button onClick={() => removeCity(i)} className="text-white/20 hover:text-red-400 transition-colors">
                    ✕
                  </button>
                )}
              </div>

              {/* AQI banner */}
              <div className={`relative bg-gradient-to-br ${meta.gradient} px-4 py-4`} style={{ background: 'rgba(15,23,42,0.5)' }}>
                {i === winnerIdx && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3" />{t('analytics.compare.cleanest')}
                  </span>
                )}
                {loading ? (
                  <div className="flex items-center gap-2 text-white/30"><Loader2 className="w-4 h-4 animate-spin" />{t('analytics.compare.loading')}</div>
                ) : (
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">{t('analytics.compare.airQuality')}</p>
                      <p className={`text-4xl font-extrabold ${meta.text}`}>{aqiLevel ?? '—'}</p>
                      <p className={`text-sm font-bold ${meta.text} mt-0.5`}>{aqiLevel ? t(`aqi.level.${aqiLevel}`) : ''}</p>
                    </div>
                    <div className="text-right">
                      {icon && <img src={`https://openweathermap.org/img/wn/${icon}@2x.png`} alt="" className="w-10 h-10 ml-auto" />}
                      <p className="text-2xl font-extrabold text-white">{temp != null ? `${Math.round(temp)}°` : '—'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              {!loading && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      [Droplets, 'Humid', humidity != null ? `${humidity}%` : '—'],
                      [Wind,     'Wind',  wind != null ? `${wind.toFixed(1)} m/s` : '—'],
                      [Thermometer, 'Feels', weather?.main?.feels_like != null ? `${Math.round(weather.main.feels_like)}°` : '—'],
                    ].map(([Icon, lbl, val]) => (
                      <div key={lbl} className="glass px-2 py-2 rounded-xl text-center">
                        <Icon className="w-3.5 h-3.5 text-white/30 mx-auto mb-1" />
                        <p className="text-[10px] text-white/30 leading-none">{lbl}</p>
                        <p className="text-xs font-bold text-white mt-0.5">{val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">{t('analytics.compare.pollutants')}</p>
                    {[['PM2.5', comp.pm2_5, 75], ['PM10', comp.pm10, 150], ['NO₂', comp.no2, 200]].map(([lbl, val, max]) => (
                      <div key={lbl}>
                        <div className="flex justify-between text-xs text-white/40 mb-1">
                          <span className="font-medium">{lbl}</span>
                          <span>{val != null ? `${val.toFixed(1)} μg/m³` : '—'}</span>
                        </div>
                        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${meta.bar} transition-all duration-700`}
                            style={{ width: val != null ? `${Math.min((val / max) * 100, 100)}%` : '0%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

//  Analytics Page
const AnalyticsPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultTab     = searchParams.get('tab') === 'compare' ? 'compare' : 'insights';
  const [tab, setTab]  = useState(defaultTab);

  const TABS = [
    { id: 'insights', label: t('analytics.tabInsights'), icon: TrendingUp },
    { id: 'compare',  label: t('analytics.tabCompare'),  icon: BarChart2  },
  ];

  return (
    <div className="min-h-screen bg-page page-enter">
      <Navbar />
      <BottomNav />

      <div className="max-w-1440 mx-auto px-4 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">{t('analytics.title')}</h1>
            <p className="text-xs text-white/30">{t('analytics.subtitle')}</p>
          </div>
        </div>

        <div className="flex glass-card p-1 gap-1 mb-6">
          {TABS.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className={`flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tab === tb.id ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-white/40 hover:text-white/70'
              }`}>
              <tb.icon className="w-3.5 h-3.5" />{tb.label}
            </button>
          ))}
        </div>

        <div className="page-enter">
          {tab === 'insights' ? <InsightsTab /> : <CompareTab />}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
