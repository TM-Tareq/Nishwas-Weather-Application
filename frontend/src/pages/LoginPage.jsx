import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { loginUser } from '@/features/auth/api/authApi';
import useAuthStore from '@/features/auth/store/authStore';

const AQI_CITIES = [
  { city: 'Dhaka',      aqi: 4, label: 'Poor',     bar: 'w-3/4  bg-red-400'    },
  { city: 'Chittagong', aqi: 3, label: 'Moderate',  bar: 'w-1/2  bg-orange-400' },
  { city: 'Sylhet',     aqi: 2, label: 'Fair',      bar: 'w-1/3  bg-yellow-300' },
  { city: 'Rajshahi',   aqi: 3, label: 'Moderate',  bar: 'w-1/2  bg-orange-400' },
];

const FEATURES = [
  { emoji: '⛅', text: 'Real-time weather & AQI for any city' },
  { emoji: '🛡️', text: 'Personalized outdoor safety advice' },
  { emoji: '📊', text: '5-day forecast charts & trends' },
  { emoji: '🏆', text: 'Daily streaks, badges & leaderboard' },
];

const BrandPanel = () => (
  <div className="hidden lg:flex flex-col w-[420px] xl:w-[480px] flex-shrink-0 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 relative overflow-hidden">
    {/* Decorative circles */}
    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full" />
    <div className="absolute top-1/3 -left-16 w-48 h-48 bg-white/5 rounded-full" />
    <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-white/5 rounded-full" />

    <div className="relative flex flex-col h-full px-10 py-12">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center">
          <span className="text-xl">🌿</span>
        </div>
        <div>
          <span className="text-white font-extrabold text-lg tracking-tight">Nishwas</span>
          <span className="block text-brand-300 text-[9px] font-semibold uppercase tracking-widest">নিশ্বাস</span>
        </div>
      </div>

      {/* Headline */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
          Bangladesh's air &<br />weather companion.
        </h2>
        <p className="text-brand-300 text-sm leading-relaxed">
          Know your air. Protect your health.<br />Breathe better every single day.
        </p>
      </div>

      {/* Features */}
      <div className="space-y-3 mb-10">
        {FEATURES.map(({ emoji, text }) => (
          <div key={text} className="flex items-center gap-3">
            <span className="text-lg w-7 text-center flex-shrink-0">{emoji}</span>
            <span className="text-brand-200 text-sm">{text}</span>
          </div>
        ))}
      </div>

      {/* Live AQI preview */}
      <div className="mt-auto bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-brand-200 text-xs font-semibold uppercase tracking-wider">Live AQI — Bangladesh</span>
        </div>
        <div className="space-y-2">
          {AQI_CITIES.map(({ city, label, bar }) => (
            <div key={city} className="flex items-center gap-3">
              <span className="text-white/70 text-xs w-20 flex-shrink-0">{city}</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${bar}`} />
              </div>
              <span className="text-white/50 text-[10px] w-14 text-right flex-shrink-0">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    try {
      const result = await loginUser(data);
      login(result.token, { userId: result.userId, email: result.email, name: result.name });
      navigate('/dashboard');
    } catch (error) {
      setServerError(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <BrandPanel />

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-700 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-lg">🌿</span>
            </div>
            <span className="text-xl font-extrabold text-brand-700">Nishwas</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-gray-50 text-sm transition"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                  })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-gray-50 text-sm transition"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'At least 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm">{serverError}</p>
                </div>
              )}

              <Button type="submit" isLoading={isLoading} fullWidth>
                <span className="flex items-center justify-center gap-2">
                  Sign in <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">or</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/signup" className="text-brand-600 hover:text-brand-700 font-semibold">
                Create one free
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Breathe better. Live smarter. 🌱
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
