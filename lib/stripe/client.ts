import { loadStripe, type Stripe } from '@stripe/stripe-js';

let clientPromise: Promise<Stripe | null> | undefined;

export function getStripe(): Promise<Stripe | null> {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey)
    throw new Error('Stripe publishable key is not configured.');
  clientPromise ??= loadStripe(publishableKey);
  return clientPromise;
}
