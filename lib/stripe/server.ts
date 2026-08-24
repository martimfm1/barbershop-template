import Stripe from 'stripe';
import { STRIPE_API_VERSION } from './constants';
import { BillingError } from '@/types/stripe';

let stripeClient: Stripe | undefined;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new BillingError(
      'Stripe is not configured.',
      'BILLING_NOT_CONFIGURED',
    );
  }

  try {
    stripeClient ??= new Stripe(secretKey, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
      appInfo: { name: 'Silentra', version: '1.0.0' },
    });
  } catch (error) {
    console.error('[STRIPE_CLIENT_INIT_ERROR]', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
    });
    throw new BillingError(
      'Stripe could not be initialized.',
      'BILLING_NOT_CONFIGURED',
    );
  }

  return stripeClient;
}
