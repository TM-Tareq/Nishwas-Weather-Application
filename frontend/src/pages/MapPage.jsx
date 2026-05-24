import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Thermometer, Droplets, Wind, CloudRain, Gauge, Eye, Zap, Loader2, Activity } from 'lucide-react';
import Navbar, { BottomNav } from '@/components/organisms/Navbar';
import useGeolocation from '@/hooks/useGeolocation';

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

const MapPage = () => {
  const [searchParams] = useSearchParams();
  const { location, isLoading: locLoading } = useGeolocation();
  const lat = location?.lat ?? 23.7;
  const lon = location?.lon ?? 90.35;

  const initialLayer = LAYERS.find(l => l.key === searchParams.get('layer')) ?? LAYERS[0];
  const [activeLayer, setActiveLayer] = useState(initialLayer);
  const [iframeReady, setIframeReady] = useState(false);
  const iframeRef = useRef(null);

  // When layer changes, update iframe src directly (no full remount)
  const handleLayerChange = (layer) => {
    setActiveLayer(layer);
    setIframeReady(false);
    if (iframeRef.current) {
      iframeRef.current.src = buildWindyUrl(lat, lon, layer.key);
    }
  };

  // Once geolocation resolves, update iframe to center on user
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

        {/* Loading overlay while iframe initialises */}
        {!iframeReady && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
            style={{ background: '#090D16' }}
          >
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeLayer.color} flex items-center justify-center shadow-2xl`}
            >
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
      </div>
    </div>
  );
};

export default MapPage;
