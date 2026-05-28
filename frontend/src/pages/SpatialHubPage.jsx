import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueries } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, GeoJSON, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Compass, Navigation2, MapPin, X, Loader2, Wind,
  LocateFixed, ArrowUpDown,
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

//  Bangladesh boundary — fetched from public geoBoundaries dataset 
const BangladeshOverlay = ({ avgAqi }) => {
  const [geojson, setGeojson] = useState(null);

  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/gbOpen/BGD/ADM0/geoBoundaries-BGD-ADM0_simplified.geojson'
    )
      .then((r) => r.json())
      .then(setGeojson)
      .catch(() => {}); // silently skip if fetch fails
  }, []);

  const meta = avgAqi ? (AQI_META[Math.round(avgAqi)] ?? AQI_META[3]) : AQI_META[1];
  if (!geojson) return null;
  return (
    <GeoJSON
      key={meta.color}
      data={geojson}
      style={{
        color: meta.color,
        weight: 2.5,
        opacity: 0.85,
        fillColor: meta.color,
        fillOpacity: 0.13,
        dashArray: null,
      }}
    />
  );
};


//  Helpers 
const fmtTime = (s) => { const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`; };
const fmtDist = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

// CAI: Composite Air Index — lower = cleaner route
// CAI = (avgAqi × 0.7) + (humidity / (windSpeed + 1) × 0.3)
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

//  Map handlers 
const ClickHandler = ({ onMapClick }) => { useMapEvents({ click: (e) => onMapClick(e.latlng) }); return null; };

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
  // `query` holds the user's raw typed text; when a `value` is selected the
  // input always shows value.name — no effect sync needed.
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

//  Map Explorer Tab — click state lifted to SpatialHubPage
const MapExplorer = ({ clickedPos, clickWeather, clickAqi, panelLoad, onClearClick }) => {
  const { t } = useTranslation();
  const [cityData, setCityData] = useState([]);

  useEffect(() => {
    Promise.allSettled(BD_CITIES.map(async (city) => {
      const a = await fetchAirQuality({ lat: city.lat, lon: city.lon });
      return { ...city, aqi: a?.list?.[0]?.main?.aqi ?? null };
    })).then(r => setCityData(r.filter(x => x.status === 'fulfilled').map(x => x.value)));
  }, []);

  const aqiLevel = clickAqi?.list?.[0]?.main?.aqi;
  const aqiMeta  = aqiLevel ? AQI_META[aqiLevel] : null;
  const comp     = clickAqi?.list?.[0]?.components;

  return (
    <div className="flex flex-col h-full">
      {/* Info panel — appears when user taps a point on the map */}
      {(clickedPos || panelLoad) && (
        <div className="glass-card p-4 mb-3 relative">
          <button onClick={onClearClick} className="absolute top-3 right-3 text-white/30 hover:text-white/60">
            <X className="w-4 h-4" />
          </button>
          {panelLoad ? (
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> {t('spatial.loading')}
            </div>
          ) : clickWeather ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <p className="text-sm font-bold text-white">
                  {clickWeather.name}{clickWeather.sys?.country ? `, ${clickWeather.sys.country}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <img src={`https://openweathermap.org/img/wn/${clickWeather.weather[0].icon}@2x.png`} alt="" className="w-12 h-12" />
                <div>
                  <p className="text-2xl font-extrabold text-white">{Math.round(clickWeather.main.temp)}°C</p>
                  <p className="text-xs text-white/40 capitalize">{clickWeather.weather[0].description}</p>
                </div>
                {aqiMeta && (
                  <div className={`ml-auto px-3 py-1.5 rounded-xl border text-xs font-bold ${aqiMeta.bg} ${aqiMeta.text}`}>
                    AQI {aqiLevel} · {aqiMeta.label}
                  </div>
                )}
              </div>
              {comp && (
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[['PM2.5', comp.pm2_5], ['PM10', comp.pm10], ['NO₂', comp.no2], ['O₃', comp.o3]].map(([k, v]) => (
                    <div key={k} className="glass-card px-2.5 py-1.5 flex justify-between">
                      <span className="text-white/40">{k}</span>
                      <span className="text-white font-semibold">{v?.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : <p className="text-red-400 text-sm">{t('spatial.couldNotLoad')}</p>}
        </div>
      )}

      <p className="text-[11px] text-white/30 mb-3">
        <MapPin className="w-3 h-3 inline mr-1 text-emerald-400" />
        {t('spatial.mapHint')}
      </p>
      <div className="flex flex-wrap gap-2 mb-1">
        {Object.entries(AQI_META).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1 text-[10px] text-white/40">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: v.color }} />{v.label}
          </span>
        ))}
      </div>

      {/* City AQI list */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 scrollbar-hide">
        {cityData.map(city => {
          const m = city.aqi ? AQI_META[city.aqi] : null;
          if (!m) return null;
          return (
            <div key={city.name} className={`glass-card px-3 py-2 flex items-center gap-3 ${m.bg}`}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
              <span className="text-sm font-medium text-white flex-1">{city.name}</span>
              <span className={`text-xs font-bold ${m.text}`}>{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

//  City AQI Markers (map layer)
const CityMarkers = ({ onAvgAqi }) => {
  const [cityData, setCityData] = useState([]);
  useEffect(() => {
    Promise.allSettled(BD_CITIES.map(async c => {
      const a = await fetchAirQuality({ lat: c.lat, lon: c.lon });
      return { ...c, aqi: a?.list?.[0]?.main?.aqi ?? null };
    })).then(r => {
      const data = r.filter(x => x.status === 'fulfilled').map(x => x.value);
      setCityData(data);
      const vals = data.map(d => d.aqi).filter(Boolean);
      if (vals.length) onAvgAqi?.(vals.reduce((a, b) => a + b, 0) / vals.length);
    });
  }, [onAvgAqi]);
  return cityData.map(city => {
    if (!city.aqi) return null;
    const meta = AQI_META[city.aqi];
    return (
      <CircleMarker key={city.name} center={[city.lat, city.lon]} radius={14}
        pathOptions={{ fillColor: meta.color, fillOpacity: 0.85, color: '#090D16', weight: 2 }}>
        <Popup>
          <div className="text-center">
            <p className="font-bold text-sm">{city.name}</p>
            <p className="text-xs mt-1">{meta.label} · AQI {city.aqi}</p>
          </div>
        </Popup>
      </CircleMarker>
    );
  });
};

//  Spatial Hub Page
const SpatialHubPage = () => {
  const { t } = useTranslation();
  const [searchParams]         = useSearchParams();
  const initialTab             = searchParams.get('tab') === 'route' ? 'route' : 'map';
  const [tab, setTab]           = useState(initialTab);
  const [mapClickPos, setMCPos] = useState(null);
  const [clickWeather, setClickW]   = useState(null);
  const [clickAqi,    setClickAqi]  = useState(null);
  const [clickPanelLoad, setClickL] = useState(false);
  const [avgAqi, setAvgAqi]         = useState(null);

  const { location: geoLocation } = useGeolocation();
  const mapCenter = geoLocation ? [geoLocation.lat, geoLocation.lon] : [23.8103, 90.4125];

  const { data: currentWeather } = useQuery({
    queryKey: ['weather', geoLocation?.lat, geoLocation?.lon],
    queryFn:  () => fetchCurrentWeather(geoLocation),
    enabled:  !!geoLocation,
  });

  const handleMapClick = async ({ lat, lng }) => {
    if (tab !== 'map') return;
    setMCPos({ lat, lng }); setClickW(null); setClickAqi(null); setClickL(true);
    try {
      const [w, a] = await Promise.allSettled([fetchCurrentWeather({ lat, lon: lng }), fetchAirQuality({ lat, lon: lng })]);
      setClickW(w.status === 'fulfilled' ? w.value : null);
      setClickAqi(a.status === 'fulfilled' ? a.value : null);
    } finally { setClickL(false); }
  };

  const handleClearClick = () => { setMCPos(null); setClickW(null); setClickAqi(null); };

  // Route state lifted for map rendering
  const [from, setFrom] = useState(null);
  const [to, setTo]     = useState(null);
  const [routes, setRoutes]     = useState(null);
  const [routeLoad, setRL]      = useState(false);
  const [routeErr, setRE]       = useState('');
  const [selIdx, setSelIdx]     = useState(0);
  const [gpsLoad, setGpsLoad]   = useState(false);
  const [showMapMobile, setShowMapMobile] = useState(false);

  // Auto-fill "From" with GPS location when route tab is opened
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

  // Shared map section (rendered once, used in both mobile+desktop)
  const MapSection = (
    <MapContainer center={mapCenter} zoom={7} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      {tab === 'map' && <ClickHandler onMapClick={handleMapClick} />}
      <BangladeshOverlay avgAqi={avgAqi} />
      <CityMarkers onAvgAqi={setAvgAqi} />
      {geoLocation && (
        <Marker position={[geoLocation.lat, geoLocation.lon]} icon={userIcon}>
          <Popup><p className="text-sm font-semibold">{t('spatial.yourLocation')}</p></Popup>
        </Marker>
      )}
      {tab === 'map' && mapClickPos && <Marker position={[mapClickPos.lat, mapClickPos.lng]} />}
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

  // Route planner sidebar content
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
          {/* Route count hint */}
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

                  {/* Stats row */}
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

          {/* Google Maps navigation button */}
          <button
            onClick={() => {
              if (!from || !to) return;
              const sel = routes[selIdx];
              // Use waypoints from selected route for accurate navigation
              const waypoints = sel
                ? `${from.lat},${from.lon}/${to.lat},${to.lon}`
                : `${from.lat},${from.lon}/${to.lat},${to.lon}`;
              window.open(
                `https://www.google.com/maps/dir/${waypoints}`,
                '_blank',
                'noopener,noreferrer'
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

      {/* ── Mobile layout: stacked vertically ── */}
      <div className="flex flex-col flex-1 overflow-hidden lg:hidden">
        {/* Map toggle strip (mobile only) */}
        <div className="flex border-b border-white/8 flex-shrink-0" style={{ background: 'rgba(9,13,22,0.97)' }}>
          {/* Tab switcher */}
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
          {/* Map/Form toggle (route tab only) */}
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

        {/* Mobile map (full screen, visible when toggled or map tab) */}
        {(tab === 'map' || showMapMobile) ? (
          <div className="flex-1" style={{ minHeight: 0 }}>
            {MapSection}
          </div>
        ) : (
          /* Mobile sidebar content */
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 scrollbar-hide">
            {tab === 'map' ? (
              <MapExplorer
                clickedPos={mapClickPos}
                clickWeather={clickWeather}
                clickAqi={clickAqi}
                panelLoad={clickPanelLoad}
                onClearClick={handleClearClick}
              />
            ) : RouteSidebarContent}
          </div>
        )}
      </div>

      {/* ── Desktop layout: side by side ── */}
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
            {tab === 'map' ? <MapExplorer geoLocation={geoLocation} /> : RouteSidebarContent}
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
