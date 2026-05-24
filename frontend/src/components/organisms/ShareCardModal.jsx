import { useRef, useState } from 'react';
import { X, Download, Share2, CheckCircle2, AlertTriangle, ShieldAlert, XCircle } from 'lucide-react';
import { toPng } from 'html-to-image';
import useProfileStore from '@/features/profile/store/profileStore';
import useDecisionEngine from '@/features/suggestion/hooks/useDecisionEngine';

const AQI_CONFIG = {
  1: { label: 'Good',      bg: 'from-emerald-400 to-green-600',   badge: 'bg-emerald-500' },
  2: { label: 'Fair',      bg: 'from-yellow-300 to-amber-500',    badge: 'bg-amber-400'   },
  3: { label: 'Moderate',  bg: 'from-orange-400 to-orange-600',   badge: 'bg-orange-500'  },
  4: { label: 'Poor',      bg: 'from-red-400 to-red-600',         badge: 'bg-red-500'     },
  5: { label: 'Very Poor', bg: 'from-purple-500 to-purple-800',   badge: 'bg-purple-600'  },
};

const VERDICT_ICON = {
  'YES':              CheckCircle2,
  'YES WITH CAUTION': AlertTriangle,
  'AVOID / NO':       ShieldAlert,
  'STRICT NO':        XCircle,
};

const ShareCard = ({ weatherData, aqiData, cardRef }) => {
  const aqi = aqiData?.list?.[0]?.main?.aqi ?? 1;
  const cfg = AQI_CONFIG[aqi] ?? AQI_CONFIG[1];
  const { healthProfile } = useProfileStore();
  const rec = useDecisionEngine(aqi, healthProfile);
  const VerdictIcon = VERDICT_ICON[rec.canGoOutside] ?? CheckCircle2;

  const city = weatherData?.name ?? 'Bangladesh';
  const country = weatherData?.sys?.country ?? '';
  const temp = weatherData?.main?.temp != null ? `${Math.round(weatherData.main.temp)}°C` : '—';
  const desc = weatherData?.weather?.[0]?.description ?? '';
  const humidity = weatherData?.main?.humidity ?? '—';
  const wind = weatherData?.wind?.speed != null ? `${Math.round(weatherData.wind.speed)} m/s` : '—';
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div
      ref={cardRef}
      className={`w-80 rounded-3xl overflow-hidden bg-gradient-to-br ${cfg.bg} shadow-2xl select-none`}
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-base">🌿</span>
            </div>
            <span className="text-white font-extrabold text-sm tracking-tight">Nishwas</span>
          </div>
          <span className="text-white/60 text-xs">{today}</span>
        </div>

        {/* City + Temp */}
        <div className="mb-4">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-0.5">
            {city}{country ? `, ${country}` : ''}
          </p>
          <div className="flex items-end gap-3">
            <span className="text-6xl font-black text-white leading-none">{temp}</span>
            <span className="text-white/80 text-sm capitalize mb-1">{desc}</span>
          </div>
        </div>

        {/* AQI badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`${cfg.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
            AQI {aqi} · {cfg.label}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 border-t border-white/20 mb-4" />

      {/* Verdict */}
      <div className="px-6 mb-4">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Go outside?</p>
        <div className="flex items-center gap-2">
          <VerdictIcon className="w-5 h-5 text-white" />
          <span className="text-white font-extrabold text-base">{rec.canGoOutside}</span>
        </div>
        <p className="text-white/70 text-xs mt-1">{rec.duration} · {rec.mask}</p>
      </div>

      {/* Stats row */}
      <div className="px-6 pb-6 grid grid-cols-2 gap-3">
        {[
          { label: 'Humidity', value: `${humidity}%` },
          { label: 'Wind',     value: wind           },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/15 rounded-2xl px-3 py-2.5">
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">{label}</p>
            <p className="text-white font-bold text-sm">{value}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-black/20 px-6 py-2.5 flex items-center justify-between">
        <span className="text-white/50 text-[10px]">নিশ্বাস — Breathe better. Live smarter.</span>
        <span className="text-white/50 text-[10px]">nishwas.app</span>
      </div>
    </div>
  );
};

const ShareCardModal = ({ weatherData, aqiData, onClose }) => {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `nishwas-aqi-${weatherData?.name ?? 'card'}.png`;
      a.click();
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-bold text-gray-800">Share AQI Card</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card preview */}
        <div className="px-6 py-5 flex justify-center bg-gray-50">
          <ShareCard weatherData={weatherData} aqiData={aqiData} cardRef={cardRef} />
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex items-center justify-between gap-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Download & share on social media</p>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md shadow-brand-200 hover:shadow-lg transition-all disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {done ? 'Saved!' : downloading ? 'Saving…' : 'Download PNG'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ShareCardModal;
