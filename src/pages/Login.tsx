import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Inloggen mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo className="w-20 h-20" />
          </div>
          <div className="flex flex-col items-center">
            <p>BUILDTEST 2026-02-18 20:28</p>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">CoParenting</h1>
            <p className="text-sm text-gray-600 font-medium mt-1">-samen opvoeden-</p>
          </div>
          <p className="text-gray-600 mt-3">Objectief dossier en communicatieplatform</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Inloggen</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mailadres
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Wachtwoord
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-slate-600 hover:text-slate-800 hover:underline"
                >
                  Wachtwoord vergeten?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Bezig met inloggen...' : 'Inloggen'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Nog geen account?{' '}
            <Link to="/register" className="text-slate-800 font-medium hover:underline">
              Registreren
            </Link>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900">
            <strong>Let op:</strong> Alle communicatie en gegevens worden permanent opgeslagen en
            zijn exporteerbaar voor dossierbeheer.
          </p>
        </div>

        <div className="mt-6 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <Link to="/algemene-voorwaarden" className="hover:text-gray-900">
              Algemene Voorwaarden
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/privacybeleid" className="hover:text-gray-900">
              Privacybeleid
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/contact" className="hover:text-gray-900">
              Contact & Support
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            © 2026 CoParenting. Alle rechten voorbehouden.
          </p>
        </div>
      </div>
    </div>
  );
}
