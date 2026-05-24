import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, X, ArrowRight } from 'lucide-react';
import useProfileStore from '@/features/profile/store/profileStore';

const AQI_META = {
  1: { label: 'Good',      style: 'border-emerald-500/25', bg: 'rgba(16,185,129,0.08)',  text: 'text-emerald-400', icon: 'text-emerald-400' },
  2: { label: 'Fair',      style: 'border-yellow-500/25',  bg: 'rgba(234,179,8,0.08)',   text: 'text-yellow-400',  icon: 'text-yellow-400'  },
  3: { label: 'Moderate',  style: 'border-orange-500/25',  bg: 'rgba(249,115,22,0.08)',  text: 'text-orange-400',  icon: 'text-orange-400'  },
  4: { label: 'Poor',      style: 'border-red-500/25',     bg: 'rgba(239,68,68,0.08)',   text: 'text-red-400',     icon: 'text-red-400'     },
  5: { label: 'Very Poor', style: 'border-purple-500/25',  bg: 'rgba(168,85,247,0.08)',  text: 'text-purple-400',  icon: 'text-purple-400'  },
};

const AqiAlertBanner = ({ aqiLevel, cityName }) => {
  const navigate      = useNavigate();
  const aqiThreshold  = useProfileStore(s => s.aqiThreshold);
  const [dismissed, setDismissed] = useState(false);

  if (!aqiLevel || aqiLevel < aqiThreshold || dismissed) return null;

  const meta          = AQI_META[aqiLevel] ?? AQI_META[5];
  const thresholdMeta = AQI_META[aqiThreshold] ?? AQI_META[3];

  return (
    <div
      className={`flex items-start gap-3 glass-card border ${meta.style} px-4 py-3.5 mb-4`}
      style={{ background: meta.bg }}
    >
      <BellRing className={`w-5 h-5 flex-shrink-0 mt-0.5 ${meta.icon}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold leading-tight ${meta.text}`}>
          AQI Alert{cityName ? ` — ${cityName}` : ''}
        </p>
        <p className="text-xs mt-0.5 text-white/50 leading-relaxed">
          Air quality reached <strong className={meta.text}>{meta.label} (AQI {aqiLevel})</strong>,
          exceeding your threshold of <strong className="text-white/70">{thresholdMeta.label} ({aqiThreshold})</strong>.
          Limit outdoor exposure and wear a mask.
        </p>
        <button
          onClick={() => navigate('/biometrics')}
          className={`flex items-center gap-1 text-xs font-semibold mt-1.5 ${meta.text} opacity-70 hover:opacity-100 transition-opacity`}
        >
          Change alert threshold <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-white/30 hover:text-white/60 transition-colors mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AqiAlertBanner;
