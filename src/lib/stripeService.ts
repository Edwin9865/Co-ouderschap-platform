//src/lib/stripeService.ts
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      throw new Error('Stripe publishable key not configured (VITE_STRIPE_PUBLISHABLE_KEY)');
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export interface PlanDetails {
  id: 'FREE' | 'PLUS' | 'PRO';
  name: string;
  price: number;
  priceId: string | null;
  features: string[];
  popular?: boolean;
}

export const PLANS: PlanDetails[] = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    priceId: null,
    features: ['Basis agenda', 'Beperkt logboek (50 entries)', 'Maximaal 2 kinderen', 'Basis communicatie'],
  },
  {
    id: 'PLUS',
    name: 'Plus',
    price: 9.95,
    priceId: import.meta.env.VITE_STRIPE_PRICE_PLUS || '',
    features: [
      'Volledige agenda met herinneringen',
      'Onbeperkt logboek',
      'Onbeperkt aantal kinderen',
      'Uitgebreide communicatie',
      'Export functionaliteit',
      'Basis ondersteuning',
    ],
    popular: true,
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 14.95,
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO || '',
    features: [
      'Alles van Plus',
      'Prioriteit ondersteuning',
      'Hulpverlener toegang',
      'Uitgebreide rapportages',
      'Geavanceerde export opties',
      'API toegang (binnenkort)',
    ],
  },
];

// Always attach a fresh JWT to Edge Function calls.
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: s, error: se } = await supabase.auth.getSession();

  const token = s.session?.access_token;
  if (se || !token) {
    const { data: r, error: re } = await supabase.auth.refreshSession();
    const refreshedToken = r.session?.access_token;

    if (re || !refreshedToken) {
      throw new Error('Not authenticated - please log in again');
    }

    return { Authorization: `Bearer ${refreshedToken}` };
  }

  return { Authorization: `Bearer ${token}` };
}

function getInvokeErrorMessage(error: unknown): string {
  const anyErr: any = error as any;
  const body = anyErr?.context?.response?.body;

  return (
    body?.message ||
    body?.error ||
    anyErr?.message ||
    'Er is een fout opgetreden'
  );
}

export interface CheckoutResult {
  url: string;
  /** true als het een directe upgrade/downgrade was (geen Stripe Checkout nodig) */
  updated: boolean;
}

export async function createCheckoutSession(
  priceId: string,
  familyId: string,
  platform?: 'web' | 'mobile'
): Promise<CheckoutResult> {
  if (!priceId) throw new Error('Missing priceId');
  if (!familyId) throw new Error('Missing familyId');

  const headers = await getAuthHeaders();

  const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
    body: { priceId, familyId, platform: platform ?? 'web' },
    headers,
  });

  if (error) {
    console.error('[STRIPE] createCheckoutSession error:', error);
    throw new Error(getInvokeErrorMessage(error));
  }

  if (!data?.url) {
    throw new Error('No checkout URL returned');
  }

  return { url: data.url as string, updated: data.updated === true };
}

export async function createPortalSession(familyId: string): Promise<string> {
  if (!familyId) throw new Error('Missing familyId');

  const headers = await getAuthHeaders();

  const { data, error } = await supabase.functions.invoke('create-stripe-portal', {
    body: { familyId },
    headers,
  });

  if (error) {
    console.error('[STRIPE] createPortalSession error:', error);
    throw new Error(getInvokeErrorMessage(error));
  }

  if (!data?.url) {
    throw new Error('No portal URL returned');
  }

  return data.url as string;
}

export async function syncSubscription(familyId: string): Promise<void> {
  if (!familyId) throw new Error('Missing familyId');

  const headers = await getAuthHeaders();

  const { data, error } = await supabase.functions.invoke('sync-stripe-subscription', {
    body: { familyId },
    headers,
  });

  if (error) {
    console.error('[STRIPE] syncSubscription error:', error);
    throw new Error(getInvokeErrorMessage(error));
  }

  console.log('[STRIPE] syncSubscription ok:', data);
}

export async function completeCheckout(sessionId: string): Promise<{ plan: string; status: string }> {
  if (!sessionId) throw new Error('Missing sessionId');

  const headers = await getAuthHeaders();

  const { data, error } = await supabase.functions.invoke('complete-checkout', {
    body: { sessionId },
    headers,
  });

  if (error) {
    console.error('[STRIPE] completeCheckout error:', error);
    throw new Error(getInvokeErrorMessage(error));
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Checkout completion failed');
  }

  return { plan: data.plan as string, status: data.status as string };
}

export function getPlanDetails(planId: 'FREE' | 'PLUS' | 'PRO'): PlanDetails {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
}