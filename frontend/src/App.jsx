import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage    from '@/pages/LandingPage';
import AuthPage       from '@/pages/AuthPage';
import DashboardPage  from '@/pages/DashboardPage';
import SpatialHubPage from '@/pages/SpatialHubPage';
import BiometricsPage from '@/pages/BiometricsPage';
import AnalyticsPage  from '@/pages/AnalyticsPage';
import NexusPage      from '@/pages/NexusPage';
import NotFoundPage   from '@/pages/NotFoundPage';
import ProtectedRoute from '@/routes/ProtectedRoute';
import AdminRoute     from '@/routes/AdminRoute';
import AdminPage      from '@/pages/AdminPage';
import useThemeStore  from '@/store/themeStore';

const ThemeInit = () => {
  const initTheme = useThemeStore((s) => s.initTheme);
  useEffect(() => { initTheme(); }, [initTheme]);
  return null;
};

const App = () => (
  <BrowserRouter>
    <ThemeInit />
    <Routes>
      {/* Public */}
      <Route path="/"       element={<LandingPage />} />
      <Route path="/auth"   element={<AuthPage />} />

      <Route path="/login"  element={<Navigate to="/auth" replace />} />
      <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

      {/* Pages */}
      <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/spatial-hub" element={<ProtectedRoute><SpatialHubPage /></ProtectedRoute>} />
      <Route path="/biometrics"  element={<ProtectedRoute><BiometricsPage /></ProtectedRoute>} />
      <Route path="/analytics"   element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/nexus"       element={<ProtectedRoute><NexusPage /></ProtectedRoute>} />

      {/* Sub-Pages */}
      <Route path="/map"        element={<Navigate to="/spatial-hub" replace />} />
      <Route path="/route"      element={<Navigate to="/spatial-hub?tab=route" replace />} />
      <Route path="/profile"    element={<Navigate to="/biometrics" replace />} />
      <Route path="/outdoor"    element={<Navigate to="/biometrics?tab=outdoor" replace />} />
      <Route path="/diary"      element={<Navigate to="/biometrics?tab=diary" replace />} />
      <Route path="/insights"   element={<Navigate to="/analytics" replace />} />
      <Route path="/compare"    element={<Navigate to="/analytics?tab=compare" replace />} />
      <Route path="/community"  element={<Navigate to="/nexus" replace />} />
      <Route path="/leaderboard" element={<Navigate to="/nexus?tab=leaderboard" replace />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

export default App;
