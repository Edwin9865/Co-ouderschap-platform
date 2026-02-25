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

  const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
    body: { priceId, familyId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

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

  const { data, error } = await supabase.functions.invoke('create-stripe-portal', {
    body: { familyId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.url) {
    throw new Error('No portal URL returned');
  }

  return data.url;
}

export function getPlanDetails(planId: 'FREE' | 'PLUS' | 'PRO'): PlanDetails {
  return PLANS.find(p => p.id === planId) || PLANS[0];
}
