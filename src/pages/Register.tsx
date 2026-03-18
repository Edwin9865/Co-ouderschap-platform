import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, Stethoscope, Mail, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/Logo';
import { isAndroid } from '../lib/capacitor';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<'PARENT' | 'HELPER'>('PARENT');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, session, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users automatically
  useEffect(() => {
    if (!authLoading && session && user) {
      console.log('[Register] User already authenticated, redirecting...');

      if (user.account_type === 'HELPER') {
        navigate('/helper-families', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authLoading, session, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const emailRedirectTo = isAndroid() ? 'nl.coouderschap.app://email-confirm' : undefined;
      const { needsConfirmation } = await signUp(email, password, name, accountType, emailRedirectTo);
      if (needsConfirmation) {
        setRegisteredEmail(email);
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registratie mislukt');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Laden...</div>
      </div>
    );
  }

  if (registeredEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-slate-600" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Bevestig je e-mail</h2>
            <p className="text-gray-600 mb-2">
              We hebben een verificatielink gestuurd naar:
            </p>
            <p className="font-medium text-slate-800 mb-6">{registeredEmail}</p>
            <p className="text-sm text-gray-500 mb-6">
              Klik op de link in de e-mail om je account te activeren. Controleer ook je spam-map.
            </p>
            <Link
              to="/login"
              className="block w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium text-center"
            >
              Naar inloggen
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo className="w-20 h-20" />
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">CoParenting</h1>
            <p className="text-sm text-gray-600 font-medium mt-1">-samen opvoeden-</p>
          </div>
          <p className="text-gray-600 mt-3">Objectief dossier en communicatieplatform</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Registreren</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Ik ben een...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('PARENT')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    accountType === 'PARENT'
                      ? 'border-slate-600 bg-slate-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <UserCircle className={`w-8 h-8 mx-auto mb-2 ${
                    accountType === 'PARENT' ? 'text-slate-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-medium text-gray-900">Ouder</div>
                  <div className="text-xs text-gray-500 mt-1">Beheer je gezin</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType('HELPER')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    accountType === 'HELPER'
                      ? 'border-slate-600 bg-slate-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Stethoscope className={`w-8 h-8 mx-auto mb-2 ${
                    accountType === 'HELPER' ? 'text-slate-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-medium text-gray-900">Hulpverlener</div>
                  <div className="text-xs text-gray-500 mt-1">Ondersteun gezinnen</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volledige naam
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                required
              />
            </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wachtwoord
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimaal 6 tekens</p>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-slate-800 cursor-pointer flex-shrink-0"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                Ik ga akkoord met de{' '}
                <Link to="/algemene-voorwaarden" className="text-slate-800 font-medium hover:underline" target="_blank">
                  Algemene Voorwaarden
                </Link>{' '}
                en het{' '}
                <Link to="/privacybeleid" className="text-slate-800 font-medium hover:underline" target="_blank">
                  Privacybeleid
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Bezig met registreren...' : 'Registreren'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Al een account?{' '}
            <Link to="/login" className="text-slate-800 font-medium hover:underline">
              Inloggen
            </Link>
          </div>
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
