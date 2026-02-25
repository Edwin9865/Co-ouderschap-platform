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
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  console.log('Creating checkout session:', {
    priceId,
    familyId,
    hasToken: !!session.access_token,
    tokenLength: session.access_token.length,
  });

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-checkout`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ priceId, familyId }),
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Edge function error:', errorData);
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  const data = await response.json();

  if (!data?.url) {
    throw new Error('No checkout URL returned');
  }

  return data.url;
}

export async function createPortalSession(familyId: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
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
