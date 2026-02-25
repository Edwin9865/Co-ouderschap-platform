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

  // Refresh session to get a valid token
  const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

  if (sessionError || !session?.access_token) {
    console.error('[STRIPE] Failed to refresh session:', sessionError);
    throw new Error('Sessie verlopen. Log opnieuw in.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  console.log('[STRIPE] Using access token:', session.access_token.substring(0, 20) + '...');

  const response = await fetch(`${supabaseUrl}/functions/v1/create-stripe-checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ priceId, familyId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[STRIPE] Edge function error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });

    let errorMessage = 'Failed to create checkout session';
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  if (!data?.url) {
    console.error('[STRIPE] No URL returned:', data);
    throw new Error('No checkout URL returned');
  }

  console.log('[STRIPE] Checkout session created successfully');
  return data.url;
}

export async function createPortalSession(familyId: string): Promise<string> {
  const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Sessie verlopen. Log opnieuw in.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/create-stripe-portal`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ familyId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[STRIPE] Portal error:', errorText);

    let errorMessage = 'Failed to create portal session';
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  if (!data?.url) {
    throw new Error('No portal URL returned');
  }

  return data.url;
}

export async function syncSubscription(familyId: string): Promise<void> {
  console.log('[STRIPE] Syncing subscription from Stripe...');

  const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Sessie verlopen. Log opnieuw in.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/sync-stripe-subscription`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ familyId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[STRIPE] Sync error:', errorText);

    let errorMessage = 'Failed to sync subscription';
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log('[STRIPE] Subscription synced:', data);
}

export async function completeCheckout(sessionId: string): Promise<{ plan: string; status: string }> {
  console.log('[STRIPE] Completing checkout with session:', sessionId);

  const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Sessie verlopen. Log opnieuw in.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/complete-checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[STRIPE] Complete checkout error:', errorText);

    let errorMessage = 'Failed to complete checkout';
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  if (!data?.success) {
    throw new Error('Checkout completion failed');
  }

  console.log('[STRIPE] Checkout completed:', data);
  return { plan: data.plan, status: data.status };
}

export function getPlanDetails(planId: 'FREE' | 'PLUS' | 'PRO'): PlanDetails {
  return PLANS.find(p => p.id === planId) || PLANS[0];
}
