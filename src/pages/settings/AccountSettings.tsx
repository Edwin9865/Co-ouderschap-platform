import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SecureStorage } from '../../lib/secureStorage';
import { User, Mail, Lock, Save, AlertCircle, CheckCircle2, Info, Shield, Users } from 'lucide-react';

interface ValidationErrors {
  length?: string;
  uppercase?: string;
  number?: string;
  special?: string;
  match?: string;
}

export function AccountSettings() {
  const { user, refreshUser, rememberMe, setRememberMe: updateRememberMe } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [localRememberMe, setLocalRememberMe] = useState(rememberMe);

  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [originalFamilyName, setOriginalFamilyName] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .limit(1)
      .then(({ data }) => {
        const row = (data as { family_id: string }[] | null)?.[0];
        if (!row) return;
        setFamilyId(row.family_id);
        supabase
          .from('families')
          .select('name')
          .eq('id', row.family_id)
          .limit(1)
          .then(({ data: fData }) => {
            const f = (fData as { name: string }[] | null)?.[0];
            if (f) {
              setFamilyName(f.name ?? '');
              setOriginalFamilyName(f.name ?? '');
            }
          });
      });
  }, [user?.id]);

  const handleUpdateFamilyName = async () => {
    if (!familyId) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { error: updateError } = await db
        .from('families')
        .update({ name: familyName })
        .eq('id', familyId);
      if (updateError) throw updateError;
      setOriginalFamilyName(familyName);
      setSuccess('Gezinsnaam bijgewerkt');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij bijwerken gezinsnaam');
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ name })
        .eq('id', user.id);

      if (updateError) throw updateError;

      if (refreshUser) {
        await refreshUser();
      }

      setSuccess('Profiel bijgewerkt');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij bijwerken profiel');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!user || email === user.email) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: emailError } = await supabase.auth.updateUser({
        email: email,
      });

      if (emailError) throw emailError;

      setSuccess('E-mail bijgewerkt. Controleer je inbox voor bevestiging.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij bijwerken e-mail');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setError('');
    setSuccess('');

    // Check if all fields are filled
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vul alle wachtwoord velden in');
      return;
    }

    // Validate password strength
    const errors = validatePassword(newPassword);
    if (Object.keys(errors).length > 0) {
      setError('Nieuw wachtwoord voldoet niet aan de eisen');
      setTouched({ password: true, confirm: true });
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      return;
    }

    setLoading(true);

    try {
      // First verify current password by trying to sign in with it
      if (!user?.email) {
        throw new Error('Geen e-mailadres gevonden');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Huidig wachtwoord is onjuist');
      }

      // If current password is correct, update to new password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passwordError) throw passwordError;

      // Clear all password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTouched({ password: false, confirm: false });
      setValidationErrors({});

      setSuccess('Wachtwoord succesvol gewijzigd');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij bijwerken wachtwoord');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = newPassword
    ? Object.keys(validatePassword(newPassword)).length === 0
    : false;
  const isPasswordFormValid =
    currentPassword && isPasswordValid && newPassword === confirmPassword;

  const handleToggleRememberMe = async () => {
    try {
      const newValue = !localRememberMe;
      setLocalRememberMe(newValue);
      await updateRememberMe(newValue);
      setSuccess(newValue
        ? 'Automatisch inloggen ingeschakeld (30 dagen)'
        : 'Automatisch inloggen uitgeschakeld'
      );
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Fout bij bijwerken instellingen');
      setLocalRememberMe(!localRememberMe);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account</h1>
        <p className="text-gray-600">Beheer je persoonlijke gegevens</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Profiel informatie
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Naam
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={loading || name === user?.name}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Profiel opslaan
            </button>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            E-mailadres
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleUpdateEmail}
              disabled={loading || email === user?.email}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              E-mail bijwerken
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Let op:</strong> Bij het wijzigen van je e-mailadres ontvang je een
                bevestigingsmail. Je moet deze bevestigen voordat de wijziging actief wordt.
              </p>
            </div>
          </div>
        </div>

        {user && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gezinsnaam
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Gezinsnaam
                </label>
                <input
                  id="familyName"
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  placeholder="Voer een gezinsnaam in"
                />
              </div>
              <button
                onClick={handleUpdateFamilyName}
                disabled={loading || familyName === originalFamilyName || !familyName}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Gezinsnaam opslaan
              </button>
            </div>
          </div>
        )}

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Beveiliging
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Automatisch inloggen
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Blijf ingelogd op dit apparaat. Je hoeft niet opnieuw in te loggen wanneer je de app sluit.
                  De sessie blijft {SecureStorage.getSessionTimeoutDays()} dagen geldig bij inactiviteit.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Info className="w-3 h-3" />
                  <span>
                    Voor maximale beveiliging wordt aanbevolen dit uit te schakelen op gedeelde apparaten
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localRememberMe}
                  onChange={handleToggleRememberMe}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Wachtwoord wijzigen
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Huidig wachtwoord
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                placeholder="Voer je huidige wachtwoord in"
              />
            </div>

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
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                Een sterk wachtwoord bevat minimaal 8 karakters met een combinatie van hoofdletters,
                kleine letters, cijfers en speciale tekens (!@#$%^&*...).
              </p>
            </div>

            <button
              onClick={handleUpdatePassword}
              disabled={loading || !isPasswordFormValid}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Bezig...' : 'Wachtwoord wijzigen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
