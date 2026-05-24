import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Thermometer, Droplets, Wind, CloudRain, Gauge, Eye, Loader2, X, MapPin } from 'lucide-react';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';
import { fetchCurrentWeather, fetchAirQuality } from '@/features/weather/api/weatherApi';
import useGeolocation from '@/hooks/useGeolocation';

const OWM_KEY = import.meta.env.VITE_OWM_API_KEY;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LAYERS = [
  {
    key: 'temp_new', label: 'Temperature', icon: Thermometer,
    legend: ['#0d47a1','#1565c0','#1976d2','#42a5f5','#80cbc4','#a5d6a7','#fff176','#ffb74d','#ef5350','#b71c1c'],
    low: '-20°C', high: '40°C',
  },
  {
    key: 'humidity_new', label: 'Humidity', icon: Droplets,
    legend: ['#e3f2fd','#90caf9','#42a5f5','#1565c0','#0d47a1'],
    low: '0%', high: '100%',
  },
  {
    key: 'wind_new', label: 'Wind', icon: Wind,
    legend: ['#e8f5e9','#a5d6a7','#4caf50','#1b5e20','#311b92'],
    low: '0', high: '60+ km/h',
  },
  {
    key: 'precipitation_new', label: 'Rain', icon: CloudRain,
    legend: ['#e3f2fd','#90caf9','#1565c0','#0d47a1','#1a237e'],
    low: 'None', high: 'Heavy',
  },
  {
    key: 'pressure_new', label: 'Pressure', icon: Gauge,
    legend: ['#7b3294','#c2a5cf','#f7f7f7','#a6dba0','#008837'],
    low: 'Low', high: 'High',
  },
  {
    key: 'clouds_new', label: 'Cloud Cover', icon: Eye,
    legend: ['rgba(255,255,255,0.1)','#90a4ae','#546e7a','#37474f','#263238'],
    low: 'Clear', high: 'Overcast',
  },
];

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

const AQI_META = {
  1: { color: '#10B981' },
  2: { color: '#F59E0B' },
  3: { color: '#F97316' },
  4: { color: '#EF4444' },
  5: { color: '#A855F7' },
};

const makeCityIcon = (name, temp, aqi) => {
  const dot = aqi ? AQI_META[aqi]?.color ?? '#fff' : null;
  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;white-space:nowrap;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.9))">
        <div style="background:rgba(9,13,22,0.88);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:4px 10px;text-align:center;backdrop-filter:blur(8px)">
          <div style="font-size:16px;font-weight:900;color:#fff;line-height:1.1">${Math.round(temp)}°C</div>
          <div style="font-size:9px;font-weight:600;color:rgba(255,255,255,0.45);letter-spacing:0.06em;text-transform:uppercase">${name}</div>
        </div>
        ${dot ? `<div style="width:7px;height:7px;border-radius:50%;background:${dot};margin-top:3px;box-shadow:0 0 8px ${dot}99"></div>` : ''}
      </div>`,
    iconAnchor: [45, 0],
    iconSize: [90, 50],
  });
};

const ClickHandler = ({ onMapClick }) => {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
};

const CityMarkers = () => {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled(
        BD_CITIES.map(async (city) => {
          const [w, a] = await Promise.allSettled([
            fetchCurrentWeather({ lat: city.lat, lon: city.lon }),
            fetchAirQuality({ lat: city.lat, lon: city.lon }),
          ]);
          return {
            ...city,
            temp: w.status === 'fulfilled' ? w.value?.main?.temp : null,
            aqi:  a.status === 'fulfilled' ? a.value?.list?.[0]?.main?.aqi : null,
          };
        })
      );
      setCities(results.filter(r => r.status === 'fulfilled' && r.value.temp != null).map(r => r.value));
    };
    load();
  }, []);

  return cities.map(city => (
    <Marker
      key={city.name}
      position={[city.lat, city.lon]}
      icon={makeCityIcon(city.name, city.temp, city.aqi)}
      interactive={false}
    />
  ));
};

const DetailPanel = ({ weather, aqi, isLoading, onClose }) => {
  const aqiLevel = aqi?.list?.[0]?.main?.aqi;
  const comp     = aqi?.list?.[0]?.components;
  const aqiMeta  = aqiLevel ? (AQI_META[aqiLevel] ?? AQI_META[3]) : null;

  return (
    <div className="absolute bottom-0 left-0 right-0 md:inset-y-0 md:right-0 md:left-auto md:w-80 z-[1000] flex flex-col animate-slide-up md:animate-none"
      style={{ background: 'rgba(9,13,22,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-sm font-bold text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" /> Location Details
        </p>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-10 scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
            <p className="text-sm text-white/30">Loading…</p>
          </div>
        ) : weather ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-white/80">
              {weather.name}{weather.sys?.country ? `, ${weather.sys.country}` : ''}
            </p>

            {/* Main weather card */}
            <div className="glass-card p-4 flex items-center gap-4">
              <img src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} alt="" className="w-16 h-16 flex-shrink-0" />
              <div>
                <p className="text-4xl font-extrabold text-white leading-none">
                  {Math.round(weather.main.temp)}°<span className="text-lg font-bold text-white/40">C</span>
                </p>
                <p className="text-xs text-white/40 capitalize mt-0.5">{weather.weather[0].description}</p>
              </div>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { Icon: Thermometer, label: 'Feels Like', value: `${Math.round(weather.main.feels_like)}°` },
                { Icon: Droplets,    label: 'Humidity',   value: `${weather.main.humidity}%`               },
                { Icon: Wind,        label: 'Wind',        value: `${(weather.wind.speed * 3.6).toFixed(1)}`},
              ].map(({ Icon, label, value }) => (
                <div key={label} className="glass-card flex flex-col items-center gap-1 py-3">
                  <Icon className="w-3.5 h-3.5 text-white/30" />
                  <p className="text-sm font-extrabold text-white">{value}</p>
                  <p className="text-[9px] text-white/30 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>

            {/* AQI */}
            {aqiMeta && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Air Quality</p>
                <div className="glass-card px-4 py-3 flex items-center justify-between mb-2"
                  style={{ borderColor: `${aqiMeta.color}33` }}>
                  <span className="text-sm font-bold" style={{ color: aqiMeta.color }}>
                    AQI {aqiLevel}
                  </span>
                  <span className="text-xs text-white/40">{['','Good','Fair','Moderate','Poor','Very Poor'][aqiLevel]}</span>
                </div>

                {comp && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'PM2.5', value: comp.pm2_5?.toFixed(1) },
                      { label: 'PM10',  value: comp.pm10?.toFixed(1)  },
                      { label: 'NO₂',   value: comp.no2?.toFixed(1)   },
                      { label: 'O₃',    value: comp.o3?.toFixed(1)    },
                    ].map(({ label, value }) => (
                      <div key={label} className="glass-card px-3 py-2">
                        <p className="text-[9px] text-white/30 uppercase">{label}</p>
                        <p className="text-sm font-bold text-white">{value ?? '—'} <span className="text-[9px] text-white/20">μg/m³</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-white/20 text-center py-12">Click anywhere on the map to see weather and AQI data.</p>
        )}
      </div>
    </div>
  );
};

const MapPage = () => {
  const { location: geoLocation } = useGeolocation();
  const mapCenter = geoLocation ? [geoLocation.lat, geoLocation.lon] : [23.5, 90.35];

  const [activeLayer, setActiveLayer] = useState(LAYERS[0]);
  const [showPanel,   setShowPanel]   = useState(false);
  const [weather,     setWeather]     = useState(null);
  const [aqi,         setAqi]         = useState(null);
  const [isLoading,   setIsLoading]   = useState(false);

  const handleMapClick = async ({ lat, lng }) => {
    setWeather(null);
    setAqi(null);
    setIsLoading(true);
    setShowPanel(true);
    try {
      const [w, a] = await Promise.allSettled([
        fetchCurrentWeather({ lat, lon: lng }),
        fetchAirQuality({ lat, lon: lng }),
      ]);
      setWeather(w.status === 'fulfilled' ? w.value : null);
      setAqi(a.status === 'fulfilled' ? a.value : null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#090D16' }}>
      <Navbar />
      <BottomNav />

      {/* Layer selector */}
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide z-10 flex-shrink-0"
        style={{ background: 'rgba(9,13,22,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
        {LAYERS.map(layer => {
          const Icon = layer.icon;
          const active = activeLayer.key === layer.key;
          return (
            <button
              key={layer.key}
              onClick={() => setActiveLayer(layer)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                active
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-white/45 hover:text-white/75 hover:bg-white/8'
              }`}
              style={!active ? { border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem' } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {layer.label}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <MapContainer
          center={mapCenter}
          zoom={7}
          style={{ height: '100%', width: '100%', minHeight: 'calc(100vh - 160px)' }}
          zoomControl={false}
          attributionControl={false}
        >
          {/* Dark base */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />

          {/* OWM weather overlay */}
          <TileLayer
            key={activeLayer.key}
            url={`https://tile.openweathermap.org/map/${activeLayer.key}/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
            opacity={0.7}
          />

          <ClickHandler onMapClick={handleMapClick} />
          <CityMarkers />

          {geoLocation && (
            <Marker
              position={[geoLocation.lat, geoLocation.lon]}
              icon={L.divIcon({
                className: '',
                html: `<div style="width:14px;height:14px;border-radius:50%;background:#10b981;border:2.5px solid #fff;box-shadow:0 0 0 5px rgba(16,185,129,0.25),0 2px 8px rgba(0,0,0,0.6)"></div>`,
                iconAnchor: [7, 7],
                iconSize: [14, 14],
              })}
              interactive={false}
            />
          )}
        </MapContainer>

        {/* Color legend */}
        <div className="absolute bottom-4 left-4 z-[900] rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(9,13,22,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-[9px] text-white/35 uppercase tracking-widest mb-1.5">{activeLayer.label}</p>
          <div className="flex h-2 rounded-full overflow-hidden w-32">
            {activeLayer.legend.map((c, i) => (
              <div key={i} className="flex-1" style={{ background: c === 'transparent' ? 'rgba(255,255,255,0.05)' : c }} />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-white/30">{activeLayer.low}</span>
            <span className="text-[9px] text-white/30">{activeLayer.high}</span>
          </div>
        </div>

        {/* AQI dot legend */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[900] rounded-xl px-3 py-2"
          style={{ background: 'rgba(9,13,22,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            {[['Good','#10B981'],['Fair','#F59E0B'],['Poor','#EF4444'],['Very Poor','#A855F7']].map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-[9px] text-white/40 font-medium">{label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Click hint */}
        {!showPanel && (
          <div className="absolute top-3 right-3 z-[900] rounded-xl px-3 py-2"
            style={{ background: 'rgba(9,13,22,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] text-white/40">Click anywhere for weather data</p>
          </div>
        )}

        {/* Detail panel */}
        {showPanel && (
          <DetailPanel
            weather={weather}
            aqi={aqi}
            isLoading={isLoading}
            onClose={() => { setShowPanel(false); setWeather(null); setAqi(null); }}
          />
        )}
      </div>
    </div>
  );
};

export default MapPage;
