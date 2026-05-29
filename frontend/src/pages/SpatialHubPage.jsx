import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueries } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Compass, Navigation2, MapPin, X, Loader2, Wind,
  LocateFixed, ArrowUpDown, Thermometer, Droplets, Gauge, Activity, CloudRain,
} from 'lucide-react';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';
import { fetchCurrentWeather, fetchAirQuality } from '@/features/weather/api/weatherApi';
import useGeolocation from '@/hooks/useGeolocation';

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl:       'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

//  AQI meta
const AQI_META = {
  1: { label: 'Good',      color: '#10B981', bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  2: { label: 'Fair',      color: '#F59E0B', bg: 'bg-yellow-500/20 border-yellow-500/30',  text: 'text-yellow-400',  bar: 'bg-yellow-400'  },
  3: { label: 'Moderate',  color: '#F97316', bg: 'bg-orange-500/20 border-orange-500/30',  text: 'text-orange-400',  bar: 'bg-orange-500'  },
  4: { label: 'Poor',      color: '#EF4444', bg: 'bg-red-500/20 border-red-500/30',        text: 'text-red-400',     bar: 'bg-red-500'     },
  5: { label: 'Very Poor', color: '#A855F7', bg: 'bg-purple-500/20 border-purple-500/30',  text: 'text-purple-400',  bar: 'bg-purple-600'  },
};

// Map parameter definitions — all use Windy animated embed
const MAP_PARAMS = [
  { key: 'aqi',      label: 'AQI',         Icon: Activity,    windyKey: 'pm2p5',    gradient: 'from-emerald-500 to-teal-500',   accent: '#10b981' },
  { key: 'wind',     label: 'Wind',         Icon: Wind,        windyKey: 'wind',     gradient: 'from-teal-500 to-cyan-500',      accent: '#2dd4bf' },
  { key: 'rh',       label: 'Humidity',     Icon: Droplets,    windyKey: 'rh',       gradient: 'from-sky-400 to-blue-500',       accent: '#38bdf8' },
  { key: 'temp',     label: 'Temp',         Icon: Thermometer, windyKey: 'temp',     gradient: 'from-orange-500 to-red-500',     accent: '#f97316' },
  { key: 'pressure', label: 'Pressure',     Icon: Gauge,       windyKey: 'pressure', gradient: 'from-violet-500 to-purple-600',  accent: '#a78bfa' },
  { key: 'rain',     label: 'Rain',         Icon: CloudRain,   windyKey: 'rain',     gradient: 'from-blue-500 to-indigo-500',    accent: '#60a5fa' },
];

// City column mapping: which weather field each param reads
const PARAM_CITY_VAL = {
  aqi:      (_w, aqi) => aqi != null ? `AQI ${aqi}` : '—',
  wind:     (w)      => w ? `${(w.wind.speed * 3.6).toFixed(0)} km/h` : '—',
  rh:       (w)      => w ? `${w.main.humidity}%` : '—',
  temp:     (w)      => w ? `${Math.round(w.main.temp)}°C` : '—',
  pressure: (w)      => w ? `${w.main.pressure} hPa` : '—',
  rain:     (w)      => w ? `${w.rain?.['1h'] ?? w.rain?.['3h'] ?? 0} mm` : '—',
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

const ROUTE_COLORS = ['#10B981', '#60A5FA', '#F59E0B'];

// Windy embed URL builder (Bangladesh center, zoom 7)
const buildWindyUrl = (lat, lon, layer) =>
  `https://embed.windy.com/embed2.html` +
  `?lat=${lat}&lon=${lon}` +
  `&zoom=7&level=surface` +
  `&overlay=${layer}` +
  `&product=ecmwf` +
  `&menu=&message=true&marker=true&calendar=now&pressure=` +
  `&type=map&location=coordinates&detail=` +
  `&metricWind=default&metricTemp=%C2%B0C`;

//  Param selector strip — shared between sidebar and mobile header
const ParamStrip = ({ value, onChange }) => (
  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5">
    {MAP_PARAMS.map(p => {
      const active = value === p.key;
      return (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
            whitespace-nowrap flex-shrink-0 transition-all duration-200
            ${active
              ? `bg-gradient-to-r ${p.gradient} text-white shadow-md`
              : 'text-white/40 hover:text-white/70'
            }`}
          style={!active ? { border: '1px solid rgba(255,255,255,0.08)' } : {}}
        >
          <p.Icon className="w-3 h-3" />
          {p.label}
        </button>
      );
    })}
  </div>
);

//  Helpers
const fmtTime = (s) => { const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`; };
const fmtDist = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

const calcCAI = (avgAqi, humidity = 60, windSpeed = 3) =>
  ((avgAqi * 0.7) + (humidity / (windSpeed + 1) * 0.3)).toFixed(2);

const sampleRoutePoints = (coords, count = 3) => {
  if (!coords?.length) return [];
  return Array.from({ length: count }, (_, i) => {
    const idx = Math.floor((i + 1) / (count + 1) * coords.length);
    const c   = coords[Math.max(0, Math.min(idx, coords.length - 1))];
    return { lat: c[1], lon: c[0] };
  });
};

const viaText = (legs) => {
  try {
    const steps  = legs[0]?.steps ?? [];
    const names  = steps.slice(Math.floor(steps.length * 0.2), Math.floor(steps.length * 0.8)).map(s => s.name).filter(n => n?.length > 2);
    const unique = [...new Set(names)].slice(0, 2);
    return unique.length ? `Via ${unique.join(' & ')}` : 'Direct route';
  } catch { return 'Direct route'; }
};

//  Nominatim
const searchPlaces = async (query) => {
  if (!query?.trim() || query.trim().length < 2) return [];
  const params = new URLSearchParams({ q: query, format: 'json', limit: 6, countrycodes: 'bd', addressdetails: 1 });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'Nishwas-App/1.0' },
  });
  const data = await res.json();
  return data.map(item => {
    const a = item.address ?? {};
    const name = a.amenity || a.suburb || a.neighbourhood || a.town || a.city_district || a.city || item.display_name.split(',')[0];
    const context = [a.city || a.town || a.county, a.state].filter(Boolean).join(', ');
    return { name, context, display: item.display_name, lat: parseFloat(item.lat), lon: parseFloat(item.lon) };
  });
};

const reverseGeocode = async (lat, lon) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
    headers: { 'User-Agent': 'Nishwas-App/1.0' },
  });
  const data = await res.json();
  const a    = data.address ?? {};
  const name = a.suburb || a.neighbourhood || a.road || a.city_district || a.city || 'My Location';
  return { name, lat, lon, context: [a.city || a.state].filter(Boolean).join(', ') };
};

const fetchOsrmRoutes = async (from, to) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?alternatives=true&overview=full&geometries=geojson&steps=true`;
    const res  = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Routing service error (${res.status})`);
    const data = await res.json();
    if (data.code !== 'Ok') throw new Error(data.message || 'No route found between these points');
    return data.routes;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Request timed out — try again', { cause: e });
    throw e;
  } finally { clearTimeout(timer); }
};

const MapViewFit = ({ routes, from }) => {
  const map = useMap();
  useEffect(() => {
    if (routes?.length) {
      const all = routes.flatMap(r => r.geometry.coordinates.map(c => [c[1], c[0]]));
      if (all.length) map.fitBounds(all, { padding: [50, 50] });
    } else if (from) {
      map.flyTo([from.lat, from.lon], 13, { duration: 1 });
    }
  }, [routes, from, map]);
  return null;
};

//  Location input
const LocInput = ({ icon: Icon, placeholder, value, onChange, excludeLoc, rightIcon: RightIcon, onRightClick, rightLoading }) => {
  const [query, setQuery]      = useState('');
  const [suggestions, setSugg] = useState([]);
  const [open, setOpen]        = useState(false);
  const [loading, setLoading]  = useState(false);
  const ref    = useRef(null);
  const debRef = useRef(null);

  const displayText = value ? value.name : query;

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q); onChange(null); setOpen(true);
    clearTimeout(debRef.current);
    if (q.trim().length < 2) { setSugg([]); return; }
    setLoading(true);
    debRef.current = setTimeout(async () => {
      try {
        const r = await searchPlaces(q);
        setSugg(r.filter(loc => !excludeLoc || !(Math.abs(loc.lat - excludeLoc.lat) < 0.001 && Math.abs(loc.lon - excludeLoc.lon) < 0.001)));
      } finally { setLoading(false); }
    }, 420);
  };

  const select = (loc) => { onChange(loc); setQuery(''); setOpen(false); setSugg([]); };
  const clear  = ()    => { setQuery(''); onChange(null); setSugg([]); setOpen(false); };

  return (
    <div className="relative flex items-center gap-2" ref={ref}>
      <div className="relative flex-1">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
        <input
          value={displayText} onChange={handleChange} onFocus={() => { if (suggestions.length) setOpen(true); }}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 glass-card text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/40 transition-all"
          style={{ borderRadius: '0.75rem' }}
        />
        {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 animate-spin" />}
        {!loading && displayText && <button onClick={clear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"><X className="w-3.5 h-3.5" /></button>}

        {open && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 glass border border-white/10 rounded-xl shadow-2xl z-[9999] overflow-hidden max-h-56 overflow-y-auto">
            {suggestions.map((loc, i) => (
              <button key={i} onMouseDown={() => select(loc)} className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-emerald-500/10 transition-colors border-b border-white/5 last:border-0">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{loc.name}</p>
                  <p className="text-[11px] text-white/30 truncate">{loc.context || loc.display}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {RightIcon && (
        <button onClick={onRightClick} disabled={rightLoading} className="p-2.5 glass-card text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-all flex-shrink-0">
          {rightLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RightIcon className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

//  Map Explorer Tab
const MapExplorer = ({ mapParam, onParamChange }) => {
  const [cityData, setCityData]       = useState([]);
  const [cityLoading, setCityLoading] = useState(true);

  // Fetch weather + AQI for every city on mount
  useEffect(() => {
    Promise.allSettled(BD_CITIES.map(async (city) => {
      const [wRes, aRes] = await Promise.allSettled([
        fetchCurrentWeather({ lat: city.lat, lon: city.lon }),
        fetchAirQuality({ lat: city.lat, lon: city.lon }),
      ]);
      return {
        ...city,
        weather: wRes.status === 'fulfilled' ? wRes.value : null,
        aqi:     aRes.status === 'fulfilled' ? aRes.value?.list?.[0]?.main?.aqi ?? null : null,
      };
    })).then(r => {
      setCityData(r.filter(x => x.status === 'fulfilled').map(x => x.value));
      setCityLoading(false);
    });
  }, []);

  const activeParamMeta = MAP_PARAMS.find(p => p.key === mapParam);

  const PARAM_DESC = {
    aqi:      'PM2.5 / AQI animated overlay. Purple = heavily polluted.',
    wind:     'Animated wind flow with direction arrows. Colours show speed.',
    rh:       'Relative humidity overlay. Dark blue = very humid.',
    temp:     'Surface temperature. Red = hot, blue = cold.',
    pressure: 'Sea-level pressure field with isobars.',
    rain:     'Precipitation forecast — rain intensity in mm/h.',
  };

  return (
    <div className="flex flex-col h-full gap-3">

      {/* ── Parameter selector ── */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-semibold">Map Layer</p>
        <ParamStrip value={mapParam} onChange={onParamChange} />
      </div>

      {/* ── Active layer description ── */}
      {activeParamMeta && (
        <div
          className="rounded-2xl p-3 flex items-start gap-3"
          style={{ background: `${activeParamMeta.accent}18`, border: `1px solid ${activeParamMeta.accent}33` }}
        >
          <activeParamMeta.Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: activeParamMeta.accent }} />
          <div>
            <p className="text-sm font-bold text-white mb-0.5">{activeParamMeta.label} · Live Animated Map</p>
            <p className="text-[11px] text-white/45 leading-relaxed">{PARAM_DESC[mapParam]}</p>
          </div>
        </div>
      )}

      {/* ── City cards ── */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
        <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold mb-1">Cities · Bangladesh</p>
        {cityLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
            ))
          : cityData.map(city => {
              const aqiIdx    = city.aqi;
              const m         = aqiIdx ? AQI_META[aqiIdx] : null;
              const w         = city.weather;
              const activeVal = PARAM_CITY_VAL[mapParam]?.(w, aqiIdx) ?? '—';

              return (
                <div key={city.name} className="rounded-2xl p-3 border bg-white/5 border-white/8">
                  {/* City name + active-param value badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">{city.name}</span>
                    <span
                      className="text-xs font-extrabold px-2 py-0.5 rounded-lg"
                      style={{
                        color: activeParamMeta?.accent ?? '#fff',
                        background: `${activeParamMeta?.accent ?? '#fff'}18`,
                      }}
                    >
                      {activeVal}
                    </span>
                  </div>

                  {/* All-param mini row — active one is fully bright */}
                  {w ? (
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { Icon: Thermometer, val: `${Math.round(w.main.temp)}°C`,            color: '#f97316', pkey: 'temp' },
                        { Icon: Droplets,    val: `${w.main.humidity}%`,                     color: '#38bdf8', pkey: 'rh'   },
                        { Icon: Wind,        val: `${(w.wind.speed * 3.6).toFixed(0)} km/h`, color: '#2dd4bf', pkey: 'wind' },
                        { Icon: Activity,    val: m ? `${m.label}` : '—',                    color: m?.color ?? '#10b981', pkey: 'aqi' },
                      ].map(({ Icon, val, color, pkey }, idx) => (
                        <div key={idx} className="flex items-center gap-1"
                          style={{ opacity: mapParam === pkey ? 1 : 0.4 }}>
                          <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />
                          <span className="text-[11px] text-white font-medium truncate">{val}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-white/20">Weather unavailable</p>
                  )}
                </div>
              );
            })
        }
      </div>
    </div>
  );
};

//  Spatial Hub Page
const SpatialHubPage = () => {
  const { t } = useTranslation();
  const [searchParams]         = useSearchParams();
  const initialTab             = searchParams.get('tab') === 'route' ? 'route' : 'map';
  const [tab, setTab]           = useState(initialTab);
  const [mapParam, setMapParam] = useState('aqi');

  const { location: geoLocation } = useGeolocation();
  const mapCenter = geoLocation ? [geoLocation.lat, geoLocation.lon] : [23.8103, 90.4125];

  const { data: currentWeather } = useQuery({
    queryKey: ['weather', geoLocation?.lat, geoLocation?.lon],
    queryFn:  () => fetchCurrentWeather(geoLocation),
    enabled:  !!geoLocation,
  });

  // Route state
  const [from, setFrom] = useState(null);
  const [to, setTo]     = useState(null);
  const [routes, setRoutes]     = useState(null);
  const [routeLoad, setRL]      = useState(false);
  const [routeErr, setRE]       = useState('');
  const [selIdx, setSelIdx]     = useState(0);
  const [gpsLoad, setGpsLoad]   = useState(false);
  const [showMapMobile, setShowMapMobile] = useState(false);

  // Auto-fill "From" with GPS when route tab opens
  useEffect(() => {
    if (tab === 'route' && geoLocation && !from) {
      reverseGeocode(geoLocation.lat, geoLocation.lon)
        .then(place => setFrom(place))
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, geoLocation?.lat, geoLocation?.lon]);

  const humidity  = currentWeather?.main?.humidity ?? 60;
  const windSpeed = currentWeather?.wind?.speed ?? 3;

  const routeSamples = (routes ?? []).map(r => sampleRoutePoints(r.geometry.coordinates, 3));
  const flatSamples  = routeSamples.flat();
  const sampleAqi = useQueries({
    queries: flatSamples.map(pt => ({
      queryKey: ['aqiPt', pt.lat.toFixed(3), pt.lon.toFixed(3)],
      queryFn:  () => fetchAirQuality(pt),
      staleTime: 600000,
    })),
  });

  const avgAqiPerRoute = routeSamples.map((samples, ri) => {
    const start = routeSamples.slice(0, ri).reduce((s, p) => s + p.length, 0);
    const slice = sampleAqi.slice(start, start + samples.length);
    const vals  = slice.map(q => q.data?.list?.[0]?.main?.aqi).filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  });

  const caiPerRoute  = avgAqiPerRoute.map(avg => avg != null ? calcCAI(avg, humidity, windSpeed) : null);
  const bestAirIdx   = avgAqiPerRoute.reduce((bi, v, i) => { if (v == null) return bi; if (bi == null) return i; return v < avgAqiPerRoute[bi] ? i : bi; }, null);
  const fastestIdx   = routes ? routes.reduce((bi, r, i) => r.duration < routes[bi].duration ? i : bi, 0) : null;

  const findRoutes = async () => {
    if (!from || !to) return;
    setRL(true); setRE(''); setRoutes(null); setSelIdx(0);
    try { setRoutes(await fetchOsrmRoutes(from, to)); }
    catch (e) { setRE(e.message); }
    finally { setRL(false); }
  };

  const handleLocate = async () => {
    setGpsLoad(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try { setFrom(await reverseGeocode(lat, lon)); } finally { setGpsLoad(false); }
      },
      () => setGpsLoad(false),
    );
  };

  // ── Map section: Windy iframe for map tab, Leaflet for route tab
  const activeParam = MAP_PARAMS.find(p => p.key === mapParam);
  const showWindy   = tab === 'map';

  const LeafletMap = (
    <MapContainer center={mapCenter} zoom={7} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      {geoLocation && (
        <Marker position={[geoLocation.lat, geoLocation.lon]} icon={userIcon}>
          <Popup><p className="text-sm font-semibold">{t('spatial.yourLocation')}</p></Popup>
        </Marker>
      )}
      {tab === 'route' && (
        <>
          {routes && (
            <>
              <MapViewFit routes={routes} from={from} />
              {routes.map((route, i) => (
                <Polyline
                  key={i}
                  positions={route.geometry.coordinates.map(c => [c[1], c[0]])}
                  pathOptions={{ color: ROUTE_COLORS[i], weight: selIdx === i ? 5 : 3, opacity: selIdx === i ? 0.95 : 0.4 }}
                />
              ))}
            </>
          )}
          {!routes && from && <MapViewFit routes={null} from={from} />}
          {from && <CircleMarker center={[from.lat, from.lon]} radius={9} pathOptions={{ fillColor: '#10B981', fillOpacity: 1, color: '#090D16', weight: 2 }}><Popup><b>From:</b> {from.name}</Popup></CircleMarker>}
          {to   && <CircleMarker center={[to.lat,   to.lon]}   radius={9} pathOptions={{ fillColor: '#60A5FA', fillOpacity: 1, color: '#090D16', weight: 2 }}><Popup><b>To:</b> {to.name}</Popup></CircleMarker>}
        </>
      )}
    </MapContainer>
  );

  const WindyMap = (
    <iframe
      key={mapParam}
      src={buildWindyUrl(23.8103, 90.4125, activeParam?.windyKey)}
      style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      allowFullScreen
      title={`${activeParam?.label ?? ''} animated map`}
    />
  );

  const MapSection = showWindy ? WindyMap : LeafletMap;

  // MapExplorer props (shared)
  const explorerProps = { mapParam, onParamChange: setMapParam };

  // Route planner sidebar
  const RouteSidebarContent = (
    <div className="flex flex-col gap-3">
      <LocInput icon={MapPin} placeholder="From location…" value={from} onChange={setFrom} excludeLoc={to} rightIcon={LocateFixed} onRightClick={handleLocate} rightLoading={gpsLoad} />
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-white/8" />
        <button onClick={() => { setFrom(to); setTo(from); setRoutes(null); }} className="p-2 glass-card text-white/30 hover:text-emerald-400 transition-colors rounded-xl">
          <ArrowUpDown className="w-4 h-4" />
        </button>
        <div className="flex-1 h-px bg-white/8" />
      </div>
      <LocInput icon={Navigation2} placeholder="To destination…" value={to} onChange={setTo} excludeLoc={from} />
      <button onClick={findRoutes} disabled={!from || !to || routeLoad}
        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
        {routeLoad ? <><Loader2 className="w-4 h-4 animate-spin" />{t('spatial.finding')}</> : <><Wind className="w-4 h-4" />{t('spatial.findRoute')}</>}
      </button>
      {routeErr && <p className="text-red-400 text-sm glass-card px-3 py-2 rounded-xl">{routeErr}</p>}

      {routes && (
        <>
          <p className="text-[11px] text-white/30 px-1">
            {routes.length} route{routes.length !== 1 ? 's' : ''} found · tap to select
          </p>

          <div className="space-y-2.5">
            {routes.map((route, i) => {
              const avg  = avgAqiPerRoute[i];
              const cai  = caiPerRoute[i];
              const meta = avg ? AQI_META[Math.round(avg)] ?? AQI_META[3] : null;
              const isSel = selIdx === i;
              return (
                <button key={i} onClick={() => { setSelIdx(i); setShowMapMobile(true); }}
                  className={`w-full text-left rounded-2xl p-3.5 transition-all border ${
                    isSel
                      ? 'border-emerald-500/60 bg-emerald-500/8 shadow-lg shadow-emerald-500/10'
                      : 'border-white/8 bg-white/3 hover:border-white/20'
                  }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ROUTE_COLORS[i] }} />
                    <span className="text-sm font-bold text-white flex-1 truncate">{viaText(route.legs)}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      {i === bestAirIdx && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{t('spatial.bestAir')}</span>}
                      {i === fastestIdx && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">{t('spatial.fastest')}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <p className="text-[9px] text-white/30 uppercase mb-0.5">Time</p>
                      <p className="text-xs font-bold text-white">{fmtTime(route.duration)}</p>
                    </div>
                    <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <p className="text-[9px] text-white/30 uppercase mb-0.5">Dist</p>
                      <p className="text-xs font-bold text-white">{fmtDist(route.distance)}</p>
                    </div>
                    <div className={`rounded-lg px-2 py-1.5 text-center ${meta?.bg ?? ''}`} style={!meta ? { background: 'rgba(255,255,255,0.05)' } : {}}>
                      <p className="text-[9px] text-white/30 uppercase mb-0.5">CAI</p>
                      <p className={`text-xs font-bold ${meta?.text ?? 'text-white/50'}`}>{cai ?? '—'}</p>
                    </div>
                  </div>

                  {avg != null && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${meta?.bar}`} style={{ width: `${(avg / 5) * 100}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold ${meta?.text}`}>AQI {avg.toFixed(1)}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (!from || !to) return;
              window.open(
                `https://www.google.com/maps/dir/${from.lat},${from.lon}/${to.lat},${to.lon}`,
                '_blank', 'noopener,noreferrer'
              );
            }}
            className="w-full flex items-center justify-center gap-2.5 text-white font-bold py-3.5 rounded-2xl transition-all text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <Navigation2 className="w-4 h-4" />
            Navigate in Google Maps
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-page">
      <Navbar />

      {/* ── Mobile layout ── */}
      <div className="flex flex-col flex-1 overflow-hidden lg:hidden">
        {/* Tab + map toggle strip */}
        <div className="flex border-b border-white/8 flex-shrink-0" style={{ background: 'rgba(9,13,22,0.97)' }}>
          <div className="flex flex-1 p-2 gap-1">
            {[{ id: 'map', label: t('spatial.mapTab') }, { id: 'route', label: t('spatial.routeTab') }].map(tb => (
              <button
                key={tb.id}
                onClick={() => { setTab(tb.id); setShowMapMobile(false); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tab === tb.id ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-white/40 hover:text-white/70'}`}
              >
                {tb.label}
              </button>
            ))}
          </div>
          {tab === 'route' && (
            <button
              onClick={() => setShowMapMobile(m => !m)}
              className="px-4 text-xs font-bold text-emerald-400 border-l border-white/8 flex items-center gap-1.5 flex-shrink-0"
            >
              <MapPin className="w-3.5 h-3.5" />
              {showMapMobile ? 'Form' : 'Map'}
            </button>
          )}
        </div>

        {/* Param selector strip — mobile, map tab only */}
        {tab === 'map' && (
          <div
            className="px-3 py-2 flex-shrink-0 border-b border-white/8"
            style={{ background: 'rgba(9,13,22,0.97)' }}
          >
            <ParamStrip value={mapParam} onChange={setMapParam} />
          </div>
        )}

        {/* Map (full screen) OR sidebar content */}
        {(tab === 'map' || showMapMobile) ? (
          <div className="flex-1" style={{ minHeight: 0 }}>
            {MapSection}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 scrollbar-hide">
            {tab === 'map' ? <MapExplorer {...explorerProps} /> : RouteSidebarContent}
          </div>
        )}
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col glass border-r border-white/8 overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-white/8">
            <div className="flex items-center gap-2 mb-4">
              <Compass className="w-5 h-5 text-emerald-400" />
              <h1 className="text-base font-extrabold text-white">{t('spatial.title')}</h1>
            </div>
            <div className="flex glass-card p-1 gap-1">
              {[{ id: 'map', label: t('spatial.mapTab') }, { id: 'route', label: t('spatial.routeTab') }].map(tb => (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tab === tb.id ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-white/40 hover:text-white/70'}`}
                >
                  {tb.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
            {tab === 'map' ? <MapExplorer {...explorerProps} /> : RouteSidebarContent}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1">
          {MapSection}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default SpatialHubPage;
