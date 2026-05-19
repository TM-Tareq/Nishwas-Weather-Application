import { Navigate } from 'react-router-dom';
import useAuthStore from '@/features/auth/store/authStore';

// Wraps protected pages — redirects to /login if user not authenticated
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;