import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      throw new Error('Stripe publishable key not configured');
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
    features: [
      'Basis agenda',
      'Beperkt logboek (50 entries)',
      'Maximaal 2 kinderen',
      'Basis communicatie',
    ],
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

export async function createCheckoutSession(priceId: string, familyId: string): Promise<string> {
  console.log('[STRIPE] Starting checkout session creation...');

  // Get current session to ensure we have a valid token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('[STRIPE] No active session:', sessionError);
    throw new Error('Please log in to continue');
  }

  console.log('[STRIPE] Session found, invoking edge function...');

  const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
    body: { priceId, familyId },
  });

  if (error) {
    console.error('[STRIPE] Edge function error:', error);
    throw new Error(error.message || 'Failed to create checkout session');
  }

  if (!data?.url) {
    console.error('[STRIPE] No URL returned:', data);
    throw new Error('No checkout URL returned');
  }

  console.log('[STRIPE] Checkout session created successfully');
  return data.url;
}

export async function createPortalSession(familyId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('create-stripe-portal', {
    body: { familyId },
  });

  if (error) {
    console.error('[STRIPE] Portal error:', error);
    throw new Error(error.message || 'Failed to create portal session');
  }

  if (!data?.url) {
    throw new Error('No portal URL returned');
  }

  return data.url;
}

export async function syncSubscription(familyId: string): Promise<void> {
  console.log('[STRIPE] Syncing subscription from Stripe...');

  const { data, error } = await supabase.functions.invoke('sync-stripe-subscription', {
    body: { familyId },
  });

  if (error) {
    console.error('[STRIPE] Sync error:', error);
    throw new Error(error.message || 'Failed to sync subscription');
  }

  console.log('[STRIPE] Subscription synced:', data);
}

export async function completeCheckout(sessionId: string): Promise<{ plan: string; status: string }> {
  console.log('[STRIPE] Completing checkout with session:', sessionId);

  const { data, error } = await supabase.functions.invoke('complete-checkout', {
    body: { sessionId },
  });

  if (error) {
    console.error('[STRIPE] Complete checkout error:', error);
    throw new Error(error.message || 'Failed to complete checkout');
  }

  if (!data?.success) {
    throw new Error('Checkout completion failed');
  }

  console.log('[STRIPE] Checkout completed:', data);
  return { plan: data.plan, status: data.status };
}

export function getPlanDetails(planId: 'FREE' | 'PLUS' | 'PRO'): PlanDetails {
  return PLANS.find(p => p.id === planId) || PLANS[0];
}
