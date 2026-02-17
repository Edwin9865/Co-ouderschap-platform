import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo className="w-40 h-40" />
            </div>
            <div className="flex flex-col items-center">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">CoParenting</h1>
              <p className="text-sm text-gray-600 font-medium mt-1">-samen opvoeden-</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
              E-mail verzonden
            </h2>

            <p className="text-gray-600 text-center mb-6">
              Als er een account bestaat met het e-mailadres <strong>{email}</strong>, dan hebben we
              een link gestuurd om je wachtwoord opnieuw in te stellen.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>Let op:</strong> De link is 60 minuten geldig. Controleer ook je spam folder
                als je de e-mail niet ziet.
              </p>
            </div>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar inloggen
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
            <Logo className="w-40 h-40" />
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">CoParenting</h1>
            <p className="text-sm text-gray-600 font-medium mt-1">-samen opvoeden-</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-gray-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Wachtwoord vergeten</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Voer je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="jouw@email.nl"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Bezig met verzenden...' : 'Verstuur reset link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-slate-800 font-medium hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar inloggen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
