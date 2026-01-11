import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Laden...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  if (user?.account_type === 'HELPER' && location.pathname !== '/helper-families') {
    const selectedFamily = localStorage.getItem('helper_selected_family');
    if (!selectedFamily) {
      return <Navigate to="/helper-families" />;
    }
  }

  return <>{children}</>;
}
