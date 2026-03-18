import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
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
      const redirectTo = Capacitor.isNativePlatform()
        ? 'nl.coouderschap.app://reset-password'
        : `${window.location.origin}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
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
              Check je email
            </h2>

            <p className="text-gray-600 text-center mb-6">
              We hebben een email verstuurd naar <strong>{email}</strong> met instructies om je
              wachtwoord opnieuw in te stellen.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>Geen email ontvangen?</strong>
                <br />
                Controleer je spam folder. De email komt van onze notificatie service.
              </p>
            </div>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-3 text-slate-600 hover:text-slate-800 font-medium"
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
            Voer je emailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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
                required
                disabled={loading}
                placeholder="jouw@email.nl"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Bezig met versturen...' : 'Verstuur reset link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 hover:underline"
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
