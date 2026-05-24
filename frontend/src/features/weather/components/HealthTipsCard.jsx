import { ShieldCheck, AlertTriangle, XCircle, CheckCircle, Activity } from 'lucide-react';

const AQI_HEALTH = {
  1: {
    label: 'Good',      summary: 'Air quality is excellent. Perfect time to be outdoors!',
    gradient: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20',
    accent: 'bg-emerald-500/10', icon: CheckCircle, iconColor: 'text-emerald-400',
    headingColor: 'text-emerald-400',
    tips: [
      { emoji: '🏃', text: 'Go for a run or cycle — air is clean!' },
      { emoji: '🪟', text: 'Open windows, let fresh air in.' },
      { emoji: '🧘', text: 'Great day for outdoor yoga or exercise.' },
      { emoji: '👶', text: 'Safe for children and elderly to go out.' },
    ],
  },
  2: {
    label: 'Fair',      summary: 'Air quality is acceptable. Most people are fine outdoors.',
    gradient: 'from-yellow-500/20 to-amber-600/10', border: 'border-yellow-500/20',
    accent: 'bg-yellow-500/10', icon: Activity, iconColor: 'text-yellow-400',
    headingColor: 'text-yellow-400',
    tips: [
      { emoji: '🚶', text: 'Light outdoor activities are fine.' },
      { emoji: '😷', text: 'Sensitive groups may feel mild effects.' },
      { emoji: '💧', text: 'Stay hydrated if spending time outside.' },
      { emoji: '⏱️', text: 'Limit prolonged outdoor exercise.' },
    ],
  },
  3: {
    label: 'Moderate',  summary: 'Sensitive groups should limit outdoor exposure.',
    gradient: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/20',
    accent: 'bg-orange-500/10', icon: AlertTriangle, iconColor: 'text-orange-400',
    headingColor: 'text-orange-400',
    tips: [
      { emoji: '😷', text: 'Wear a mask if going outside for long.' },
      { emoji: '🏠', text: 'Children & elderly should stay indoors.' },
      { emoji: '🌬️', text: 'Keep windows closed during peak hours.' },
      { emoji: '🏋️', text: 'Move workouts indoors today.' },
    ],
  },
  4: {
    label: 'Poor',      summary: 'Unhealthy for everyone. Minimize outdoor time.',
    gradient: 'from-red-500/20 to-red-700/10', border: 'border-red-500/20',
    accent: 'bg-red-500/10', icon: XCircle, iconColor: 'text-red-400',
    headingColor: 'text-red-400',
    tips: [
      { emoji: '🚫', text: 'Avoid all strenuous outdoor activity.' },
      { emoji: '😷', text: 'Wear N95 mask if you must go out.' },
      { emoji: '🏠', text: 'Keep doors and windows tightly shut.' },
      { emoji: '🌿', text: 'Use air purifier indoors if available.' },
    ],
  },
  5: {
    label: 'Very Poor', summary: 'Hazardous air. Stay indoors and protect yourself.',
    gradient: 'from-purple-500/20 to-purple-900/10', border: 'border-purple-500/20',
    accent: 'bg-purple-500/10', icon: ShieldCheck, iconColor: 'text-purple-400',
    headingColor: 'text-purple-400',
    tips: [
      { emoji: '🏠', text: 'Stay indoors — do not go outside.' },
      { emoji: '😷', text: 'Wear N95 even indoors near windows.' },
      { emoji: '🏥', text: 'If breathing difficulty, seek medical help.' },
      { emoji: '🚗', text: 'If driving, keep car windows fully closed.' },
    ],
  },
};

const HealthTipsCard = ({ aqiData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-white/5 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!aqiData) return null;

  const aqi    = aqiData.list[0].main.aqi;
  const health = AQI_HEALTH[aqi] ?? AQI_HEALTH[1];
  const Icon   = health.icon;

  return (
    <div className={`glass-card border ${health.border} overflow-hidden`}>
      {/* Header strip */}
      <div className={`bg-gradient-to-r ${health.gradient} px-5 py-4 flex items-center justify-between border-b ${health.border}`}>
        <div>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-0.5">Health Advisory</p>
          <h3 className={`text-base font-extrabold ${health.headingColor}`}>AQI {aqi} — {health.label}</h3>
          <p className="text-white/50 text-sm mt-0.5">{health.summary}</p>
        </div>
        <Icon className={`w-8 h-8 ${health.iconColor} opacity-60 flex-shrink-0`} />
      </div>

      {/* Tips */}
      <div className={`${health.accent} px-5 py-4`}>
        <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">What you should do</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {health.tips.map(({ emoji, text }, i) => (
            <div key={i} className="flex items-center gap-3 glass-card px-3 py-2.5">
              <span className="text-xl">{emoji}</span>
              <p className="text-sm text-white/60">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthTipsCard;
