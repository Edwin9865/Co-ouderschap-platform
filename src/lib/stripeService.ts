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

  // STEP 1: Get current session first
  console.log('[STRIPE] Step 1: Getting current session');
  const { data: { session: currentSession } } = await supabase.auth.getSession();

  console.log('[STRIPE] Current session state:', {
    hasSession: !!currentSession,
    hasToken: !!currentSession?.access_token,
    tokenPreview: currentSession?.access_token?.substring(0, 20) + '...',
  });

  // STEP 2: Refresh session to ensure we have a valid token
  console.log('[STRIPE] Step 2: Refreshing session');
  const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

  if (sessionError) {
    console.error('[STRIPE] Session refresh ERROR:', {
      message: sessionError.message,
      status: sessionError.status,
      name: sessionError.name,
    });
    throw new Error('Not authenticated - please log in again');
  }

  if (!session) {
    console.error('[STRIPE] No session returned after refresh');
    throw new Error('Not authenticated - please log in again');
  }

  console.log('[STRIPE] Session refreshed successfully');

  // STEP 3: Decode JWT to check expiration (for debugging)
  console.log('[STRIPE] Step 3: Decoding JWT');
  try {
    const tokenParts = session.access_token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = payload.exp - now;

      console.log('[STRIPE] JWT Debug:', {
        tokenLength: session.access_token.length,
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        expiresInSeconds: expiresIn,
        isExpired: expiresIn <= 0,
        userId: payload.sub,
        aud: payload.aud,
        role: payload.role,
      });

      if (expiresIn <= 0) {
        throw new Error('Token is expired - please refresh the page');
      }
    }
  } catch (decodeError) {
    console.error('[STRIPE] Could not decode JWT:', decodeError);
  }

  // STEP 4: Prepare request
  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-checkout`;

  console.log('[STRIPE] Step 4: Calling edge function:', {
    url: functionUrl,
    priceId,
    familyId,
    hasToken: !!session.access_token,
    tokenLength: session.access_token.length,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  });

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ priceId, familyId }),
  });

  console.log('[STRIPE] Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('[STRIPE] Edge function error:', errorData);

    // Log response headers for debugging
    console.error('[STRIPE] Response headers:', {
      contentType: response.headers.get('content-type'),
      cors: response.headers.get('access-control-allow-origin'),
    });

    throw new Error(errorData.message || errorData.error || 'Failed to create checkout session');
  }

  const data = await response.json();

  if (!data?.url) {
    throw new Error('No checkout URL returned');
  }

  console.log('[STRIPE] Checkout session created successfully');
  return data.url;
}

export async function createPortalSession(familyId: string): Promise<string> {
  // Refresh session to ensure we have a valid token
  const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

  if (sessionError || !session) {
    console.error('Session refresh error:', sessionError);
    throw new Error('Not authenticated - please log in again');
  }

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-portal`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ familyId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create portal session');
  }

  const data = await response.json();

  if (!data?.url) {
    throw new Error('No portal URL returned');
  }

  return data.url;
}

export function getPlanDetails(planId: 'FREE' | 'PLUS' | 'PRO'): PlanDetails {
  return PLANS.find(p => p.id === planId) || PLANS[0];
}
