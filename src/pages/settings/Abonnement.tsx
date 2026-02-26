// src/pages/settings/Abonnement.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFamily } from '../../contexts/FamilyContext';
import { Crown, CheckCircle2, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { PLANS, createCheckoutSession, createPortalSession, completeCheckout } from '../../lib/stripeService';

export function Abonnement() {
  const { subscription, currentFamily, refreshFamily } = useFamily();
  const [loading, setLoading] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const sessionId = searchParams.get('session_id');

  // ✅ Guard: completeCheckout mag maar 1x per sessionId
  const processedSessionsRef = useRef<Set<string>>(new Set());

  const hasCheckoutParams = useMemo(() => {
    return (success === 'true' && !!sessionId) || canceled === 'true';
  }, [success, sessionId, canceled]);

  useEffect(() => {
    let alive = true;

    const clearParams = () => {
      // behoud eventueel andere params als je die later gebruikt; nu gooien we alles weg
      setSearchParams({});
    };

    const run = async () => {
      if (!hasCheckoutParams) return;

      // Cancel flow
      if (canceled === 'true') {
        setFinalizing(false);
        setError('Betaling geannuleerd. Je kunt het altijd later opnieuw proberen.');
        // ✅ direct opruimen zodat er geen loop kan ontstaan
        clearParams();
        return;
      }

      // Success flow
      if (success === 'true' && sessionId && currentFamily) {
        // ✅ voorkom herhaald triggeren bij re-renders/refreshFamily
        if (processedSessionsRef.current.has(sessionId)) return;
        processedSessionsRef.current.add(sessionId);

        setFinalizing(true);
        setError(null);

        try {
          await completeCheckout(sessionId);

          // refresh je familie/subscription state
          if (refreshFamily) await refreshFamily();

          if (!alive) return;

          // ✅ opruimen zodat success state niet blijft hangen
          clearParams();
          setFinalizing(false);
        } catch (e) {
          console.error('[Abonnement] completeCheckout failed:', e);

          if (!alive) return;

          setFinalizing(false);
          setError(e instanceof Error ? e.message : 'Er is een fout opgetreden bij het afronden van de betaling');

          // ✅ ook bij fout: opruimen -> anders blijft hij retry-en
          clearParams();
        }
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [hasCheckoutParams, success, canceled, sessionId, currentFamily?.id, refreshFamily, setSearchParams]);

  const handleUpgrade = async (priceId: string) => {
    if (!currentFamily) return setError('Geen gezin geselecteerd');
    if (!priceId) return setError('Ongeldig plan geselecteerd');

    setLoading(priceId);
    setError(null);

    try {
      const checkoutUrl = await createCheckoutSession(priceId, currentFamily.id);
      window.location.href = checkoutUrl;
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Er is een fout opgetreden bij het starten van de betaling');
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!currentFamily) return setError('Geen gezin geselecteerd');

    setLoading('portal');
    setError(null);

    try {
      const portalUrl = await createPortalSession(currentFamily.id);
      window.location.href = portalUrl;
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Er is een fout opgetreden bij het openen van het klantenportaal');
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

      {/* ✅ Finalizing banner (stop met draaien als finalizing=false) */}
      {finalizing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
          <div>
            <h3 className="text-blue-900 font-semibold">We ronden je abonnement nu af…</h3>
            <p className="text-blue-800 text-sm mt-1">Even moment, we verwerken de terugkoppeling van Stripe.</p>
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
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Beheer je abonnement</h3>
              <p className="text-sm text-slate-700 mb-4">
                Bekijk je facturen, wijzig je betaalmethode of annuleer via Stripe.
              </p>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={loading === 'portal'}
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
                    disabled={isLoading || loading !== null || isActive || finalizing}
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