import { ShieldCheck, AlertTriangle, XCircle, CheckCircle, Activity } from 'lucide-react';

const AQI_HEALTH = {
  1: {
    label: 'Good',
    summary: 'Air quality is excellent. Perfect time to be outdoors!',
    gradient: 'from-green-500 to-emerald-600',
    lightBg: 'bg-green-50',
    border: 'border-green-100',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    tips: [
      { emoji: '🏃', text: 'Go for a run or cycle — air is clean!' },
      { emoji: '🪟', text: 'Open windows, let fresh air in.' },
      { emoji: '🧘', text: 'Great day for outdoor yoga or exercise.' },
      { emoji: '👶', text: 'Safe for children and elderly to go out.' },
    ],
  },
  2: {
    label: 'Fair',
    summary: 'Air quality is acceptable. Most people are fine outdoors.',
    gradient: 'from-yellow-400 to-amber-500',
    lightBg: 'bg-yellow-50',
    border: 'border-yellow-100',
    icon: Activity,
    iconColor: 'text-yellow-600',
    tips: [
      { emoji: '🚶', text: 'Light outdoor activities are fine.' },
      { emoji: '😷', text: 'Sensitive groups may feel mild effects.' },
      { emoji: '💧', text: 'Stay hydrated if spending time outside.' },
      { emoji: '⏱️', text: 'Limit prolonged outdoor exercise.' },
    ],
  },
  3: {
    label: 'Moderate',
    summary: 'Sensitive groups should limit outdoor exposure.',
    gradient: 'from-orange-400 to-orange-600',
    lightBg: 'bg-orange-50',
    border: 'border-orange-100',
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    tips: [
      { emoji: '😷', text: 'Wear a mask if going outside for long.' },
      { emoji: '🏠', text: 'Children & elderly should stay indoors.' },
      { emoji: '🌬️', text: 'Keep windows closed during peak hours.' },
      { emoji: '🏋️', text: 'Move workouts indoors today.' },
    ],
  },
  4: {
    label: 'Poor',
    summary: 'Unhealthy for everyone. Minimize outdoor time.',
    gradient: 'from-red-500 to-red-700',
    lightBg: 'bg-red-50',
    border: 'border-red-100',
    icon: XCircle,
    iconColor: 'text-red-600',
    tips: [
      { emoji: '🚫', text: 'Avoid all strenuous outdoor activity.' },
      { emoji: '😷', text: 'Wear N95 mask if you must go out.' },
      { emoji: '🏠', text: 'Keep doors and windows tightly shut.' },
      { emoji: '🌿', text: 'Use air purifier indoors if available.' },
    ],
  },
  5: {
    label: 'Very Poor',
    summary: 'Hazardous air. Stay indoors and protect yourself.',
    gradient: 'from-purple-600 to-purple-900',
    lightBg: 'bg-purple-50',
    border: 'border-purple-100',
    icon: ShieldCheck,
    iconColor: 'text-purple-700',
    tips: [
      { emoji: '🏠', text: 'Stay indoors — do not go outside.' },
      { emoji: '😷', text: 'Wear N95 even indoors near windows.' },
      { emoji: '🏥', text: 'If breathing difficulty, seek medical help.' },
      { emoji: '🚗', text: 'If driving, keep car windows fully closed.' },
    ],
  },
};

const HealthTipsCard = ({ aqiData, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !aqiData) return null;

  const aqi = aqiData.list[0].main.aqi;
  const health = AQI_HEALTH[aqi];
  const Icon = health.icon;

  return (
    <div className={`rounded-2xl border ${health.border} overflow-hidden shadow-sm`}>
      {/* Header strip */}
      <div className={`bg-gradient-to-r ${health.gradient} px-6 py-4 flex items-center justify-between`}>
        <div>
          <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-0.5">Health Advisory</p>
          <h3 className="text-white text-lg font-extrabold">AQI {aqi} — {health.label}</h3>
          <p className="text-white/80 text-sm mt-0.5">{health.summary}</p>
        </div>
        <Icon className="w-10 h-10 text-white/60 shrink-0" />
      </div>

      {/* Tips */}
      <div className={`${health.lightBg} px-6 py-4`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">What you should do</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {health.tips.map(({ emoji, text }, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-white shadow-sm">
              <span className="text-xl">{emoji}</span>
              <p className="text-sm text-gray-700">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthTipsCard;
