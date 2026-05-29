import { Navigate } from 'react-router-dom';
import useAuthStore from '@/features/auth/store/authStore';

/**
 * Protects admin-only pages.
 * Redirects to /auth if not logged in, to /dashboard if logged in but not ADMIN.
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return children;
};

export default AdminRoute;
