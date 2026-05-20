import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, LogOut, Leaf, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '@/features/auth/store/authStore';
import useProfileStore from '@/features/profile/store/profileStore';

const NAV_LINKS = [
  { labelKey: 'nav.dashboard',   path: '/dashboard',   icon: LayoutDashboard },
  { labelKey: 'nav.map',         path: '/map',         icon: Map },
  { labelKey: 'nav.outdoor',     path: '/outdoor',     icon: Leaf },
  { labelKey: 'nav.leaderboard', path: '/leaderboard', icon: Trophy },
];

const Navbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const photoUrl = useProfileStore((s) => s.photoUrl);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/70 sticky top-0 z-40 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo + Nav Links */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-700 rounded-2xl flex items-center justify-center shadow-md shadow-brand-200">
              <span className="text-xl">🌿</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-extrabold text-brand-700 tracking-tight">Nishwas</span>
              <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest">নিশ্বাস</span>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            {NAV_LINKS.map(({ labelKey, path, icon: Icon }) => {
              const isActive = pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-200'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t(labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            title="Switch language / ভাষা পরিবর্তন"
            className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 transition-all duration-150"
          >
            {i18n.language === 'en' ? 'বাং' : 'EN'}
          </button>

          {/* Username → Profile Settings */}
          <button
            onClick={() => navigate('/profile')}
            title="Profile Settings"
            className="flex items-center gap-2 bg-gray-50 hover:bg-brand-50 border border-gray-200 hover:border-brand-200 rounded-xl px-3 py-1.5 transition-all duration-150"
          >
            {photoUrl ? (
              <img src={photoUrl} alt="avatar" className="w-7 h-7 rounded-lg object-cover shadow-sm" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
          </button>

          <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
