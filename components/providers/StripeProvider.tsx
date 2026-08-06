"use client";

import { useMemo } from "react";
import { Elements } from "@stripe/react-stripe-js";
import {
  loadStripe,
  Stripe,
  StripeElementsOptionsClientSecret,
  Appearance,
} from "@stripe/stripe-js";

// Singleton pattern to prevent re-initializing Stripe on every render
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable."
      );
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export type StripeThemeMode = "dark" | "light" | "custom";

export interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret: string;
  mode?: StripeThemeMode;
  locale?: StripeElementsOptionsClientSecret["locale"];
  appearanceOverride?: Appearance;
}

const darkAppearance: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#10b981", // emerald-500
    colorBackground: "#18181b", // zinc-900
    colorText: "#f4f4f5", // zinc-100
    colorTextSecondary: "#a1a1aa", // zinc-400
    colorDanger: "#f87171", // red-400
    fontFamily: "var(--font-sans, system-ui, sans-serif)",
    spacingUnit: "4px",
    borderRadius: "16px",
  },
  rules: {
    ".Input": {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      boxShadow: "none",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    },
    ".Input:focus": {
      borderColor: "rgba(16, 185, 129, 0.5)",
      boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.15)",
    },
    ".Label": {
      fontSize: "12px",
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: "#a1a1aa",
    },
    ".Tab": {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      color: "#a1a1aa",
    },
    ".Tab--selected": {
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      borderColor: "rgba(16, 185, 129, 0.3)",
      color: "#10b981",
    },
  },
};

const lightAppearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#059669", // emerald-600
    colorBackground: "#ffffff",
    colorText: "#18181b",
    colorTextSecondary: "#71717a",
    colorDanger: "#dc2626",
    fontFamily: "var(--font-sans, system-ui, sans-serif)",
    spacingUnit: "4px",
    borderRadius: "16px",
  },
};

export function StripeProvider({
  children,
  clientSecret,
  mode = "dark",
  locale = "auto",
  appearanceOverride,
}: StripeProviderProps) {
  const stripe = getStripe();

  const appearance = useMemo<Appearance>(() => {
    if (appearanceOverride) return appearanceOverride;
    return mode === "dark" ? darkAppearance : lightAppearance;
  }, [mode, appearanceOverride]);

  const elementsOptions = useMemo<StripeElementsOptionsClientSecret>(() => {
    return {
      appearance,
      locale,
      clientSecret,
    };
  }, [clientSecret, appearance, locale]);

  return (
    <Elements stripe={stripe} options={elementsOptions}>
      {children}
    </Elements>
  );
}
