import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wind, Map, ShieldCheck, CloudSun, ArrowRight, Leaf,
  Zap, Trophy, Users, CheckCircle, Mail, ChevronDown,
  Activity, BarChart3, Navigation, Cpu,
} from 'lucide-react';
import useAuthStore from '@/features/auth/store/authStore';

/*  static data  */

const FEATURES = [
  {
    icon: CloudSun,
    title: 'Live Weather',
    desc: 'Real-time temperature, humidity, wind speed & pressure for any Bangladesh city.',
    accent: 'from-amber-400 to-orange-500',
    glow: 'rgba(251,191,36,0.15)',
  },
  {
    icon: Wind,
    title: 'Air Quality Index',
    desc: 'PM2.5, PM10, CO, NO₂, O₃ — full pollutant breakdown with WHO 2021 thresholds.',
    accent: 'from-emerald-400 to-emerald-600',
    glow: 'rgba(16,185,129,0.15)',
  },
  {
    icon: ShieldCheck,
    title: 'Bio-Vulnerability Engine',
    desc: 'Personalized go/no-go based on your health profile, AQI & humidity interaction.',
    accent: 'from-teal-400 to-cyan-600',
    glow: 'rgba(20,184,166,0.15)',
  },
  {
    icon: Navigation,
    title: 'Clean Air Routing',
    desc: 'Route planner that picks the path with the lowest Composite Air Index (CAI).',
    accent: 'from-violet-400 to-purple-600',
    glow: 'rgba(139,92,246,0.15)',
  },
  {
    icon: Activity,
    title: 'Aero-Score',
    desc: 'A single 0-100 breathability score combining AQI, humidity, wind & temperature.',
    accent: 'from-sky-400 to-blue-600',
    glow: 'rgba(56,189,248,0.15)',
  },
  {
    icon: Trophy,
    title: 'Nexus Community',
    desc: 'Daily check-ins, streak badges, leaderboard, and local air quality reports.',
    accent: 'from-yellow-400 to-amber-500',
    glow: 'rgba(251,191,36,0.15)',
  },
];

const STEPS = [
  { step: '01', title: 'Create your account', desc: 'Sign up free in seconds. No credit card needed.' },
  { step: '02', title: 'Set your health profile', desc: 'Tell us about asthma, heart conditions, or outdoor work.' },
  { step: '03', title: 'Get your Aero-Score', desc: 'See real-time AQI + a personalized breathability score made for you.' },
];

const STATS = [
  { value: '6',    label: 'Pollutants tracked' },
  { value: '10+',  label: 'Bangladesh cities' },
  { value: '5-day',label: 'Forecast horizon' },
  { value: 'WHO',  label: '2021 AQI standards' },
];

const AQI_CITIES = [
  { city: 'Dhaka',      aqi: 4, label: 'Poor',     bar: 'w-4/5',  color: '#f87171' },
  { city: 'Chittagong', aqi: 3, label: 'Moderate',  bar: 'w-3/5',  color: '#fb923c' },
  { city: 'Sylhet',     aqi: 2, label: 'Fair',      bar: 'w-2/5',  color: '#facc15' },
  { city: 'Rajshahi',   aqi: 3, label: 'Moderate',  bar: 'w-3/5',  color: '#fb923c' },
  { city: 'Khulna',     aqi: 2, label: 'Fair',      bar: 'w-2/5',  color: '#facc15' },
];

const FAQ_ITEMS = [
  {
    q: 'Is Nishwas free to use?',
    a: 'Yes — completely free, no subscription, no ads, no hidden fees. Create an account and get full access instantly.',
  },
  {
    q: 'How accurate is the air quality data?',
    a: 'Air quality data is pulled hourly from OpenWeatherMap sensors and benchmarked against WHO 2021 AQI standards. Updated every 60 minutes.',
  },
  {
    q: 'What does the Aero-Score mean?',
    a: 'Aero-Score (0-100) is our breathability rating: combines AQI, humidity penalty, wind bonus, and heat penalty into one number. 80+ is great; below 40 means stay indoors.',
  },
  {
    q: 'How does the Bio-Vulnerability Engine work?',
    a: 'It maps your health profile (asthma, heart disease, pregnancy, outdoor work) against current AQI + humidity interaction and gives a clear GO / CAUTION / AVOID verdict with mask advice.',
  },
  {
    q: 'What is the Clean Air Route?',
    a: 'The route planner calculates a Composite Air Index (CAI) for each path alternative and highlights the one with the cleanest air — not just the shortest distance.',
  },
  {
    q: 'Can I use Nishwas without sharing my location?',
    a: 'Absolutely. Search any city manually. GPS is optional and only used to auto-detect your nearest weather station.',
  },
];

const TECH = [
  { name: 'OpenWeatherMap', sub: 'Live weather & AQI',  emoji: '🌐' },
  { name: 'WHO 2021',       sub: 'AQI health thresholds', emoji: '🏥' },
];

/*  animated counter hook  */

const useCountUp = (target, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(ease * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return [count, ref];
};

/*  FAQ accordion  */

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="glass-card overflow-hidden transition-all duration-300"
      style={{ boxShadow: open ? '0 0 0 1px rgba(16,185,129,0.25), 0 4px 24px rgba(16,185,129,0.08)' : undefined }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left group"
      >
        <span className={`text-sm font-semibold transition-colors duration-200 ${open ? 'text-emerald-400' : 'text-slate-200 group-hover:text-emerald-300'}`}>
          {q}
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ${open ? 'rotate-180 text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400'}`}
        />
      </button>
      <div
        style={{
          maxHeight: open ? '200px' : '0',
          opacity: open ? 1 : 0,
          transition: 'max-height 0.35s ease, opacity 0.25s ease',
          overflow: 'hidden',
        }}
      >
        <div className="px-6 pb-5 pt-1 text-sm text-slate-400 leading-relaxed border-t border-white/5">
          {a}
        </div>
      </div>
    </div>
  );
};

/* main component*/

const LandingPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const goApp  = () => navigate(isAuthenticated ? '/dashboard' : '/auth?mode=signup');
  const goAuth = () => navigate('/auth');

  /* live counter — simulated "checks today" */
  const [checks, checksRef] = useCountUp(84_293, 2400);

  return (
    <div className="min-h-screen flex flex-col bg-page">

      {/* Navbar  */}
      <header className="glass border-b border-white/8 sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-extrabold text-emerald-400 tracking-tight">Nishwas</span>
              <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-widest">নিশ্বাস</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
                Dashboard
              </button>
            ) : (
              <>
                <button onClick={goAuth}
                  className="text-sm font-medium text-slate-400 hover:text-emerald-400 px-4 py-2 rounded-xl hover:bg-emerald-500/10 transition-colors">
                  Login
                </button>
                <button onClick={goApp}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors shadow-lg shadow-emerald-900/40">
                  Sign up free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        {/* atmospheric blobs */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[140px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />

        <div className="relative max-w-[1440px] mx-auto px-4 lg:px-8 flex flex-col lg:flex-row items-center gap-16">

          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold text-emerald-400 border border-emerald-500/30"
              style={{ background: 'rgba(16,185,129,0.08)' }}>
              <Leaf className="w-3.5 h-3.5" />
              Bangladesh's Air Intelligence Platform
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
              <span className="text-slate-100">Breathe </span>
              <span className="neon-text" style={{
                background: 'linear-gradient(135deg, #10B981, #34d399)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>better.</span>
              <br />
              <span className="text-slate-100">Live </span>
              <span style={{
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>smarter.</span>
            </h1>

            <p className="text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
              Real-time weather, air quality index, and 5-day forecasts built for Bangladesh —
              with personalized outdoor safety advice for your health profile.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 mb-10">
              <button onClick={goApp}
                className="flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl transition-all hover:scale-105 text-base shadow-lg shadow-emerald-900/40"
                style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
                Get started — it's free
                <ArrowRight className="w-5 h-5" />
              </button>
              {!isAuthenticated && (
                <button onClick={goAuth}
                  className="text-sm font-medium text-slate-500 hover:text-emerald-400 transition-colors px-2 py-4">
                  Already have an account? Login →
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start">
              {['Free forever', 'No ads', 'WHO 2021 standards', 'Bangladesh-focused'].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: AQI preview card */}
          <div className="flex-shrink-0 w-full max-w-[300px]">
            <div className="glass-card overflow-hidden" style={{ boxShadow: '0 0 0 1px rgba(16,185,129,0.15), 0 24px 64px rgba(0,0,0,0.5)' }}>
              {/* card header */}
              <div className="px-5 py-4 border-b border-white/8"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-emerald-400 font-bold text-sm">Live AQI · Bangladesh</span>
                  <span className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
                <p className="text-slate-500 text-xs">Updated every hour · OpenWeatherMap</p>
              </div>
              {/* city bars */}
              <div className="p-4 space-y-3">
                {AQI_CITIES.map(({ city, aqi, label, bar, color }) => (
                  <div key={city}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-300">{city}</span>
                      <span className="text-xs font-bold" style={{ color }}>{label} · {aqi}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className={`h-1.5 rounded-full ${bar}`} style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 flex items-center justify-between border-t border-white/5">
                <span className="text-xs text-slate-500">+5 more cities on map</span>
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/*  Live counter  */}
      <section ref={checksRef} className="py-12 border-y border-white/5" style={{ background: 'rgba(15,23,42,0.3)' }}>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 text-center">
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-3">Nishwas in numbers</p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-emerald-400" style={{ textShadow: '0 0 24px rgba(16,185,129,0.4)' }}>
                {checks.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Air quality checks today</p>
            </div>
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-4xl font-extrabold text-slate-200">{value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  Features  */}
      <section className="max-w-[1440px] mx-auto px-4 lg:px-8 py-24 w-full">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-slate-100 mb-3">Everything you need</h2>
          <p className="text-slate-500 max-w-md mx-auto">Built for Bangladesh's unique climate and air quality challenges</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, accent, glow }) => (
            <div key={title}
              className="glass-card p-6 group transition-all duration-300 hover:-translate-y-1 cursor-default"
              style={{ '--glow': glow }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 0 1px rgba(16,185,129,0.2), 0 8px 32px ${glow}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
            >
              <div className={`inline-flex p-3 rounded-xl mb-4 bg-gradient-to-br ${accent} bg-opacity-10`}
                style={{ background: glow }}>
                <div className={`bg-gradient-to-br ${accent} p-2 rounded-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="font-bold text-slate-200 mb-2 text-base group-hover:text-emerald-400 transition-colors">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-y border-white/5" style={{ background: 'rgba(15,23,42,0.4)' }}>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-slate-100 mb-3">How it works</h2>
            <p className="text-slate-500">Set up in under 2 minutes</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-900/30"
                  style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
                  <span className="text-white font-extrabold text-lg">{step}</span>
                </div>
                <h3 className="font-bold text-slate-200 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ  */}
      <section className="py-24">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-slate-100 mb-3">Frequently Asked Questions</h2>
            <p className="text-slate-500 max-w-md mx-auto">Everything you need to know about Nishwas</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/*  Final CTA  */}
      <section className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-24 w-full">
        <div className="glass-card relative overflow-hidden px-8 py-20 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))', boxShadow: '0 0 0 1px rgba(16,185,129,0.2), 0 32px 80px rgba(0,0,0,0.4)' }}>
          {/* blobs */}
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] pointer-events-none"
            style={{ background: 'rgba(16,185,129,0.12)' }} />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-[60px] pointer-events-none"
            style={{ background: 'rgba(56,189,248,0.08)' }} />
          <div className="relative">
            <p className="text-emerald-400 text-sm font-semibold mb-3">Start breathing better today</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 mb-4">
              Your lungs will thank you.
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
              Join Nishwas and get personalized outdoor safety advice powered by real-time air quality data.
            </p>
            <button onClick={goApp}
              className="inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-emerald-900/40 text-base"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
              Get started — it's free
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/*  Contact Us  */}
      <section className="py-16 border-t border-white/5" style={{ background: 'rgba(15,23,42,0.3)' }}>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="max-w-xl mx-auto glass-card p-10 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-900/30"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100 mb-2">Contact Us</h2>
            <p className="text-slate-400 text-sm mb-7 leading-relaxed">
              Have questions, feedback, or feature ideas? We'd love to hear from you.<br />
              We're a student team building for Bangladesh — every message counts.
            </p>
            <a
              href="mailto:warriordark451@gmail.com"
              className="inline-flex items-center gap-2 text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-emerald-900/30"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
            >
              <Mail className="w-4 h-4" />
              tmtareq20@gmail.com
            </a>
            <p className="text-xs text-slate-600 mt-5">We typically reply within 24 hours</p>
          </div>
        </div>
      </section>

      {/*  Tech strip  */}
      <section className="border-t border-white/5 py-12" style={{ background: 'rgba(15,23,42,0.2)' }}>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <p className="text-center text-xs font-semibold text-slate-600 uppercase tracking-widest mb-7 flex items-center justify-center gap-2">
            <Cpu className="w-3.5 h-3.5" />
            Powered by
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {TECH.map(({ name, sub, emoji }) => (
              <div key={name}
                className="glass flex items-center gap-3 px-4 py-3 rounded-xl min-w-[148px] hover:border-emerald-500/20 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-2xl">{emoji}</span>
                <div>
                  <p className="text-sm font-bold text-slate-300">{name}</p>
                  <p className="text-[11px] text-slate-600">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  Footer  */}
      <footer className="border-t border-white/5 py-8" style={{ background: 'rgba(9,13,22,0.8)' }}>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-emerald-400 text-sm">Nishwas</span>
              <span className="text-emerald-700 text-xs ml-2">নিশ্বাস</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 text-center">
            Data: OpenWeatherMap · WHO 2021 AQI standards · Built for Bangladesh
          </p>
          <p className="text-xs text-slate-700">© 2026 Nishwas</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
