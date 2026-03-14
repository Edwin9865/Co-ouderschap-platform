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
  type PlanDetails,
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
  const { subscription, currentFamily, refreshFamily, patchSubscription } = useFamily();
  const { user } = useAuth();

  const [loading, setLoading] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [parentMembers, setParentMembers] = useState<ParentMember[]>([]);
  const [linkCheckLoading, setLinkCheckLoading] = useState(false);
  const [confirmUpgrade, setConfirmUpgrade] = useState<{ priceId: string; plan: PlanDetails } | null>(null);

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

  // Subscription ownership: only the user who started the subscription may manage/change it
  const isSubscriptionOwner =
    !subscription?.subscriber_user_id || subscription.subscriber_user_id === user?.id;
  const subscriberName = isSubscriptionOwner
    ? null
    : (parentMembers.find((m) => m.user_id === subscription?.subscriber_user_id) ? 'je co-ouder' : 'je co-ouder');

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
        } else if (currentFamily?.id) {
          // Directe upgrade/downgrade: Stripe is al bijgewerkt, sync naar Supabase
          const synced = await syncSubscription(currentFamily.id);
          if (synced) patchSubscription(synced);
        }
        // Refresh gezinsdata (inclusief subscription)
        if (refreshFamily) await refreshFamily();
        await fetchLinkStatus();

        // Notify co-parent about subscription activation
        const { data: { session } } = await supabase.auth.getSession();
        if (session && currentFamily?.id) {
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-fcm-notification`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              familyId: currentFamily.id,
              title: 'Abonnement geactiveerd',
              body: 'Het abonnement is succesvol geactiveerd',
              url: '/instellingen/abonnement',
              excludeUserId: user?.id,
            }),
          }).catch(console.error);
        }
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
    setAutoSyncing(true);
    syncSubscription(currentFamily.id)
      .then((result) => { if (result) patchSubscription(result); })
      .catch(() => {})
      .finally(() => setAutoSyncing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFamily?.id, subscription?.stripe_subscription_id]);

  // Portal return op web: sync subscription na terugkeer uit Stripe portal
  useEffect(() => {
    if (portal !== 'true' || !currentFamily?.id || portalSyncDone.current) return;
    portalSyncDone.current = true;

    setCompleting(true);
    syncSubscription(currentFamily.id)
      .then((result) => { if (result) patchSubscription(result); })
      .catch((e) => {
        console.error('[Abonnement] portal sync failed:', e);
        setError(e instanceof Error ? e.message : 'Synchronisatie mislukt. Klik op Vernieuwen om het opnieuw te proberen.');
      })
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

  const handleManualSync = async () => {
    if (!currentFamily?.id) return;
    setError(null);
    setLoading('sync');
    try {
      const result = await syncSubscription(currentFamily.id);
      if (result) patchSubscription(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Synchronisatie mislukt');
    } finally {
      setLoading(null);
    }
  };

  const handleUpgradeClick = (priceId: string) => {
    // Als er een actief/trial abonnement is → bevestiging tonen vóór directe upgrade
    const isActiveOrTrialing = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING';
    if (hasPaidSubscription && isActiveOrTrialing) {
      const plan = PLANS.find((p) => p.priceId === priceId);
      if (plan) {
        setConfirmUpgrade({ priceId, plan });
        return;
      }
    }
    handleUpgrade(priceId);
  };

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
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Abonnement</h1>
        <p className="text-slate-700">Kies het plan dat bij jullie past</p>
      </div>

      {!hasFamilySelected && (
        <div className="overflow-hidden rounded-2xl shadow-sm border-2 border-white/70">
          <div className="p-5 flex items-start gap-3" style={{ background: 'linear-gradient(135deg, rgba(253,230,138,0.50) 0%, rgba(252,211,77,0.25) 60%, rgba(255,255,255,0.05) 100%)' }}>
            <Users className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-amber-900 font-semibold">Selecteer eerst een gezin</h3>
              <p className="text-amber-800 text-sm mt-1">
                Abonnementen zijn gekoppeld aan een gezin. Maak een gezin aan of selecteer een bestaand gezin voordat je
                kunt upgraden.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/families')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-700 text-white hover:bg-amber-800"
                >
                  <Users className="w-4 h-4" />
                  Naar gezinnen
                </button>
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-xl border border-amber-300 text-amber-900 hover:bg-amber-100/50"
                >
                  Terug naar dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasFamilySelected && !isLinked && (
        <div className="overflow-hidden rounded-2xl shadow-sm border-2 border-white/70">
          <div className="p-5 flex items-start gap-3" style={{ background: 'linear-gradient(135deg, rgba(253,230,138,0.50) 0%, rgba(252,211,77,0.25) 60%, rgba(255,255,255,0.05) 100%)' }}>
            <Link2Off className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-amber-900 font-semibold">Gezin nog niet gekoppeld</h3>
              <p className="text-amber-800 text-sm mt-1">
                Je kunt pas upgraden als er een co-ouder is gekoppeld. Er moeten 2 ouders in{' '}
                <code>family_members</code> staan met status <b>ACTIVE</b>.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/instellingen/koppelen')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-700 text-white hover:bg-amber-800"
                >
                  <Users className="w-4 h-4" />
                  Naar koppelen
                </button>
                <button
                  onClick={fetchLinkStatus}
                  disabled={linkCheckLoading}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-300 text-amber-900 hover:bg-amber-100/50 disabled:opacity-50"
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
        </div>
      )}

      {/* ✅ Spinner banner: alleen tijdens verwerking */}
      {success && completing && (
        <div className="overflow-hidden rounded-2xl shadow-sm border-2 border-white/70">
          <div className="p-5 flex items-start gap-3" style={{ background: 'linear-gradient(135deg, rgba(187,247,208,0.50) 0%, rgba(134,239,172,0.25) 60%, rgba(255,255,255,0.05) 100%)' }}>
            <Loader2 className="w-5 h-5 text-green-600 animate-spin flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-green-900 font-semibold">Betaling verwerkt!</h3>
              <p className="text-green-800 text-sm mt-1">We ronden je abonnement nu af...</p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Bevestiging banner: alleen na succesvolle afronding */}
      {success && !completing && (
        <div className="overflow-hidden rounded-2xl shadow-sm border-2 border-white/70">
          <div className="p-5 flex items-start gap-3" style={{ background: 'linear-gradient(135deg, rgba(187,247,208,0.50) 0%, rgba(134,239,172,0.25) 60%, rgba(255,255,255,0.05) 100%)' }}>
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-green-900 font-semibold">Bedankt voor je abonnement!</h3>
              <p className="text-green-800 text-sm mt-1">Je abonnement is succesvol geactiveerd.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="overflow-hidden rounded-2xl shadow-sm border-2 border-white/70">
          <div className="p-5 flex items-start gap-3" style={{ background: 'linear-gradient(135deg, rgba(254,202,202,0.50) 0%, rgba(252,165,165,0.25) 60%, rgba(255,255,255,0.05) 100%)' }}>
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-900 font-semibold">Fout</h3>
              <p className="text-red-800 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {hasPaidSubscription && !isSubscriptionOwner && (
        <div className="overflow-hidden rounded-2xl shadow-sm border-2 border-white/70">
          <div className="p-5 flex items-start gap-3" style={{ background: 'linear-gradient(135deg, rgba(219,234,254,0.55) 0%, rgba(191,219,254,0.25) 60%, rgba(255,255,255,0.05) 100%)' }}>
            <Crown className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-blue-900 font-semibold">Abonnement beheerd door {subscriberName}</h3>
              <p className="text-blue-800 text-sm mt-1">
                Het abonnement is afgesloten door {subscriberName}. Alleen {subscriberName} kan het abonnement wijzigen, upgraden of annuleren.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasPaidSubscription && (
        <div className="overflow-hidden rounded-2xl shadow-sm border-2 border-white/70">
        <div className="p-6 space-y-4" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.25) 60%, rgba(255,255,255,0.05) 100%)' }}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Beheer je abonnement</h3>
              <p className="text-sm text-slate-700">
                {isSubscriptionOwner
                  ? 'Bekijk je facturen, wijzig je betaalmethode of annuleer via Stripe.'
                  : `Dit abonnement wordt beheerd door ${subscriberName}.`}
              </p>
            </div>

            {isSubscriptionOwner && (
            <div className="flex items-center gap-2 sm:flex-shrink-0">
              <button
                onClick={handleManageBilling}
                disabled={loading === 'portal' || completing || !canManageBilling}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap font-medium"
              >
                {loading === 'portal' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Openen...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Beheerportaal
                  </>
                )}
              </button>
            </div>
            )}
          </div>

          {/* Abonnementsdatums */}
          {subscription && (
            <div className="border-t border-slate-200 pt-4 space-y-2">
              {autoSyncing && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>Abonnementsstatus ophalen uit Stripe...</span>
                </div>
              )}

              {!autoSyncing && subscription.status === 'CANCELLED' && (
                <div className="flex items-center gap-2 text-sm text-gray-600 rounded-xl px-3 py-2 border border-white/50" style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-gray-500" />
                  <span>
                    <span className="font-medium">Abonnement beëindigd</span> — je gebruikt nu het gratis plan.
                  </span>
                </div>
              )}

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
                <div className="flex items-center gap-2 text-sm text-amber-800 rounded-xl px-3 py-2 border border-amber-300/60" style={{ background: 'rgba(253,230,138,0.40)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
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
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.id;
          const isLoading = loading === plan.priceId;

          const cardBorderClass = plan.popular
            ? 'border-blue-500/80'
            : isActive
            ? 'border-green-500/80'
            : 'border-white/70 hover:border-blue-400/70';

          const cardGradient = plan.popular
            ? 'linear-gradient(135deg, rgba(219,234,254,0.55) 0%, rgba(191,219,254,0.25) 60%, rgba(255,255,255,0.05) 100%)'
            : isActive
            ? 'linear-gradient(135deg, rgba(187,247,208,0.55) 0%, rgba(134,239,172,0.25) 60%, rgba(255,255,255,0.05) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.25) 60%, rgba(255,255,255,0.05) 100%)';

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 shadow-sm transition-all ${cardBorderClass}`}
              style={{ background: cardGradient, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
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

              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Crown
                      className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        isActive ? 'text-green-600' : plan.popular ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    />
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{plan.name}</h3>
                  </div>
                  {isActive && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />}
                </div>

                <div className="mb-5 sm:mb-6">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {plan.price === 0 ? 'Gratis' : `€${plan.price.toFixed(2)}`}
                    {plan.price > 0 && <span className="text-sm sm:text-base font-normal text-gray-600">/maand</span>}
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
                  <button disabled className="w-full py-3 rounded-xl font-semibold bg-white/30 text-gray-500 cursor-not-allowed">
                    {isActive ? 'Huidig plan' : 'Gratis plan'}
                  </button>
                ) : !isSubscriptionOwner && hasPaidSubscription ? (
                  <button disabled className="w-full py-3 rounded-xl font-semibold bg-white/30 text-gray-500 cursor-not-allowed">
                    Beheerd door {subscriberName}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgradeClick(plan.priceId!)}
                    disabled={
                      isLoading ||
                      loading !== null ||
                      isActive ||
                      completing ||
                      !canManageBilling ||
                      linkCheckLoading
                    }
                    className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                      isActive
                        ? 'bg-white/30 text-gray-500 cursor-not-allowed'
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

      {/* Bevestigingsdialoog bij upgrade/downgrade van bestaand abonnement */}
      {confirmUpgrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="overflow-hidden rounded-2xl border-2 border-white/70 p-6 max-w-md w-full shadow-xl space-y-4"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0.10) 100%)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Wijzigen naar {confirmUpgrade.plan.name}?
            </h3>
            <p className="text-sm text-gray-600">
              Je wisselt naar het <strong>{confirmUpgrade.plan.name}</strong> plan voor{' '}
              <strong>€{confirmUpgrade.plan.price.toFixed(2)}/maand</strong>.{' '}
              {subscription?.status === 'TRIALING'
                ? 'Je trial gaat direct over naar het nieuwe plan. Je wordt pas na je trial gefactureerd.'
                : 'Je betaalt alleen het prijsverschil voor de resterende dagen van deze maand.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmUpgrade(null)}
                disabled={loading !== null}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={() => {
                  const { priceId } = confirmUpgrade;
                  setConfirmUpgrade(null);
                  handleUpgrade(priceId);
                }}
                disabled={loading !== null}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Bevestigen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
