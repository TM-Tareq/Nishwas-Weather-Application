import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import {
  Navigation2, AlertTriangle, Clock, Ruler, Wind,
  CheckCircle2, MapPin, X, Loader2, LocateFixed, ArrowUpDown,
} from 'lucide-react';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';
import { fetchAirQuality } from '@/features/weather/api/weatherApi';

//  AQI config 

const AQI_META = {
  1: { label: 'Good',      color: 'text-green-700',  bar: 'bg-green-500'  },
  2: { label: 'Fair',      color: 'text-yellow-700', bar: 'bg-yellow-400' },
  3: { label: 'Moderate',  color: 'text-orange-700', bar: 'bg-orange-500' },
  4: { label: 'Poor',      color: 'text-red-700',    bar: 'bg-red-500'    },
  5: { label: 'Very Poor', color: 'text-purple-700', bar: 'bg-purple-600' },
};

//  Helpers 

const fmtTime = (s) => {
  const m = Math.round(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
};
const fmtDist = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

// Sample count evenly-spaced lat/lon points along an OSRM route.
// OSRM coords are [lon, lat] (GeoJSON) — we return { lat, lon } objects.
const sampleRoutePoints = (coords, count = 3) => {
  if (!coords?.length) return [];
  return Array.from({ length: count }, (_, i) => {
    const idx = Math.floor((i + 1) / (count + 1) * coords.length);
    const c = coords[Math.max(0, Math.min(idx, coords.length - 1))];
    return { lat: c[1], lon: c[0] };
  });
};

// Extract 1-2 road names from the middle 60% of OSRM steps for "Via …" label.
const viaText = (legs) => {
  try {
    const steps = legs[0]?.steps ?? [];
    const names = steps
      .slice(Math.floor(steps.length * 0.2), Math.floor(steps.length * 0.8))
      .map(s => s.name)
      .filter(n => n && n.length > 2);
    const unique = [...new Set(names)].slice(0, 2);
    return unique.length ? `Via ${unique.join(' & ')}` : 'Direct route';
  } catch { return 'Direct route'; }
};

//  Nominatim geocoding 

const searchPlaces = async (query) => {
  if (!query || query.trim().length < 2) return [];
  const params = new URLSearchParams({
    q: query, format: 'json', limit: 6, countrycodes: 'bd', addressdetails: 1,
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'Nishwas-App/1.0' },
  });
  const data = await res.json();
  return data.map(item => {
    const a = item.address ?? {};
    const name =
      a.amenity || a.suburb || a.neighbourhood || a.quarter ||
      a.town || a.village || a.city_district || a.city ||
      item.display_name.split(',')[0];
    const context = [a.city || a.town || a.county, a.state].filter(Boolean).join(', ');
    return { name, context, display: item.display_name, lat: parseFloat(item.lat), lon: parseFloat(item.lon) };
  });
};

const reverseGeocode = async (lat, lon) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    { headers: { 'User-Agent': 'Nishwas-App/1.0' } },
  );
  const data = await res.json();
  const a = data.address ?? {};
  const name = a.suburb || a.neighbourhood || a.road || a.city_district || a.city || 'My Location';
  return { name, lat, lon, context: [a.city || a.state].filter(Boolean).join(', ') };
};

//  OSRM routing 

const fetchOsrmRoutes = async (from, to) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from.lon},${from.lat};${to.lon},${to.lat}` +
      `?alternatives=true&overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('Routing service unavailable');
    const data = await res.json();
    if (data.code !== 'Ok') throw new Error('No route found between these locations');
    return data.routes;
  } finally {
    clearTimeout(timer);
  }
};

//  Map view 

// Fits map to all routes when they load; pans to origin when only From is set.
const MapView = ({ routes, from }) => {
  const map = useMap();
  useEffect(() => {
    if (routes?.length) {
      const all = routes.flatMap(r => r.geometry.coordinates.map(c => [c[1], c[0]]));
      if (all.length) map.fitBounds(all, { padding: [45, 45] });
    } else if (from) {
      map.flyTo([from.lat, from.lon], 13, { duration: 1 });
    }
  }, [routes, from, map]);
  return null;
};

//  Location search input 

const LocationInput = ({
  icon: Icon, iconColor, placeholder, value, onChange,
  excludeLoc, rightIcon: RightIcon, onRightClick, rightLoading,
}) => {
  const [query, setQuery]      = useState('');
  const [suggestions, setSugg] = useState([]);
  const [open, setOpen]        = useState(false);
  const [loading, setLoading]  = useState(false);
  const ref    = useRef(null);
  const debRef = useRef(null);

  useEffect(() => { if (value) setQuery(value.name); }, [value]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    onChange(null);
    setOpen(true);
    clearTimeout(debRef.current);
    if (q.trim().length < 2) { setSugg([]); return; }
    setLoading(true);
    debRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(q);
        setSugg(results.filter(r =>
          !excludeLoc ||
          !(Math.abs(r.lat - excludeLoc.lat) < 0.001 && Math.abs(r.lon - excludeLoc.lon) < 0.001)
        ));
      } finally { setLoading(false); }
    }, 420);
  };

  const select = (loc) => { onChange(loc); setQuery(loc.name); setOpen(false); setSugg([]); };
  const clear = () => { setQuery(''); onChange(null); setSugg([]); setOpen(false); };

  return (
    <div className="relative flex items-center gap-2" ref={ref}>
      <div className="relative flex-1">
        <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor} pointer-events-none`} />
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
        )}
        {!loading && query && (
          <button onClick={clear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {open && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-[9999] overflow-hidden max-h-60 overflow-y-auto">
            {suggestions.map((loc, i) => (
              <button
                key={i}
                onMouseDown={() => select(loc)}
                className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-brand-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{loc.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{loc.context || loc.display}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {RightIcon && (
        <button
          onClick={onRightClick}
          disabled={rightLoading}
          className="flex-shrink-0 p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-brand-50 hover:border-brand-200 transition-colors disabled:opacity-50"
        >
          {rightLoading
            ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            : <RightIcon className="w-4 h-4 text-gray-500" />}
        </button>
      )}
    </div>
  );
};

//  Route card 

const RouteCard = ({ route, avgAqi, aqiLoading, isRecommended, isFastest, isSelected, onSelect, routeNum }) => {
  const aqiKey = avgAqi != null ? Math.min(5, Math.max(1, Math.round(avgAqi))) : null;
  const meta = aqiKey ? AQI_META[aqiKey] : null;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-150 ${
        isSelected
          ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-100'
          : 'border-gray-200 bg-white hover:border-brand-200 hover:shadow-sm'
      }`}
    >
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {isRecommended && (
          <span className="flex items-center gap-1 text-[10px] font-extrabold text-white bg-brand-600 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            <CheckCircle2 className="w-2.5 h-2.5" /> Best Air
          </span>
        )}
        {isFastest && (
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            ⚡ Fastest
          </span>
        )}
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider ml-auto">
          Route {routeNum}
        </span>
        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-brand-500 flex-shrink-0" />}
      </div>

      {/* Time + Distance */}
      <div className="flex items-center gap-5 mb-1.5">
        <span className="text-xl font-extrabold text-gray-900 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-gray-400" />
          {fmtTime(route.duration)}
        </span>
        <span className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5 text-gray-400" />
          {fmtDist(route.distance)}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-3">{viaText(route.legs)}</p>

      {/* Average AQI bar */}
      {aqiLoading ? (
        <div className="h-5 bg-gray-100 rounded animate-pulse" />
      ) : meta ? (
        <div className="flex items-center gap-2.5">
          <Wind className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${(aqiKey / 5) * 100}%` }} />
          </div>
          <span className={`text-[11px] font-bold ${meta.color}`}>{meta.label} air</span>
        </div>
      ) : null}
    </button>
  );
};

//  Page 

const RoutePage = () => {
  const [from, setFrom] = useState(null);
  const [to,   setTo]   = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [locating, setLocating] = useState(false);

  // GPS → reverse geocode → set as From
  const handleLocate = useCallback(async () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const place = await reverseGeocode(latitude, longitude);
          setFrom(place);
        } finally { setLocating(false); }
      },
      () => setLocating(false),
      { timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  // Swap From ↔ To
  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  // OSRM route query — fires automatically when both locations are set
  const { data: routes, isLoading: routeLoading, error: routeError } = useQuery({
    queryKey: ['osrm', from?.lat, from?.lon, to?.lat, to?.lon],
    queryFn: () => fetchOsrmRoutes(from, to),
    enabled: !!from && !!to,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  useEffect(() => { setSelectedIdx(0); }, [routes]);

  // Sample 3 evenly-spaced AQI check-points per route
  const routeSamples = (routes ?? []).map(r => sampleRoutePoints(r.geometry.coordinates, 3));
  const flatSamples  = routeSamples.flat();

  const sampleAqiQueries = useQueries({
    queries: flatSamples.map(pt => ({
      queryKey: ['aqiPt', pt.lat.toFixed(3), pt.lon.toFixed(3)],
      queryFn: () => fetchAirQuality(pt),
      staleTime: 1000 * 60 * 10,
    })),
  });

  // Average the 3 sample AQI values for each route
  const avgAqiPerRoute = routeSamples.map((samples, ri) => {
    const start = routeSamples.slice(0, ri).reduce((s, p) => s + p.length, 0);
    const slice = sampleAqiQueries.slice(start, start + samples.length);
    const vals = slice.map(q => q.data?.list?.[0]?.main?.aqi).filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  });

  const aqiLoading = sampleAqiQueries.some(q => q.isLoading);

  // Route with lowest avg AQI = best air quality
  const recommendedIdx = (() => {
    const valid = avgAqiPerRoute.map((v, i) => ({ v, i })).filter(x => x.v !== null);
    if (!valid.length) return 0;
    return valid.reduce((best, cur) => cur.v < best.v ? cur : best).i;
  })();

  // Route with shortest duration = fastest
  const fastestIdx = (() => {
    if (!routes?.length) return 0;
    return routes.reduce((best, r, i) => r.duration < routes[best].duration ? i : best, 0);
  })();

  const handleNavigation = () => {
    if (!from || !to) return;
    window.open(`https://www.google.com/maps/dir/${from.lat},${from.lon}/${to.lat},${to.lon}`, '_blank');
  };

  return (
    <div className="min-h-screen page-enter flex flex-col">
      <Navbar />
      <BottomNav />

      <div className="flex flex-col flex-1 max-w-4xl w-full mx-auto px-4 pt-5 pb-24 md:pb-6 gap-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-md shadow-brand-200 flex-shrink-0">
            <Navigation2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Safe Route Planner</h1>
            <p className="text-xs text-gray-400">Compare routes by air quality exposure</p>
          </div>
        </div>

        {/* Location inputs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
          <LocationInput
            icon={MapPin}
            iconColor="text-brand-500"
            placeholder="Starting point — type any area…"
            value={from}
            onChange={setFrom}
            excludeLoc={to}
            rightIcon={LocateFixed}
            onRightClick={handleLocate}
            rightLoading={locating}
          />

          {/* Swap divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px border-t border-dashed border-gray-200" />
            <button
              onClick={handleSwap}
              className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-brand-50 hover:border-brand-200 transition-colors"
              title="Swap from / to"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <div className="flex-1 h-px border-t border-dashed border-gray-200" />
          </div>

          <LocationInput
            icon={MapPin}
            iconColor="text-red-500"
            placeholder="Destination — type any area…"
            value={to}
            onChange={setTo}
            excludeLoc={from}
          />
        </div>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 280 }}>
          <MapContainer
            center={from ? [from.lat, from.lon] : [23.77, 90.41]}
            zoom={from ? 13 : 7}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            <MapView routes={routes} from={from} />

            {/* Non-selected routes drawn first (behind) */}
            {routes?.map((route, i) => i !== selectedIdx && (
              <Polyline
                key={`alt-${i}`}
                positions={route.geometry.coordinates.map(c => [c[1], c[0]])}
                pathOptions={{ color: '#d97706', weight: 3, opacity: 0.5, dashArray: '8 6' }}
                eventHandlers={{ click: () => setSelectedIdx(i) }}
              />
            ))}

            {/* Selected route on top */}
            {routes?.[selectedIdx] && (
              <Polyline
                positions={routes[selectedIdx].geometry.coordinates.map(c => [c[1], c[0]])}
                pathOptions={{ color: '#166534', weight: 5, opacity: 0.9 }}
              />
            )}

            {from && (
              <CircleMarker
                center={[from.lat, from.lon]} radius={9}
                pathOptions={{ fillColor: '#16a34a', color: '#fff', weight: 2.5, fillOpacity: 1 }}
              />
            )}
            {to && (
              <CircleMarker
                center={[to.lat, to.lon]} radius={9}
                pathOptions={{ fillColor: '#dc2626', color: '#fff', weight: 2.5, fillOpacity: 1 }}
              />
            )}
          </MapContainer>
        </div>

        {/* Route loading skeletons */}
        {routeLoading && (
          <div className="space-y-3">
            {[0, 1].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {/* Route error */}
        {routeError && !routeLoading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Could not find a route</p>
              <p className="text-xs text-red-500 mt-0.5">Try different locations or check your connection.</p>
            </div>
          </div>
        )}

        {/* Route cards */}
        {routes && !routeLoading && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
              {routes.length} route{routes.length !== 1 ? 's' : ''} found · tap to select
            </p>
            {routes.map((route, i) => (
              <RouteCard
                key={i}
                route={route}
                avgAqi={avgAqiPerRoute[i]}
                aqiLoading={aqiLoading}
                isRecommended={routes.length > 1 && i === recommendedIdx}
                isFastest={routes.length > 1 && i === fastestIdx}
                isSelected={i === selectedIdx}
                onSelect={() => setSelectedIdx(i)}
                routeNum={i + 1}
              />
            ))}
          </div>
        )}

        {/* Start Navigation CTA */}
        {routes && !routeLoading && (
          <button
            onClick={handleNavigation}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-brand-700 to-brand-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-200 hover:shadow-xl transition-all text-base"
          >
            <Navigation2 className="w-5 h-5" />
            Start Navigation
          </button>
        )}

        {/* Hint when only From is set */}
        {from && !to && !routes && !routeLoading && (
          <div className="bg-brand-50 border border-brand-100 rounded-2xl px-5 py-3 text-sm text-brand-600 font-medium">
            Now add a destination to find routes
          </div>
        )}

        {/* Empty state */}
        {!from && !to && !routeLoading && !routes && (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation2 className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold text-sm mb-1">Find the cleanest route</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Type any area, street, or landmark in Bangladesh.<br />
              We compare routes by air quality exposure.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default RoutePage;
