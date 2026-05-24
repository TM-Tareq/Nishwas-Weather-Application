import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2, Wind, Activity, TrendingUp, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { loginUser, registerUser } from '@/features/auth/api/authApi';
import useAuthStore from '@/features/auth/store/authStore';

// Animation background
const Blob = ({ className }) => (
  <div className={`absolute rounded-full blur-3xl opacity-20 animate-float ${className}`} />
);

// AQI pulse dots
const AQI_CITIES = [
  { city: 'Dhaka',      aqi: 4, label: 'Poor',     color: 'bg-red-500',    pct: 80 },
  { city: 'Chittagong', aqi: 3, label: 'Moderate',  color: 'bg-orange-400', pct: 60 },
  { city: 'Sylhet',     aqi: 2, label: 'Fair',      color: 'bg-yellow-400', pct: 40 },
  { city: 'Rajshahi',   aqi: 1, label: 'Good',      color: 'bg-emerald-400',pct: 20 },
];

const FEATURES = [
  { icon: Wind,      text: 'Real-time AQI for 10+ BD cities' },
  { icon: Shield,    text: 'AI-powered outdoor safety engine' },
  { icon: TrendingUp,text: '5-day atmospheric forecast' },
  { icon: Activity,  text: 'Bio-climatic health insights' },
];

//Left brand panel 
const BrandPanel = () => (
  <div className="hidden lg:flex flex-col w-[420px] xl:w-[480px] flex-shrink-0 relative overflow-hidden bg-[#0a1628]">
    <Blob className="w-96 h-96 bg-emerald-500 -top-20 -left-20 animate-float" />
    <Blob className="w-64 h-64 bg-emerald-600 bottom-10 right-10 animate-float-slow" />

    <div className="relative flex flex-col h-full px-10 py-12">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-auto">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <span className="text-xl">🌿</span>
        </div>
        <div>
          <p className="text-xl font-extrabold text-white">Nishwas</p>
          <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">নিশ্বাস · Breathe better</p>
        </div>
      </div>

      {/* Headline */}
      <div className="my-10">
        <h1 className="text-4xl font-extrabold text-white leading-tight mb-3">
          Bangladesh's<br />
          <span className="text-emerald-400 neon-text">Air Intelligence</span><br />
          Platform
        </h1>
        <p className="text-white/50 text-sm leading-relaxed">
          Real-time AQI, personalized health profiles, safe route planning — all in one command center.
        </p>
      </div>

      {/* Live AQI s*/}
      <div className="glass-card p-4 mb-6">
        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">Live City AQI</p>
        <div className="flex flex-col gap-2">
          {AQI_CITIES.map(({ city, label, color, pct }) => (
            <div key={city} className="flex items-center gap-3">
              <span className="text-xs text-white/50 w-20 flex-shrink-0">{city}</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-white/40 w-16 text-right">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="flex flex-col gap-2.5">
        {FEATURES.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <Icon className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-sm text-white/60">{text}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Authentication
const AuthPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const navigate    = useNavigate();
  const login       = useAuthStore((s) => s.login);
  const currentUser = useAuthStore((s) => s.user);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { if (currentUser) navigate('/dashboard'); }, [currentUser, navigate]);
  useEffect(() => { reset(); setError(''); }, [isLogin, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const res = isLogin
        ? await loginUser({ email: data.email, password: data.password })
        : await registerUser({ name: data.name, email: data.email, password: data.password });

      if (res.token) {
        login(res.token, { id: res.id, name: res.name ?? data.name ?? data.email, email: res.email ?? data.email });
        navigate('/dashboard');
      } else {
        setError('Unexpected response. Please try again.');
      }
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to server. Is the backend running?');
      } else {
        setError(err.response.data?.message ?? (isLogin ? 'Invalid credentials.' : 'Registration failed.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#090D16' }}>
      <BrandPanel />

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        <Blob className="w-72 h-72 bg-emerald-600/30 top-0 right-0" />
        <Blob className="w-48 h-48 bg-emerald-500/20 bottom-10 left-0 animate-float-slow" />

        <div className="relative w-full max-w-md">
          {/* Mode toggle */}
          <div className="flex glass-card p-1 mb-8">
            {[t('auth.login'), t('auth.signUp')].map((label, i) => (
              <button
                key={label}
                onClick={() => setIsLogin(i === 0)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  (i === 0) === isLogin
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-white/65 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <h2 className="text-2xl font-extrabold text-white mb-1">
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h2>
          <p className="text-white/40 text-sm mb-7">
            {isLogin ? t('auth.signInSub') : t('auth.createSub')}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5">{t('auth.name')}</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  placeholder={t('auth.yourName')}
                  className="w-full glass-card px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  style={{ borderRadius: '0.75rem' }}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5">{t('auth.email')}</label>
              <input
                {...register('email', { required: 'Email required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                type="email"
                placeholder="you@example.com"
                className="w-full glass-card px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                style={{ borderRadius: '0.75rem' }}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full glass-card px-4 py-3 pr-11 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  style={{ borderRadius: '0.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-60"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('auth.processing')}</>
                : <>{isLogin ? t('auth.signIn') : t('auth.createAccount')} <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-white/30 text-sm mt-6">
            {isLogin ? `${t('auth.noAccount')} ` : `${t('auth.haveAccount')} `}
            <button
              onClick={() => setIsLogin(l => !l)}
              className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
            >
              {isLogin ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
