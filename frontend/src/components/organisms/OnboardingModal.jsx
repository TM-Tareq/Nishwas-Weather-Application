import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

const STORAGE_KEY = 'nishwas-onboarded';

const STEPS = [
  {
    emoji: '🌿',
    title: 'Welcome to Nishwas',
    subtitle: 'নিশ্বাস — "breath"',
    body: "Bangladesh's first personal air quality & weather companion. Stay safe, breathe better, and live smarter — every single day.",
    accent: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.25)',
    features: [],
  },
  {
    emoji: '⛅',
    title: 'Live Weather & Air Quality',
    subtitle: 'Dashboard + Spatial Hub',
    body: 'Get real-time weather and AQI for your location. See pollutants, 5-day forecasts, and health tips. The Spatial Hub shows live AQI for 10 Bangladesh cities.',
    accent: 'rgba(56,189,248,0.12)',
    border: 'rgba(56,189,248,0.2)',
    features: ['🌡️ Temperature, humidity, wind', '💨 AQI 1–5 with color coding', '🗺️ Interactive CARTO dark map'],
  },
  {
    emoji: '🛡️',
    title: 'Bio-Vulnerability Engine',
    subtitle: 'Biometrics + Outdoor',
    body: "Set your health profile once — get a daily go/no-go recommendation. The engine maps your sensitivity to current AQI + humidity and gives a clear verdict.",
    accent: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.2)',
    features: ['✅ Go outside? GO / CAUTION / AVOID', '😊 Daily health diary', '📊 Humidity × AQI interaction model'],
  },
  {
    emoji: '🏆',
    title: 'Nexus Community',
    subtitle: 'Community + Leaderboard',
    body: 'Share air quality reports from your area, join local events, and earn points. Daily check-ins build streaks and unlock badges on the leaderboard.',
    accent: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.2)',
    features: ['🔥 Daily streak rewards', '🌱 Community air reports', '👥 Events & leaderboard'],
  },
];

const OnboardingModal = () => {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const dismiss = () => { localStorage.setItem(STORAGE_KEY, '1'); setVisible(false); };
  const next    = () => { if (step < STEPS.length - 1) setStep(s => s + 1); else dismiss(); };
  const back    = () => setStep(s => s - 1);

  if (!visible) return null;

  const s      = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,13,22,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-card w-full max-w-md overflow-hidden"
        style={{ boxShadow: `0 0 0 1px ${s.border}, 0 24px 64px rgba(0,0,0,0.6)` }}>

        {/* Header */}
        <div className="px-6 pt-7 pb-6 relative border-b border-white/5"
          style={{ background: s.accent }}>
          <button onClick={dismiss}
            className="absolute top-4 right-4 w-8 h-8 glass rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="text-5xl mb-4">{s.emoji}</div>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">{s.subtitle}</p>
          <h2 className="text-xl font-extrabold text-white leading-tight">{s.title}</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-white/50 leading-relaxed mb-4">{s.body}</p>
          {s.features.length > 0 && (
            <div className="flex flex-col gap-2 mb-2">
              {s.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 glass-card px-3 py-2 text-sm text-white/60 font-medium">
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3 border-t border-white/5 pt-4">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`rounded-full transition-all duration-200 ${i === step ? 'w-5 h-2 bg-emerald-500' : 'w-2 h-2 bg-white/10 hover:bg-white/20'}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={back}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button onClick={next}
              className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2 rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
              {isLast ? 'Get Started' : 'Next'}
              {!isLast && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
