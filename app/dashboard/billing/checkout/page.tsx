import { EmbeddedStripeCheckout } from "@/components/billing/embedded-stripe-checkout";

export default function BillingCheckoutPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-50 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <EmbeddedStripeCheckout />
      </div>
    </main>
  );
}
