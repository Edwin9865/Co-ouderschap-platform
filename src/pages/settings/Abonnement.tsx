// src/pages/settings/Abonnement.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Crown,
  CheckCircle2,
  Loader2,
  ExternalLink,
  AlertCircle,
  Users,
  Link2Off,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  PLANS,
  createCheckoutSession,
  createPortalSession,
  completeCheckout,
  syncSubscription,
} from '../../lib/stripeService';

type ParentMember = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function Abonnement() {
  const navigate = useNavigate();
  const { subscription, currentFamily, refreshFamily } = useFamily();
  const { user } = useAuth();

  const [loading, setLoading] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [parentMembers, setParentMembers] = useState<ParentMember[]>([]);
  const [linkCheckLoading, setLinkCheckLoading] = useState(false);

  // Separate state to prevent double-execution (replaces useRef)
  const [checkoutDone, setCheckoutDone] = useState(false);
  const portalSyncDone = useRef(false);
  const autoSyncDone = useRef(false);

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const sessionId = searchParams.get('session_id');
  const portal = searchParams.get('portal');

  const hasFamilySelected = !!currentFamily?.id;
  const otherParents = parentMembers.filter((m) => m.user_id !== user?.id);
  const isLinked = hasFamilySelected && otherParents.length > 0;
  const canManageBilling = hasFamilySelected && isLinked;

  const fetchLinkStatus = async () => {
    if (!currentFamily?.id || !user?.id) {
      setParentMembers([]);
      return;
    }

    setLinkCheckLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('id,user_id,role,status,joined_at')
        .eq('family_id', currentFamily.id)
        .eq('role', 'PARENT')
        .eq('status', 'ACTIVE');

      if (error) throw error;
      setParentMembers((data || []) as ParentMember[]);
    } catch (e) {
      console.error('[Abonnement] fetchLinkStatus failed:', e);
      setParentMembers([]);
    } finally {
      setLinkCheckLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFamily?.id, user?.id]);

  // ✅ Fix: refreshFamily removed from deps, checkoutDone prevents re-runs
  useEffect(() => {
    if (!success && !canceled) return;

    if (canceled) {
      setError('Betaling geannuleerd. Je kunt het altijd later opnieuw proberen.');
      const t = setTimeout(() => {
        setSearchParams({});
        setError(null);
      }, 4000);
      return () => clearTimeout(t);
    }

    if (success === 'true' && !checkoutDone) {
      setCheckoutDone(true);
      setError(null);
      setCompleting(true);

      const finish = async () => {
        if (sessionId) {
          // Nieuwe checkout: synchroniseer via complete-checkout
          await completeCheckout(sessionId);
        }
        // Upgrade (geen sessionId) of na completeCheckout: refresh gezinsdata
        if (refreshFamily) await refreshFamily();
        await fetchLinkStatus();
      };

      finish()
        .catch((e) => {
          console.error('[Abonnement] finish failed:', e);
          setError(e instanceof Error ? e.message : 'Er is een fout opgetreden bij het afronden van de betaling');
        })
        .finally(() => {
          setCompleting(false);
          setTimeout(() => setSearchParams({}), 2000);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, canceled, sessionId]); // ✅ geen refreshFamily in deps

  // Auto-sync op paginabezoek: haal verse Stripe-data op als er een actief abonnement is
  useEffect(() => {
    if (!currentFamily?.id || !subscription?.stripe_subscription_id || autoSyncDone.current) return;
    autoSyncDone.current = true;
    syncSubscription(currentFamily.id)
      .then(() => refreshFamily?.())
      .catch(() => {}); // Stille achtergrond-refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFamily?.id, subscription?.stripe_subscription_id]);

  // Portal return op web: sync subscription na terugkeer uit Stripe portal
  useEffect(() => {
    if (portal !== 'true' || !currentFamily?.id || portalSyncDone.current) return;
    portalSyncDone.current = true;

    setCompleting(true);
    syncSubscription(currentFamily.id)
      .then(() => refreshFamily?.())
      .catch((e) => console.error('[Abonnement] portal sync failed:', e))
      .finally(() => {
        setCompleting(false);
        setTimeout(() => setSearchParams({}), 500);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portal, currentFamily?.id]);

  // Deep link handler voor mobiel: checkout én portal terugkeer
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith('com.coparenting.app://')) return;

      await Browser.close().catch(() => {});

      const [path, query] = (url.split('://')[1] ?? '').split('?');
      const params = new URLSearchParams(query ?? '');

      // Portal return
      if (path === 'portal' && currentFamily?.id) {
        setCompleting(true);
        syncSubscription(currentFamily.id)
          .then(() => refreshFamily?.())
          .catch((e) => console.error('[Abonnement] portal sync failed:', e))
          .finally(() => setCompleting(false));
        return;
      }

      // Checkout return
      if (path === 'checkout') {
        const successParam = params.get('success');
        const canceledParam = params.get('canceled');
        const sessionIdParam = params.get('session_id');

        if (canceledParam) {
          setError('Betaling geannuleerd. Je kunt het altijd later opnieuw proberen.');
          setTimeout(() => setError(null), 4000);
          return;
        }

        if (successParam === 'true') {
          setSearchParams(sessionIdParam ? { success: 'true', session_id: sessionIdParam } : { success: 'true' });
        }
      }
    });

    return () => { listener.then((h) => h.remove()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFamily?.id]);

  const handleUpgrade = async (priceId: string) => {
    setError(null);

    if (!currentFamily?.id) {
      setError('Selecteer of maak eerst een gezin aan voordat je kunt upgraden.');
      return;
    }

    if (!isLinked) {
      setError('Dit gezin is nog niet gekoppeld. Koppel eerst met je co-ouder voordat je kunt upgraden.');
      return;
    }

    if (!priceId) {
      setError('Ongeldig plan geselecteerd');
      return;
    }

    setLoading(priceId);

    try {
      const isNative = Capacitor.isNativePlatform();
      const { url, updated } = await createCheckoutSession(priceId, currentFamily.id, isNative ? 'mobile' : 'web');

      if (updated) {
        // Directe upgrade/downgrade: trigger success-flow via search params
        setSearchParams({ success: 'true' });
        return;
      }

      if (isNative) {
        // Mobiel: open Stripe in in-app browser (SFSafariViewController / Chrome Custom Tabs)
        await Browser.open({ url });
      } else {
        window.location.href = url;
      }
    } catch (e) {
      console.error('[Abonnement] createCheckoutSession failed:', e);
      setError(e instanceof Error ? e.message : 'Er is een fout opgetreden bij het starten van de betaling');
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setError(null);

    if (!currentFamily?.id) {
      setError('Selecteer of maak eerst een gezin aan voordat je je facturen kunt beheren.');
      return;
    }

    if (!isLinked) {
      setError('Dit gezin is nog niet gekoppeld. Je kunt het abonnement pas beheren als het gezin is gekoppeld.');
      return;
    }

    setLoading('portal');

    try {
      const isNative = Capacitor.isNativePlatform();
      const portalUrl = await createPortalSession(currentFamily.id, isNative ? 'mobile' : 'web');

      if (isNative) {
        await Browser.open({ url: portalUrl });
      } else {
        window.location.href = portalUrl;
      }
    } catch (e) {
      console.error('[Abonnement] createPortalSession failed:', e);
      setError(e instanceof Error ? e.message : 'Er is een fout opgetreden bij het openen van het klantenportaal');
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = subscription?.plan || 'FREE';
  const hasPaidSubscription = !!subscription?.stripe_subscription_id;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Abonnement</h1>
        <p className="text-gray-600">Kies het plan dat bij jullie past</p>
      </div>

      {!hasFamilySelected && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Users className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-amber-900 font-semibold">Selecteer eerst een gezin</h3>
            <p className="text-amber-800 text-sm mt-1">
              Abonnementen zijn gekoppeld aan een gezin. Maak een gezin aan of selecteer een bestaand gezin voordat je
              kunt upgraden.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigate('/families')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-700 text-white hover:bg-amber-800"
              >
                <Users className="w-4 h-4" />
                Naar gezinnen
              </button>
              <Link
                to="/dashboard"
                className="px-3 py-2 rounded-lg border border-amber-300 text-amber-900 hover:bg-amber-100"
              >
                Terug naar dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {hasFamilySelected && !isLinked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Link2Off className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-amber-900 font-semibold">Gezin nog niet gekoppeld</h3>
            <p className="text-amber-800 text-sm mt-1">
              Je kunt pas upgraden als er een co-ouder is gekoppeld. Er moeten 2 ouders in{' '}
              <code>family_members</code> staan met status <b>ACTIVE</b>.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigate('/instellingen/koppelen')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-700 text-white hover:bg-amber-800"
              >
                <Users className="w-4 h-4" />
                Naar koppelen
              </button>
              <button
                onClick={fetchLinkStatus}
                disabled={linkCheckLoading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-300 text-amber-900 hover:bg-amber-100 disabled:opacity-50"
              >
                {linkCheckLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Controleren...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Opnieuw controleren
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Spinner banner: alleen tijdens verwerking */}
      {success && completing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Loader2 className="w-5 h-5 text-green-600 animate-spin flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-green-900 font-semibold">Betaling verwerkt!</h3>
            <p className="text-green-800 text-sm mt-1">We ronden je abonnement nu af...</p>
          </div>
        </div>
      )}

      {/* ✅ Bevestiging banner: alleen na succesvolle afronding */}
      {success && !completing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-green-900 font-semibold">Bedankt voor je abonnement!</h3>
            <p className="text-green-800 text-sm mt-1">Je abonnement is succesvol geactiveerd.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-900 font-semibold">Fout</h3>
            <p className="text-red-800 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {hasPaidSubscription && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Beheer je abonnement</h3>
              <p className="text-sm text-slate-700">
                Bekijk je facturen, wijzig je betaalmethode of annuleer via Stripe.
              </p>
            </div>

            <button
              onClick={handleManageBilling}
              disabled={loading === 'portal' || completing || !canManageBilling}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading === 'portal' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Openen...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Klantenportaal
                </>
              )}
            </button>
          </div>

          {/* Abonnementsdatums */}
          {subscription && (
            <div className="border-t border-slate-200 pt-4 space-y-2">
              {subscription.status === 'TRIALING' && subscription.trial_end && !subscription.cancel_at_period_end && (
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>
                    <span className="font-medium">Trial loopt af op:</span>{' '}
                    {formatDate(subscription.trial_end)} — daarna start je betaalde abonnement automatisch.
                  </span>
                </div>
              )}

              {subscription.status !== 'TRIALING' && subscription.current_period_start && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>
                    <span className="font-medium">Huidige periode:</span>{' '}
                    {formatDate(subscription.current_period_start)} t/m{' '}
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>
              )}

              {subscription.cancel_at_period_end && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    <span className="font-medium">Opgezegd</span> —{' '}
                    {subscription.status === 'TRIALING'
                      ? <>je trial loopt af op <span className="font-medium">{formatDate(subscription.trial_end)}</span> en wordt dan niet verlengd.</>
                      : <>je abonnement blijft actief t/m <span className="font-medium">{formatDate(subscription.current_period_end)}</span>.</>
                    }{' '}
                    Daarna ga je automatisch terug naar Gratis.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.id;
          const isLoading = loading === plan.priceId;

          return (
            <div
              key={plan.id}
              className={`relative rounded-lg border-2 transition-all ${
                plan.popular
                  ? 'border-blue-600 shadow-lg'
                  : isActive
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg">
                    Populair
                  </span>
                </div>
              )}

              {isActive && !plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-green-600 text-white text-sm font-semibold rounded-full shadow-lg">
                    Huidig plan
                  </span>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Crown
                      className={`w-6 h-6 ${
                        isActive ? 'text-green-600' : plan.popular ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    />
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  </div>
                  {isActive && <CheckCircle2 className="w-6 h-6 text-green-600" />}
                </div>

                <div className="mb-6">
                  <p className="text-3xl font-bold text-gray-900">
                    {plan.price === 0 ? 'Gratis' : `€${plan.price.toFixed(2)}`}
                    {plan.price > 0 && <span className="text-base font-normal text-gray-600">/maand</span>}
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === 'FREE' ? (
                  <button disabled className="w-full py-3 rounded-lg font-semibold bg-gray-100 text-gray-400 cursor-not-allowed">
                    {isActive ? 'Huidig plan' : 'Gratis plan'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.priceId!)}
                    disabled={
                      isLoading ||
                      loading !== null ||
                      isActive ||
                      completing ||
                      !canManageBilling ||
                      linkCheckLoading
                    }
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Bezig...
                      </>
                    ) : isActive ? (
                      'Huidig plan'
                    ) : currentPlan === 'FREE' ? (
                      'Upgraden'
                    ) : (
                      'Wijzigen'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
