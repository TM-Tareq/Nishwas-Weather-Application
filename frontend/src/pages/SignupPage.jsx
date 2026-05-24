import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { registerUser } from '@/features/auth/api/authApi';
import useAuthStore from '@/features/auth/store/authStore';

const PERKS = [
  'Free forever — no credit card',
  'Personalized outdoor safety advice',
  'Daily streak rewards & badges',
  'Bangladesh city AQI on the map',
];

const BrandPanel = () => (
  <div className="hidden lg:flex flex-col w-[420px] xl:w-[480px] flex-shrink-0 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 relative overflow-hidden">
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
          Join thousands breathing<br />better in Bangladesh.
        </h2>
        <p className="text-brand-300 text-sm leading-relaxed">
          Set up your health profile once and get<br />
          a daily personalized air quality report.
        </p>
      </div>

      {/* Perks */}
      <div className="space-y-3 mb-10">
        {PERKS.map((perk) => (
          <div key={perk} className="flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-brand-200 text-sm">{perk}</span>
          </div>
        ))}
      </div>

      {/* Quote card */}
      <div className="mt-auto bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10">
        <p className="text-white/80 text-sm leading-relaxed italic mb-3">
          "Bangladesh's air quality is a public health emergency. Real-time data in every citizen's pocket can save lives."
        </p>
        <p className="text-brand-300 text-xs font-semibold">— WHO South-East Asia Region</p>
      </div>
    </div>
  </div>
);

const SignupPage = () => {
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
      const result = await registerUser(data);
      login(result.token, { userId: result.userId, email: result.email, name: result.name });
      navigate('/dashboard');
    } catch (error) {
      setServerError(error.response?.data?.message || 'Signup failed. Try again.');
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
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Create your account</h1>
            <p className="text-gray-500 text-sm">Free forever — no credit card required</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-gray-50 text-sm transition"
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'At least 2 characters' },
                  })}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
              </div>

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
                    placeholder="Min. 6 characters"
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
                  Create account <ArrowRight className="w-4 h-4" />
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
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By creating an account you agree to use this app for health-conscious air quality monitoring. 🌱
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
