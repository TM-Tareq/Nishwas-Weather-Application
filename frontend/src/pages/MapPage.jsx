import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Thermometer, Droplets, Wind, CloudRain, Gauge, Eye, Zap, Loader2, Activity, MapPin } from 'lucide-react';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';
import useGeolocation from '@/hooks/useGeolocation';
import useWeather from '@/features/weather/hooks/useWeather';
import useAirQuality from '@/features/weather/hooks/useAirQuality';

const LAYERS = [
  { key: 'wind',      label: 'Wind',        icon: Wind,        color: 'from-teal-500 to-cyan-500'    },
  { key: 'temp',      label: 'Temperature', icon: Thermometer, color: 'from-orange-500 to-red-500'   },
  { key: 'rh',        label: 'Humidity',    icon: Droplets,    color: 'from-sky-400 to-blue-500'     },
  { key: 'pm2p5',     label: 'AQI / PM2.5', icon: Activity,   color: 'from-emerald-500 to-teal-600' },
  { key: 'rain',      label: 'Rain',        icon: CloudRain,   color: 'from-blue-500 to-indigo-500'  },
  { key: 'clouds',    label: 'Clouds',      icon: Eye,         color: 'from-slate-400 to-slate-600'  },
  { key: 'pressure',  label: 'Pressure',    icon: Gauge,       color: 'from-violet-500 to-purple-600'},
  { key: 'thunder',   label: 'Thunder',     icon: Zap,         color: 'from-yellow-400 to-amber-500' },
];

const AQI_LABELS = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
const AQI_COLORS = ['', '#10b981', '#eab308', '#f97316', '#ef4444', '#a855f7'];

const buildWindyUrl = (lat, lon, layer) =>
  `https://embed.windy.com/embed2.html` +
  `?lat=${lat}&lon=${lon}` +
  `&zoom=6` +
  `&level=surface` +
  `&overlay=${layer}` +
  `&product=ecmwf` +
  `&menu=` +
  `&message=true` +
  `&marker=true` +
  `&calendar=now` +
  `&pressure=` +
  `&type=map` +
  `&location=coordinates` +
  `&detail=` +
  `&metricWind=default` +
  `&metricTemp=%C2%B0C`;

// Derive the primary value for a given layer key from weather/aqi data
const getLayerValue = (key, weather, aqi) => {
  if (!weather && !aqi) return null;
  switch (key) {
    case 'wind':     return weather ? `${(weather.wind?.speed * 3.6).toFixed(1)} km/h` : null;
    case 'temp':     return weather ? `${Math.round(weather.main?.temp)}°C` : null;
    case 'rh':       return weather ? `${weather.main?.humidity}%` : null;
    case 'pm2p5': {
      const aqiIdx = aqi?.list?.[0]?.main?.aqi;
      const pm25   = aqi?.list?.[0]?.components?.pm2_5;
      if (!aqiIdx) return null;
      return `AQI ${aqiIdx} · ${pm25?.toFixed(1) ?? '—'} μg/m³`;
    }
    case 'rain':     return weather ? `${weather.rain?.['1h'] ?? weather.rain?.['3h'] ?? 0} mm` : null;
    case 'clouds':   return weather ? `${weather.clouds?.all ?? 0}%` : null;
    case 'pressure': return weather ? `${weather.main?.pressure} hPa` : null;
    case 'thunder':  return weather ? `${weather.clouds?.all ?? 0}% cloud` : null;
    default:         return null;
  }
};

const FloatingDataCard = ({ activeLayer, weather, aqi, city }) => {
  const ActiveIcon = activeLayer.icon;
  const mainValue  = getLayerValue(activeLayer.key, weather, aqi);
  const aqiIdx     = aqi?.list?.[0]?.main?.aqi;
  const pm25       = aqi?.list?.[0]?.components?.pm2_5;

  const mini = [
    {
      icon: Activity,
      label: 'AQI',
      value: aqiIdx ? AQI_LABELS[aqiIdx] : '—',
      color: aqiIdx ? AQI_COLORS[aqiIdx] : '#ffffff66',
    },
    {
      icon: Thermometer,
      label: 'Temp',
      value: weather ? `${Math.round(weather.main?.temp)}°C` : '—',
      color: '#f97316',
    },
    {
      icon: Droplets,
      label: 'Humidity',
      value: weather ? `${weather.main?.humidity}%` : '—',
      color: '#38bdf8',
    },
    {
      icon: Wind,
      label: 'Wind',
      value: weather ? `${(weather.wind?.speed * 3.6).toFixed(1)} km/h` : '—',
      color: '#2dd4bf',
    },
  ];

  return (
    <div
      className="absolute bottom-4 left-4 z-20 w-56 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(9,13,22,0.88)',
        border: '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Active layer primary stat */}
      <div className={`bg-gradient-to-br ${activeLayer.color} p-4 pb-3`}>
        <div className="flex items-center gap-2 mb-1">
          <ActiveIcon className="w-4 h-4 text-white/80" />
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider">{activeLayer.label}</span>
        </div>
        <div className="text-2xl font-extrabold text-white leading-tight">
          {mainValue ?? '—'}
        </div>
        {activeLayer.key === 'pm2p5' && pm25 != null && (
          <div className="text-[11px] text-white/70 mt-0.5">PM2.5 · WHO limit 15 μg/m³</div>
        )}
      </div>

      {/* Location pill */}
      {city && (
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/6">
          <MapPin className="w-3 h-3 text-white/30 flex-shrink-0" />
          <span className="text-xs text-white/40 truncate">{city}</span>
        </div>
      )}

      {/* Mini stats grid */}
      <div className="grid grid-cols-2 gap-px bg-white/5 border-t border-white/6">
        {mini.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex flex-col gap-0.5 px-3 py-2.5 bg-[#090D16]">
            <div className="flex items-center gap-1.5">
              <Icon className="w-3 h-3" style={{ color }} />
              <span className="text-[10px] text-white/35 font-medium uppercase tracking-wide">{label}</span>
            </div>
            <span className="text-sm font-bold text-white/90">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MapPage = () => {
  const [searchParams] = useSearchParams();
  const { location } = useGeolocation();
  const lat = location?.lat ?? 23.7;
  const lon = location?.lon ?? 90.35;

  const initialLayer = LAYERS.find(l => l.key === searchParams.get('layer')) ?? LAYERS[0];
  const [activeLayer, setActiveLayer] = useState(initialLayer);
  const [iframeReady, setIframeReady] = useState(false);
  const iframeRef = useRef(null);

  const { data: weather } = useWeather(location);
  const { data: aqi }     = useAirQuality(location);

  const handleLayerChange = (layer) => {
    setActiveLayer(layer);
    setIframeReady(false);
    if (iframeRef.current) {
      iframeRef.current.src = buildWindyUrl(lat, lon, layer.key);
    }
  };

  useEffect(() => {
    if (location && iframeRef.current) {
      iframeRef.current.src = buildWindyUrl(location.lat, location.lon, activeLayer.key);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lon]);

  const ActiveIcon = activeLayer.icon;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#090D16' }}>
      <Navbar />
      <BottomNav />

      {/* Layer selector toolbar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide flex-shrink-0 z-10"
        style={{
          background: 'rgba(9,13,22,0.97)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {LAYERS.map((layer) => {
          const Icon = layer.icon;
          const active = activeLayer.key === layer.key;
          return (
            <button
              key={layer.key}
              onClick={() => handleLayerChange(layer)}
              className={`
                flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold
                whitespace-nowrap flex-shrink-0 transition-all duration-200
                ${active
                  ? `bg-gradient-to-r ${layer.color} text-white shadow-lg`
                  : 'text-white/45 hover:text-white/80 hover:bg-white/8'}
              `}
              style={
                !active
                  ? { border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem' }
                  : {}
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {layer.label}
            </button>
          );
        })}
      </div>

      {/* Map container */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>

        {/* Loading overlay */}
        {!iframeReady && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
            style={{ background: '#090D16' }}
          >
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeLayer.color} flex items-center justify-center shadow-2xl`}>
              <ActiveIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading {activeLayer.label} map…
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={buildWindyUrl(lat, lon, activeLayer.key)}
          onLoad={() => setIframeReady(true)}
          style={{
            width: '100%',
            height: '100%',
            minHeight: 'calc(100vh - 152px)',
            border: 'none',
            display: 'block',
          }}
          allowFullScreen
          title="Animated Weather Map"
        />

        {/* Floating data card — only when map is ready and we have data */}
        {iframeReady && (weather || aqi) && (
          <FloatingDataCard
            activeLayer={activeLayer}
            weather={weather}
            aqi={aqi}
            city={weather?.name}
          />
        )}
      </div>
    </div>
  );
};

export default MapPage;
