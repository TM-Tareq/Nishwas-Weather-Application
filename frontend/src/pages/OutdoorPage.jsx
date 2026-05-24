import { useState } from 'react';
import {
  MapPin, Clock, ShieldAlert, Wind, Droplets, Thermometer,
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, Info, Sun,
} from 'lucide-react';
import useProfileStore from '@/features/profile/store/profileStore';
import useGeolocation from '@/hooks/useGeolocation';
import useWeather from '@/features/weather/hooks/useWeather';
import useAirQuality from '@/features/weather/hooks/useAirQuality';
import useForecast from '@/features/weather/hooks/useForecast';
import useDecisionEngine from '@/features/suggestion/hooks/useDecisionEngine';
import CitySearchBar from '@/features/weather/components/CitySearchBar';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';

//  Config 

const HEALTH_PROFILES = [
  { id: 'general',       icon: '🏃', label: 'General' },
  { id: 'asthma',        icon: '🌬️', label: 'Asthma' },
  { id: 'heart',         icon: '❤️', label: 'Heart' },
  { id: 'child_elderly', icon: '👶', label: 'Child / Elderly' },
  { id: 'pregnant',      icon: '🤰', label: 'Pregnant' },
];

const AQI_META = {
  1: { label: 'Good',      dot: 'bg-green-500',  text: 'text-green-700',  gradient: 'from-green-500 to-emerald-600' },
  2: { label: 'Fair',      dot: 'bg-yellow-400', text: 'text-yellow-700', gradient: 'from-yellow-400 to-amber-500' },
  3: { label: 'Moderate',  dot: 'bg-orange-400', text: 'text-orange-700', gradient: 'from-orange-400 to-orange-600' },
  4: { label: 'Poor',      dot: 'bg-red-500',    text: 'text-red-700',    gradient: 'from-red-500 to-red-700' },
  5: { label: 'Very Poor', dot: 'bg-purple-600', text: 'text-purple-700', gradient: 'from-purple-600 to-purple-900' },
};

const PARAMETERS = [
  {
    key: 'pm2_5', label: 'PM2.5', unit: 'µg/m³', icon: '🫁',
    desc: 'Fine Particulate Matter',
    effect: 'Ultra-fine particles (< 2.5µm) that bypass the nose and throat, entering deep into the lungs and bloodstream. Long-term exposure causes respiratory and cardiovascular disease.',
    thresholds: { good: 10, fair: 25, moderate: 50, poor: 75 },
  },
  {
    key: 'pm10', label: 'PM10', unit: 'µg/m³', icon: '😤',
    desc: 'Coarse Particulate Matter',
    effect: 'Larger particles (< 10µm) that irritate the nose, throat and airways. Can carry pollen, mold and other allergens. Aggravates asthma and bronchitis.',
    thresholds: { good: 20, fair: 50, moderate: 100, poor: 200 },
  },
  {
    key: 'co', label: 'CO', unit: 'µg/m³', icon: '💨',
    desc: 'Carbon Monoxide',
    effect: 'Colorless, odorless gas from vehicle exhaust and combustion. Reduces oxygen delivery in the blood. Causes headache and dizziness at elevated levels. Dangerous at very high concentrations.',
    thresholds: { good: 4400, fair: 9400, moderate: 12400, poor: 15400 },
  },
  {
    key: 'no2', label: 'NO₂', unit: 'µg/m³', icon: '🏭',
    desc: 'Nitrogen Dioxide',
    effect: 'From traffic and industrial combustion. Inflames the airways, worsens asthma, and increases susceptibility to respiratory infections. Key contributor to smog formation.',
    thresholds: { good: 40, fair: 70, moderate: 150, poor: 200 },
  },
  {
    key: 'o3', label: 'O₃', unit: 'µg/m³', icon: '☀️',
    desc: 'Ground-level Ozone',
    effect: 'Formed by sunlight reacting with vehicle emissions. Triggers asthma attacks, causes chest pain and coughing. Damages lung tissue with prolonged exposure, especially in summer.',
    thresholds: { good: 60, fair: 100, moderate: 140, poor: 180 },
  },
  {
    key: 'so2', label: 'SO₂', unit: 'µg/m³', icon: '⚗️',
    desc: 'Sulfur Dioxide',
    effect: 'From burning coal and oil in power plants and factories. Irritates eyes, nose and throat. Triggers asthma attacks and can cause acid rain when combined with moisture.',
    thresholds: { good: 20, fair: 80, moderate: 250, poor: 350 },
  },
];

//  Helpers 

const getParamStatus = (value, t) => {
  if (value <= t.good)     return { label: 'Safe',     color: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50' };
  if (value <= t.fair)     return { label: 'Fair',     color: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50' };
  if (value <= t.moderate) return { label: 'Moderate', color: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-50' };
  return                          { label: 'Poor',     color: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50' };
};

const fmt = (v) => (v < 10 ? v.toFixed(2) : v < 1000 ? v.toFixed(1) : Math.round(v).toLocaleString());

//  Sub-components 

const ParameterRow = ({ param, value, isLast }) => {
  const [open, setOpen] = useState(false);
  if (value === undefined || value === null) return null;

  const status = getParamStatus(value, param.thresholds);
  const maxScale = param.thresholds.poor * 1.3;
  const pct = Math.min((value / maxScale) * 100, 100);

  // Zone widths as % of maxScale
  const z1 = (param.thresholds.good / maxScale) * 100;
  const z2 = (param.thresholds.fair / maxScale) * 100;
  const z3 = (param.thresholds.moderate / maxScale) * 100;

  return (
    <div className={!isLast ? 'border-b border-gray-50' : ''}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors text-left"
      >
        {/* Icon */}
        <span className="text-lg w-7 shrink-0 text-center">{param.icon}</span>

        {/* Name */}
        <div className="w-14 shrink-0">
          <p className="text-sm font-bold text-gray-900">{param.label}</p>
          <p className="text-[10px] text-gray-400 leading-tight">{param.unit}</p>
        </div>

        {/* Bar */}
        <div className="flex-1 relative h-2.5 rounded-full overflow-hidden bg-gray-100">
          {/* Zone bands */}
          <div className="absolute inset-0 flex">
            <div className="h-full bg-green-100"  style={{ width: `${z1}%` }} />
            <div className="h-full bg-yellow-100" style={{ width: `${z2 - z1}%` }} />
            <div className="h-full bg-orange-100" style={{ width: `${z3 - z2}%` }} />
            <div className="h-full bg-red-100 flex-1" />
          </div>
          {/* Fill */}
          <div
            className={`absolute left-0 top-0 h-full rounded-full ${status.color} opacity-90`}
            style={{ width: `${pct}%`, transition: 'width 0.6s ease' }}
          />
        </div>

        {/* Value */}
        <span className="text-sm font-bold text-gray-800 w-20 text-right shrink-0 tabular-nums">
          {fmt(value)}
        </span>

        {/* Status chip */}
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full w-[72px] text-center shrink-0 ${status.text} ${status.bg}`}>
          {status.label}
        </span>

        {/* Expand chevron */}
        <ChevronDown
          className={`w-4 h-4 text-gray-300 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-5 pb-4 pt-0 bg-gray-50/40 border-t border-gray-50 animate-fade-in">
          <div className="pl-10">
            <p className="text-xs text-gray-600 leading-relaxed mb-2">{param.effect}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                ✅ Safe &lt; {param.thresholds.good} {param.unit}
              </span>
              <span className="text-[10px] font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                ⚠️ Fair &lt; {param.thresholds.fair} {param.unit}
              </span>
              <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                🟠 Moderate &lt; {param.thresholds.moderate} {param.unit}
              </span>
              <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                🔴 Poor ≥ {param.thresholds.moderate} {param.unit}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

//  Best Hours Card 

const scoreSlot = (temp, pop, aqi) => {
  // Temperature: ideal 18–28°C for Bangladesh outdoors
  const tempScore = temp >= 18 && temp <= 28 ? 2 : temp >= 15 && temp <= 32 ? 1 : 0;
  // Rain: lower = better
  const rainScore = pop <= 0.1 ? 2 : pop <= 0.3 ? 1 : 0;
  // AQI: good/fair = ok, rest = bad
  const aqiScore = aqi <= 2 ? 2 : aqi === 3 ? 1 : 0;
  return tempScore + rainScore + aqiScore;
};

const SLOT_LABEL = {
  6: 'score-best',
  5: 'score-good',
  4: 'score-ok',
};

const slotStyle = (score) => {
  if (score >= 6) return { ring: 'ring-2 ring-green-400', bg: 'bg-green-50',  label: '✅ Best',    text: 'text-green-700' };
  if (score >= 4) return { ring: '',                       bg: 'bg-white',     label: '👍 Good',    text: 'text-blue-600'  };
  if (score >= 2) return { ring: '',                       bg: 'bg-white',     label: '⚠️ Fair',    text: 'text-yellow-600' };
  return               { ring: '',                         bg: 'bg-gray-50',   label: '❌ Avoid',   text: 'text-red-500'   };
};

const fmt12h = (dtTxt) => {
  const date = new Date(dtTxt.replace(' ', 'T'));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
};

const BestHoursCard = ({ forecastData, aqi }) => {
  if (!forecastData?.list?.length) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const slots = forecastData.list
    .filter((item) => item.dt_txt.startsWith(todayStr))
    .map((item) => ({
      time: item.dt_txt,
      temp: Math.round(item.main.temp),
      pop: item.pop ?? 0,
      icon: item.weather?.[0]?.icon,
      score: scoreSlot(item.main.temp, item.pop ?? 0, aqi),
    }));

  if (!slots.length) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Sun className="w-4 h-4 text-amber-500" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Best Hours Today</p>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
        {slots.map((slot) => {
          const style = slotStyle(slot.score);
          return (
            <div
              key={slot.time}
              className={`shrink-0 flex flex-col items-center gap-1.5 rounded-2xl border border-gray-100 shadow-sm px-4 py-3 min-w-[88px] ${style.bg} ${style.ring}`}
            >
              <p className="text-xs font-bold text-gray-500">{fmt12h(slot.time)}</p>
              {slot.icon && (
                <img
                  src={`https://openweathermap.org/img/wn/${slot.icon}.png`}
                  alt=""
                  className="w-9 h-9 -my-1"
                />
              )}
              <p className="text-sm font-extrabold text-gray-900">{slot.temp}°C</p>
              <p className="text-[10px] text-blue-400 font-medium">
                {Math.round(slot.pop * 100)}% rain
              </p>
              <p className={`text-[10px] font-bold ${style.text}`}>{style.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

//  Main Page 

const OutdoorPage = () => {
  const { healthProfile: savedProfile, occupation } = useProfileStore();
  const [selectedCity, setSelectedCity] = useState(null);
  const [localProfile, setLocalProfile] = useState(null);

  const activeProfile = localProfile || savedProfile;

  const { location: geoLocation, isLoading: locationLoading, error: locationError } = useGeolocation();
  const activeLocation = selectedCity || geoLocation;

  const { data: weatherData, isLoading: weatherLoading } = useWeather(activeLocation);
  const { data: aqiData, isLoading: aqiLoading, error: aqiError } = useAirQuality(activeLocation);
  const { data: forecastData } = useForecast(activeLocation);

  const isLoading = (locationLoading && !selectedCity) || aqiLoading || weatherLoading;

  const aqi = aqiData?.list?.[0]?.main?.aqi ?? 1;
  const components = aqiData?.list?.[0]?.components ?? {};
  const rec = useDecisionEngine(aqi, activeProfile);

  const aqiMeta = AQI_META[aqi] ?? AQI_META[1];
  const cityName = weatherData?.name
    ? `${weatherData.name}${weatherData.sys?.country ? `, ${weatherData.sys.country}` : ''}`
    : null;

  const DecisionIcon =
    rec.canGoOutside === 'YES'              ? CheckCircle2 :
    rec.canGoOutside === 'YES WITH CAUTION' ? AlertTriangle :
    XCircle;

  return (
    <div className="min-h-screen page-enter">
      <Navbar />
      <BottomNav />

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/*  Location + Search  */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="text-sm font-medium text-gray-600">
              {cityName ?? (locationError ? locationError : 'Detecting location…')}
            </span>
          </div>
          <CitySearchBar onCitySelect={setSelectedCity} />
        </div>

        {isLoading ? (
          /*  Skeleton  */
          <div className="space-y-4 animate-pulse">
            <div className="h-44 bg-gray-200 rounded-2xl" />
            <div className="h-12 bg-gray-100 rounded-2xl" />
            <div className="h-20 bg-gray-100 rounded-2xl" />
            <div className="h-64 bg-gray-100 rounded-2xl" />
          </div>
        ) : aqiError ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            Could not load air quality data. Try searching for a city.
          </div>
        ) : (
          <>
            {/*  Hero Decision Card  */}
            <div className={`rounded-2xl bg-gradient-to-br ${aqiMeta.gradient} text-white p-6 mb-4 shadow-lg`}>
              <div className="flex items-start gap-4">
                <DecisionIcon className="w-10 h-10 opacity-90 shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-75 mb-1">
                    Outdoor Safety — {activeProfile !== 'general' && HEALTH_PROFILES.find(p => p.id === activeProfile)?.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-2">
                    {rec.canGoOutside}
                  </p>
                  <p className="text-sm opacity-90 leading-relaxed">{rec.advice}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 mt-5">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-semibold">{rec.duration}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-sm font-semibold">{rec.mask}</span>
                </div>
                {occupation === 'outdoor' && (
                  <div className="flex items-center gap-2 bg-black/20 rounded-xl px-4 py-2">
                    <span className="text-base">⛏️</span>
                    <span className="text-sm font-semibold">Outdoor worker — extra caution</span>
                  </div>
                )}
              </div>
            </div>

            {/*  Profile Selector  */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Health Profile</p>
                {localProfile && localProfile !== savedProfile && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                    Overriding saved profile
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {HEALTH_PROFILES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setLocalProfile(p.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
                      activeProfile === p.id
                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/*  AQI + Weather Strip  */}
            <div className="grid grid-cols-4 gap-2.5 mb-5">
              {/* AQI */}
              <div className="col-span-1 flex flex-col items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm p-3 gap-1">
                <div className={`w-4 h-4 rounded-full ${aqiMeta.dot}`} />
                <p className="text-base font-extrabold text-gray-900">{aqi}</p>
                <p className={`text-[10px] font-bold ${aqiMeta.text}`}>{aqiMeta.label}</p>
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">AQI</p>
              </div>

              {/* Temp */}
              <div className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2">
                <Thermometer className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400">Temp</p>
                  <p className="text-base font-extrabold text-gray-900">
                    {weatherData?.main?.temp?.toFixed(0) ?? '–'}<span className="text-xs font-medium text-gray-400">°C</span>
                  </p>
                </div>
              </div>

              {/* Humidity */}
              <div className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2">
                <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400">Humidity</p>
                  <p className="text-base font-extrabold text-gray-900">
                    {weatherData?.main?.humidity ?? '–'}<span className="text-xs font-medium text-gray-400">%</span>
                  </p>
                </div>
              </div>

              {/* Wind */}
              <div className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2">
                <Wind className="w-4 h-4 text-teal-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400">Wind</p>
                  <p className="text-base font-extrabold text-gray-900">
                    {weatherData?.wind?.speed?.toFixed(1) ?? '–'}<span className="text-xs font-medium text-gray-400">m/s</span>
                  </p>
                </div>
              </div>
            </div>

            {/*  Best Hours Today  */}
            <BestHoursCard forecastData={forecastData} aqi={aqi} />

            {/*  Air Quality Breakdown (collapsible rows)  */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Air Quality Breakdown
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Info className="w-3 h-3" />
                  <span>Tap a row to learn more</span>
                </div>
              </div>

              {/* Column header */}
              <div className="flex items-center gap-3 px-5 py-1.5 text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
                <span className="w-7" />
                <span className="w-14">Name</span>
                <span className="flex-1 text-center">Level</span>
                <span className="w-20 text-right">Value</span>
                <span className="w-[72px] text-center">Status</span>
                <span className="w-4" />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {PARAMETERS.map((param, i) => (
                  <ParameterRow
                    key={param.key}
                    param={param}
                    value={components[param.key]}
                    isLast={i === PARAMETERS.length - 1}
                  />
                ))}
              </div>
            </div>

            {/*  Footer note  */}
            <p className="text-[10px] text-gray-300 text-center mt-4">
              Data source: OpenWeatherMap Air Pollution API · WHO 2021 thresholds
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OutdoorPage;
