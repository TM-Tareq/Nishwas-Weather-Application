import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import { loginUser } from '@/features/auth/api/authApi';
import useAuthStore from '@/features/auth/store/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');

    try {
      const result = await loginUser(data);

      // Save to Zustand store (and localStorage)
      login(result.token, {
        userId: result.userId,
        email: result.email,
        name: result.name,
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid email or password';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand-400 to-brand-700 rounded-3xl mb-5 shadow-xl shadow-brand-200">
            <span className="text-4xl">🌿</span>
          </div>
          <h1 className="text-3xl font-extrabold text-brand-800 tracking-tight">Welcome back</h1>
          <p className="text-gray-500 mt-1 text-sm">Login to your <span className="font-semibold text-brand-600">Nishwas</span> account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-brand-100 border border-brand-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-gray-50 transition"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email format',
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-gray-50 transition"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'At least 6 characters' },
                })}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{serverError}</p>
              </div>
            )}

            <Button type="submit" isLoading={isLoading} fullWidth>
              Login
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-600 hover:text-brand-700 font-semibold">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">Breathe better. Live smarter. 🌱</p>
      </div>
    </div>
  );
};

export default LoginPage;