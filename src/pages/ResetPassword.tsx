import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { Lock, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ValidationErrors {
  length?: string;
  uppercase?: string;
  number?: string;
  special?: string;
  match?: string;
}

export function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid recovery token
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (!accessToken || type !== 'recovery') {
      setError('Ongeldige of verlopen reset link. Vraag een nieuwe aan.');
    }
  }, []);

  const validatePassword = (password: string): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (password.length < 8) {
      errors.length = 'Minimaal 8 karakters';
    }

    if (!/[A-Z]/.test(password)) {
      errors.uppercase = 'Minimaal 1 hoofdletter';
    }

    if (!/[0-9]/.test(password)) {
      errors.number = 'Minimaal 1 cijfer';
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.special = 'Minimaal 1 speciaal teken (!@#$%^&*...)';
    }

    return errors;
  };

  useEffect(() => {
    if (touched.password && newPassword) {
      const errors = validatePassword(newPassword);
      setValidationErrors(errors);
    }

    if (touched.confirm && confirmPassword && newPassword !== confirmPassword) {
      setValidationErrors((prev) => ({
        ...prev,
        match: 'Wachtwoorden komen niet overeen',
      }));
    } else {
      setValidationErrors((prev) => {
        const { match, ...rest } = prev;
        return rest;
      });
    }
  }, [newPassword, confirmPassword, touched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Final validation
    const errors = validatePassword(newPassword);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Vul alle velden correct in volgens de wachtwoord eisen');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = Object.keys(validatePassword(newPassword)).length === 0;
  const isFormValid = isPasswordValid && newPassword === confirmPassword && newPassword.length > 0;

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
              Wachtwoord gewijzigd
            </h2>

            <p className="text-gray-600 text-center mb-6">
              Je wachtwoord is succesvol gewijzigd. Je wordt nu doorgestuurd naar de inlogpagina...
            </p>
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
            <Lock className="w-5 h-5 text-gray-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Nieuw wachtwoord instellen</h2>
          </div>

          <p className="text-gray-600 mb-6">Kies een sterk wachtwoord voor je account.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nieuw wachtwoord
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                  touched.password && Object.keys(validationErrors).length > 0
                    ? 'border-red-300'
                    : 'border-gray-300'
                }`}
                disabled={loading}
                placeholder="Minimaal 8 karakters"
              />

              {touched.password && newPassword && (
                <div className="mt-2 space-y-1">
                  {['length', 'uppercase', 'number', 'special'].map((key) => {
                    const hasError = validationErrors[key as keyof ValidationErrors];
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 text-xs ${
                          hasError ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {hasError ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        <span>
                          {key === 'length' && 'Minimaal 8 karakters'}
                          {key === 'uppercase' && 'Minimaal 1 hoofdletter'}
                          {key === 'number' && 'Minimaal 1 cijfer'}
                          {key === 'special' && 'Minimaal 1 speciaal teken'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bevestig nieuw wachtwoord
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                  touched.confirm && validationErrors.match ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
                placeholder="Herhaal nieuw wachtwoord"
              />

              {touched.confirm && validationErrors.match && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>{validationErrors.match}</span>
                </div>
              )}

              {touched.confirm &&
                confirmPassword &&
                !validationErrors.match &&
                newPassword === confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Wachtwoorden komen overeen</span>
                  </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900">
                Een sterk wachtwoord bevat een combinatie van hoofdletters, kleine letters, cijfers
                en speciale tekens.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Bezig met opslaan...' : 'Wachtwoord opslaan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
