import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, MapPin, X, Thermometer, Droplets, Wind, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useGeolocation from '@/hooks/useGeolocation';
import { fetchCurrentWeather, fetchAirQuality } from '@/features/weather/api/weatherApi';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';

// Fix default marker icons broken by Vite's asset handling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

//  AQI helpers 

const AQI_META = {
  1: { label: 'Good',      color: '#16a34a', bg: 'bg-green-100',  text: 'text-green-700'  },
  2: { label: 'Fair',      color: '#ca8a04', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  3: { label: 'Moderate',  color: '#ea580c', bg: 'bg-orange-100', text: 'text-orange-700' },
  4: { label: 'Poor',      color: '#dc2626', bg: 'bg-red-100',    text: 'text-red-700'    },
  5: { label: 'Very Poor', color: '#7c3aed', bg: 'bg-purple-100', text: 'text-purple-700' },
};

// Major Bangladesh cities with coordinates
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

//  Map click handler 

const ClickHandler = ({ onMapClick }) => {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
};

//  City AQI Markers 

const CityAqiMarkers = () => {
  const [cityData, setCityData] = useState([]);

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled(
        BD_CITIES.map(async (city) => {
          const aqi = await fetchAirQuality({ lat: city.lat, lon: city.lon });
          return { ...city, aqi: aqi?.list?.[0]?.main?.aqi ?? null };
        })
      );
      setCityData(
        results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value)
      );
    };
    load();
  }, []);

  return cityData.map((city) => {
    if (!city.aqi) return null;
    const meta = AQI_META[city.aqi] ?? AQI_META[1];
    return (
      <CircleMarker
        key={city.name}
        center={[city.lat, city.lon]}
        radius={14}
        pathOptions={{
          fillColor: meta.color,
          fillOpacity: 0.85,
          color: '#fff',
          weight: 2,
        }}
      >
        <Popup>
          <div className="text-center min-w-[120px]">
            <p className="font-bold text-gray-900 text-sm">{city.name}</p>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
              AQI {city.aqi} · {meta.label}
            </span>
          </div>
        </Popup>
      </CircleMarker>
    );
  });
};

//  Side Panel 

const SidePanel = ({ weather, aqi, isLoading, onClose }) => {
  const { t } = useTranslation();
  const aqiLevel = aqi?.list?.[0]?.main?.aqi;
  const comp = aqi?.list?.[0]?.components;
  const aqiMeta = aqiLevel ? (AQI_META[aqiLevel] ?? AQI_META[1]) : null;

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-700">Location Details</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : weather ? (
          <div className="flex flex-col gap-4">

            {/* City name */}
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-500" />
              <p className="font-bold text-gray-900 text-sm">
                {weather.name}{weather.sys?.country ? `, ${weather.sys.country}` : ''}
              </p>
            </div>

            {/* Weather card */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-4xl font-bold">{Math.round(weather.main.temp)}°</span>
                  <span className="text-brand-200 ml-1 text-sm">C</span>
                  <p className="text-brand-200 capitalize mt-1 text-xs">{weather.weather[0].description}</p>
                </div>
                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                  alt=""
                  className="w-14 h-14"
                />
              </div>
            </div>

            {/* Weather details */}
            <div className="space-y-2">
              {[
                { icon: Thermometer, label: t('weather.feelsLike'), value: `${Math.round(weather.main.feels_like)}°C` },
                { icon: Droplets,    label: t('weather.humidity'),  value: `${weather.main.humidity}%` },
                { icon: Wind,        label: t('weather.wind'),      value: `${(weather.wind.speed * 3.6).toFixed(1)} km/h` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{label}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            {/* AQI section */}
            {aqiMeta && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{t('aqi.title')}</p>
                <div className={`rounded-xl px-4 py-3 ${aqiMeta.bg} flex items-center justify-between mb-3`}>
                  <span className={`text-sm font-bold ${aqiMeta.text}`}>{aqiMeta.label}</span>
                  <span className={`text-xs font-semibold ${aqiMeta.text}`}>AQI {aqiLevel}</span>
                </div>
                {comp && (
                  <div className="space-y-1.5">
                    {[
                      { label: 'PM2.5', value: comp.pm2_5?.toFixed(1), unit: 'μg/m³' },
                      { label: 'PM10',  value: comp.pm10?.toFixed(1),  unit: 'μg/m³' },
                      { label: 'NO₂',   value: comp.no2?.toFixed(1),   unit: 'μg/m³' },
                      { label: 'O₃',    value: comp.o3?.toFixed(1),    unit: 'μg/m³' },
                    ].map(({ label, value, unit }) => (
                      <div key={label} className="flex items-center justify-between text-xs text-gray-600">
                        <span className="font-medium">{label}</span>
                        <span>{value} <span className="text-gray-400">{unit}</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-red-500 text-center py-8">Could not load data.</p>
        )}
      </div>
    </div>
  );
};

//  Map Page 

const MapPage = () => {
  const { location: geoLocation } = useGeolocation();
  const mapCenter = geoLocation ? [geoLocation.lat, geoLocation.lon] : [23.8103, 90.4125];

  const [clickedPos, setClickedPos] = useState(null);
  const [weather, setWeather] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMapClick = async ({ lat, lng }) => {
    setClickedPos({ lat, lng });
    setWeather(null);
    setAqi(null);
    setIsLoading(true);
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

  const closePanel = () => {
    setClickedPos(null);
    setWeather(null);
    setAqi(null);
  };

  return (
    <div className="min-h-screen flex flex-col page-enter">
      <Navbar />
      <BottomNav />

      {/* Hint bar */}
      <div className="px-6 py-2 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
        <p className="text-sm text-brand-700 flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          যেকোনো জায়গায় click করলে weather + AQI দেখাবে · Colored circles = city AQI
        </p>
        <div className="flex items-center gap-3">
          {Object.entries(AQI_META).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1 text-xs font-medium" style={{ color: v.color }}>
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: v.color }} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Map + Panel */}
      <div className="flex-1 flex" style={{ height: 'calc(100vh - 112px)' }}>
        <div className="flex-1">
          <MapContainer center={mapCenter} zoom={7} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            />
            <ClickHandler onMapClick={handleMapClick} />
            <CityAqiMarkers />

            {geoLocation && (
              <Marker position={[geoLocation.lat, geoLocation.lon]} icon={userIcon}>
                <Popup><p className="text-sm font-semibold text-brand-700">Your location</p></Popup>
              </Marker>
            )}

            {clickedPos && (
              <Marker position={[clickedPos.lat, clickedPos.lng]} />
            )}
          </MapContainer>
        </div>

        {(clickedPos || isLoading) && (
          <SidePanel
            weather={weather}
            aqi={aqi}
            isLoading={isLoading}
            onClose={closePanel}
          />
        )}
      </div>
    </div>
  );
};

export default MapPage;
