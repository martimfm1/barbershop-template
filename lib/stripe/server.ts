import Stripe from "stripe";
import { STRIPE_API_VERSION } from "./constants";
import { BillingError } from "@/types/stripe";

let stripeClient: Stripe | undefined;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new BillingError("Stripe is not configured.", "BILLING_NOT_CONFIGURED");
  }

  stripeClient ??= new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    appInfo: { name: "Silentra", version: "1.0.0" },
  });

  return stripeClient;
}
