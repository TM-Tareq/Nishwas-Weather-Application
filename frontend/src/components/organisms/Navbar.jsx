import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, Users,
  TrendingUp, Menu, X,
  Download, Activity, Compass, Sun, Moon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '@/features/auth/store/authStore';
import useProfileStore from '@/features/profile/store/profileStore';
import usePWAInstall from '@/hooks/usePWAInstall';
import useThemeStore from '@/store/themeStore';

const NAV = [
  { labelKey: 'nav.dashboard',  path: '/dashboard',   icon: LayoutDashboard },
  { labelKey: 'nav.map',        path: '/spatial-hub',  icon: Compass         },
  { labelKey: 'nav.outdoor',    path: '/biometrics',   icon: Activity        },
  { labelKey: 'nav.community',  path: '/nexus',        icon: Users           },
  { labelKey: 'nav.insights',   path: '/analytics',    icon: TrendingUp      },
];

const NAV_LABELS = {
  '/dashboard':   'Dashboard',
  '/spatial-hub': 'Spatial Hub',
  '/biometrics':  'Biometrics',
  '/nexus':       'Nexus',
  '/analytics':   'Analytics',
};

const NavBtn = ({ path, label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        : 'text-white/50 hover:text-white/90 hover:bg-white/5'
    }`}
  >
    <Icon className="w-4 h-4 flex-shrink-0" />
    <span className="hidden lg:inline">{label}</span>
  </button>
);

const Navbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { i18n, t } = useTranslation();
  const user         = useAuthStore((s) => s.user);
  const logout       = useAuthStore((s) => s.logout);
  const photoUrl     = useProfileStore((s) => s.photoUrl);
  const { canInstall, install } = usePWAInstall();
  const { theme, toggleTheme } = useThemeStore();

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = () => { logout(); navigate('/auth'); };
  const toggleLang   = () => i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en');

  return (
    <>
      <nav className="glass border-b border-white/8 sticky top-0 z-40">
        <div className="max-w-1440 mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-3">

          {/* Logo */}
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-lg">🌿</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-extrabold text-white tracking-tight">Nishwas</span>
              <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-widest hidden sm:block">নিশ্বাস</span>
            </div>
          </button>

          {/* Primary nav — desktop */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {NAV.map(({ labelKey, path, icon }) => (
              <NavBtn
                key={path}
                path={path}
                label={t(labelKey)}
                icon={icon}
                isActive={pathname === path || pathname.startsWith(path + '?')}
                onClick={() => navigate(path)}
              />
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {canInstall && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold glass-accent text-emerald-400 hover:bg-emerald-500/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl border border-white/10 text-white/50 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
            >
              {i18n.language === 'en' ? 'বাং' : 'EN'}
            </button>

            <button
              onClick={() => navigate('/biometrics')}
              className="flex items-center gap-2 glass-card hover:border-emerald-500/30 px-2.5 py-1.5 transition-all"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="avatar" className="w-6 h-6 rounded-lg object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <span className="text-sm font-medium text-white/70 hidden xl:block">{user?.name}</span>
            </button>

            <button
              onClick={handleLogout}
              title="Logout"
              className="hidden md:flex items-center p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 text-white/50 hover:bg-white/5 transition-colors"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-down */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 glass border-b border-white/8 shadow-2xl z-30 py-3 px-4">
          <div className="flex flex-col gap-0.5 max-w-sm mx-auto">
            {NAV.map(({ labelKey, path, icon: Icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname === path
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {t(labelKey)}
              </button>
            ))}
            <div className="border-t border-white/8 mt-2 pt-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 w-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const BOTTOM_TABS = [
  { path: '/dashboard',   icon: LayoutDashboard, label: 'Home'      },
  { path: '/spatial-hub', icon: Compass,          label: 'Hub'       },
  { path: '/biometrics',  icon: Activity,         label: 'Health'    },
  { path: '/analytics',   icon: TrendingUp,       label: 'Analytics' },
  { path: '/nexus',       icon: Users,            label: 'Nexus'     },
];

export const BottomNav = () => {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-white/8"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around">
        {BOTTOM_TABS.map(({ path, icon: Icon, label }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 transition-all"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-full" />
              )}
              <Icon className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-white/30'}`} />
              <span className={`text-[10px] font-semibold ${active ? 'text-emerald-400' : 'text-white/30'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
