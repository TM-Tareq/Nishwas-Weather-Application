import { useNavigate } from 'react-router-dom';
import { Wind, Map, ShieldCheck, CloudSun, ArrowRight, Leaf } from 'lucide-react';
import useAuthStore from '@/features/auth/store/authStore';

const features = [
  {
    icon: CloudSun,
    title: 'Live Weather',
    desc: 'Real-time temperature, humidity, wind speed for any city in Bangladesh and beyond.',
    color: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    icon: Wind,
    title: 'Air Quality Index',
    desc: 'Know your air — PM2.5, PM10, CO levels with color-coded AQI scale.',
    color: 'bg-brand-50 text-brand-600 border-brand-100',
  },
  {
    icon: Map,
    title: 'Interactive Map',
    desc: 'Click anywhere on the map to instantly get weather data for that location.',
    color: 'bg-teal-50 text-teal-600 border-teal-100',
  },
  {
    icon: ShieldCheck,
    title: '5-Day Forecast',
    desc: 'Plan your week ahead with daily weather forecast including feels-like temperature.',
    color: 'bg-violet-50 text-violet-600 border-violet-100',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleGetStarted = () => {
    navigate(isAuthenticated ? '/dashboard' : '/signup');
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* Nav */}
      <header className="bg-white/80 backdrop-blur-md border-b border-brand-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-700 rounded-2xl flex items-center justify-center shadow-md shadow-brand-200">
              <span className="text-xl">🌿</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-extrabold text-brand-700 tracking-tight">Nishwas</span>
              <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest">নিশ্বাস</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm font-medium text-gray-600 hover:text-brand-700 px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-brand-200"
                >
                  Sign up free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <Leaf className="w-3.5 h-3.5" />
          Bangladesh's Air & Weather Platform
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight max-w-2xl mb-5">
          Breathe{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-700">
            better.
          </span>
          <br />
          Live smarter.
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mb-10 leading-relaxed">
          Real-time weather, air quality index, and 5-day forecasts — all in one place.
          Know your air before you step outside.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleGetStarted}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-brand-200 transition-all hover:scale-105 text-base"
          >
            Get started — it's free
            <ArrowRight className="w-5 h-5" />
          </button>
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-gray-500 hover:text-brand-700 px-4 py-3.5 transition-colors"
            >
              Already have an account? Login →
            </button>
          )}
        </div>

        {/* Floating stats */}
        <div className="flex items-center gap-6 mt-12 flex-wrap justify-center">
          {[
            { value: 'Live', label: 'Real-time data' },
            { value: 'AQI', label: 'Air quality tracking' },
            { value: '5-day', label: 'Weather forecast' },
            { value: 'Free', label: 'No cost, always' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-extrabold text-brand-700">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-gray-900">Everything you need</h2>
          <p className="text-gray-500 text-sm mt-2">Built for Bangladesh's climate and air quality challenges</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="bg-white/70 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-brand-100 transition-all hover:-translate-y-1"
            >
              <div className={`inline-flex p-2.5 rounded-xl border ${color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-100 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <span className="font-bold text-brand-700 text-sm">Nishwas</span>
          </div>
          <p className="text-xs text-gray-400">নিশ্বাস — Breathe better. Live smarter.</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
