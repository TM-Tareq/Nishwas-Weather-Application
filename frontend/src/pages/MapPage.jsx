import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, MapPin, X, Thermometer, Droplets, Wind } from 'lucide-react';
import useAuthStore from '@/features/auth/store/authStore';
import useGeolocation from '@/hooks/useGeolocation';
import { fetchCurrentWeather } from '@/features/weather/api/weatherApi';
import Navbar from '@/components/organisms/Navbar';

// Fix default marker icons broken by Vite's asset handling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Blue marker for user's location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Handles map click events — must be inside MapContainer
const ClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => onMapClick(e.latlng),
  });
  return null;
};

const MapPage = () => {
  const user = useAuthStore((state) => state.user);

  const { location: geoLocation } = useGeolocation();
  const mapCenter = geoLocation
    ? [geoLocation.lat, geoLocation.lon]
    : [23.8103, 90.4125]; // Dhaka default

  const [clickedPos, setClickedPos] = useState(null);
  const [clickedWeather, setClickedWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const handleMapClick = async ({ lat, lng }) => {
    setClickedPos({ lat, lng });
    setClickedWeather(null);
    setIsLoadingWeather(true);

    try {
      const data = await fetchCurrentWeather({ lat, lon: lng });
      setClickedWeather(data);
    } catch {
      setClickedWeather(null);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">

      <Navbar />

      {/* Hint */}
      <div className="px-6 py-2 bg-brand-50 border-b border-brand-100">
        <p className="text-sm text-brand-700 flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          Map-এ যেকোনো জায়গায় click করলে সেই এলাকার weather দেখাবে
        </p>
      </div>

      {/* Map + Side Panel */}
      <div className="flex-1 flex" style={{ height: 'calc(100vh - 108px)' }}>

        {/* Map */}
        <div className="flex-1">
          <MapContainer
            center={mapCenter}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            />

            <ClickHandler onMapClick={handleMapClick} />

            {/* User location marker */}
            {geoLocation && (
              <Marker position={[geoLocation.lat, geoLocation.lon]} icon={userIcon}>
                <Popup>
                  <p className="text-sm font-semibold text-brand-700">Your location</p>
                </Popup>
              </Marker>
            )}

            {/* Clicked location marker */}
            {clickedPos && (
              <Marker position={[clickedPos.lat, clickedPos.lng]} />
            )}
          </MapContainer>
        </div>

        {/* Weather Side Panel */}
        {(clickedPos || isLoadingWeather) && (
          <div className="w-72 bg-white border-l border-gray-200 p-5 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">Location Weather</p>
              <button
                onClick={() => { setClickedPos(null); setClickedWeather(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingWeather ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                <p className="text-sm text-gray-500">Loading weather...</p>
              </div>
            ) : clickedWeather ? (
              <div>
                {/* City name */}
                <div className="flex items-center gap-1.5 mb-4">
                  <MapPin className="w-4 h-4 text-brand-500" />
                  <p className="font-bold text-gray-900">
                    {clickedWeather.name}, {clickedWeather.sys.country}
                  </p>
                </div>

                {/* Temp + icon */}
                <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-4 text-white mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-5xl font-bold">{Math.round(clickedWeather.main.temp)}°</span>
                      <span className="text-brand-200 ml-1">C</span>
                      <p className="text-brand-200 capitalize mt-1 text-sm">{clickedWeather.weather[0].description}</p>
                    </div>
                    <img
                      src={`https://openweathermap.org/img/wn/${clickedWeather.weather[0].icon}@2x.png`}
                      alt=""
                      className="w-16 h-16"
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Thermometer className="w-4 h-4" />
                      <span className="text-sm">Feels like</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{Math.round(clickedWeather.main.feels_like)}°C</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Droplets className="w-4 h-4" />
                      <span className="text-sm">Humidity</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{clickedWeather.main.humidity}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Wind className="w-4 h-4" />
                      <span className="text-sm">Wind</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{(clickedWeather.wind.speed * 3.6).toFixed(1)} km/h</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-500 text-center py-8">Data load হয়নি।</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
