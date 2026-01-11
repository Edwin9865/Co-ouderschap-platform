import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function Families() {
  const { familyMemberships, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to dashboard if user has a family
    if (!loading && familyMemberships.length > 0) {
      navigate('/dashboard');
    }
  }, [loading, familyMemberships, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        {loading ? (
          <>
            <Loader2 className="w-12 h-12 text-slate-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Account wordt geladen...</p>
          </>
        ) : (
          <>
            <div className="bg-white p-8 rounded-lg border border-gray-200 max-w-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Geen gezin gevonden</h2>
              <p className="text-gray-600 mb-6">
                Er is een probleem opgetreden bij het aanmaken van je gezin. Neem contact op met support.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Terug naar login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
