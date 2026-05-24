import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, Leaf } from 'lucide-react';
import useAuthStore from '@/features/auth/store/authStore';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-page">

      {/* atmospheric blobs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)' }} />

      <div className="relative text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/40"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-emerald-400 tracking-tight">Nishwas</span>
        </div>

        {/* 404 number */}
        <div className="mb-6">
          <span className="text-[120px] font-black leading-none select-none"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(16,185,129,0.8))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            404
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-100 mb-3">Page not found</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          The air here is clean — but the page isn't. It may have moved, been removed, or the URL might be wrong.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 glass text-white/50 hover:text-white/80 hover:border-white/20 text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>

          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-900/40 transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
          >
            <LayoutDashboard className="w-4 h-4" />
            {isAuthenticated ? 'Go to Dashboard' : 'Go Home'}
          </button>
        </div>
      </div>

      <p className="absolute bottom-6 text-xs text-slate-700">
        Nishwas — নিশ্বাস · Breathe better. Live smarter.
      </p>
    </div>
  );
};

export default NotFoundPage;
