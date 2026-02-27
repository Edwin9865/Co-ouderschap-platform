import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useFamily } from '../../contexts/FamilyContext';
import { Crown, CheckCircle2, Loader2, ExternalLink, AlertCircle, Users, Link2Off } from 'lucide-react';
import { PLANS, createCheckoutSession, createPortalSession, completeCheckout } from '../../lib/stripeService';

export function Abonnement() {
  const navigate = useNavigate();
  const { subscription, currentFamily, refreshFamily } = useFamily();

  const [loading, setLoading] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const sessionId = searchParams.get('session_id');

  const completedRef = useRef(false);

  const familyStatus = (currentFamily as any)?.status as string | undefined;
  const isMerged = (familyStatus ?? '').toUpperCase() === 'MERGED';
  const hasFamilySelected = !!currentFamily?.id;
  const canManageBilling = hasFamilySelected && isMerged;

  useEffect(() => {
    let alive = true;

    const clearParamsSoon = (ms: number) => {
      setTimeout(() => {
        if (!alive) return;
        setSearchParams({});
      }, ms);
    };

    const run = async () => {
      if (!success && !canceled) return;

      if (canceled) {
        setCompleting(false);
        setError('Betaling geannuleerd. Je kunt het altijd later opnieuw proberen.');
        setLoading(null);

        setTimeout(() => {
          if (!alive) return;
          setSearchParams({});
          setError(null);
        }, 4000);

        return;
      }

      if (success === 'true' && sessionId) {
        if (completedRef.current) return;
        completedRef.current = true;

        setError(null);
        setCompleting(true);

        try {
          await completeCheckout(sessionId);

          if (refreshFamily) {
            await refreshFamily();
          }

          clearParamsSoon(2000);
        } catch (e) {
          console.error('[Abonnement] completeCheckout failed:', e);
          setError(e instanceof Error ? e.message : 'Er is een fout opgetreden bij het afronden van de betaling');
          clearParamsSoon(4500);
        } finally {
          if (alive) {
            setCompleting(false);
            setLoading(null);
          }
        }
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [success, canceled, sessionId, refreshFamily, setSearchParams]);

  const handleUpgrade = async (priceId: string) => {
    setError(null);

    if (!currentFamily?.id) {
      setError('Selecteer of maak eerst een gezin aan voordat je kunt upgraden.');
      return;
    }

    if (!isMerged) {
      setError('Dit gezin is nog niet gekoppeld. Rond eerst het koppelen (MERGED) af voordat je kunt upgraden.');
      return;
    }

    if (!priceId) {
      setError('Ongeldig plan geselecteerd');
      return;
    }

    setLoading(priceId);

    try {
      const checkoutUrl = await createCheckoutSession(priceId, currentFamily.id);
      window.location.href = checkoutUrl;
    } catch (e) {
      console.error('[Abonnement] createCheckoutSession failed:', e);
      setError(e instanceof Error ? e.message : 'Er is een fout opgetreden bij het starten van de betaling');
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setError(null);

    if (!currentFamily?.id) {
      setError('Selecteer of maak eerst een gezin aan voordat je je facturen kunt beheren.');
      return;
    }

    if (!isMerged) {
      setError('Dit gezin is nog niet gekoppeld. Je kunt het abonnement pas beheren als het gezin is gekoppeld (MERGED).');
      return;
    }

    setLoading('portal');

    try {
      const portalUrl = await createPortalSession(currentFamily.id);
      window.location.href = portalUrl;
    } catch (e) {
      console.error('[Abonnement] createPortalSession failed:', e);
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

      {!hasFamilySelected && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Users className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-amber-900 font-semibold">Selecteer eerst een gezin</h3>
            <p className="text-amber-800 text-sm mt-1">
              Abonnementen zijn gekoppeld aan een gezin. Maak een gezin aan of selecteer een bestaand gezin voordat je kunt upgraden.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigate('/families')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-700 text-white hover:bg-amber-800"
              >
                <Users className="w-4 h-4" />
                Naar gezinnen
              </button>
              <Link to="/dashboard" className="px-3 py-2 rounded-lg border border-amber-300 text-amber-900 hover:bg-amber-100">
                Terug naar dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {hasFamilySelected && !isMerged && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Link2Off className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-amber-900 font-semibold">Gezin nog niet gekoppeld</h3>
            <p className="text-amber-800 text-sm mt-1">
              De status van dit gezin is <b>{familyStatus ?? 'ONBEKEND'}</b>. Upgraden en abonnementbeheer kan pas als de status <b>MERGED</b> is.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigate('/families')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-700 text-white hover:bg-amber-800"
              >
                <Users className="w-4 h-4" />
                Naar gezinnen
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-green-900 font-semibold">Bedankt voor je abonnement!</h3>
            <p className="text-green-800 text-sm mt-1">
              Je betaling is succesvol verwerkt.
              {completing ? ' We ronden je abonnement nu af...' : ''}
            </p>
          </div>
          {completing && <Loader2 className="w-5 h-5 text-green-700 animate-spin mt-0.5" />}
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
                  <button
                    disabled
                    className="w-full py-3 rounded-lg font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
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
                      !canManageBilling
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