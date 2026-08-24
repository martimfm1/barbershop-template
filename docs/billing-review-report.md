# Billing module review and refactor

## Outcome

Billing is now served through one application boundary: `BillingService`. Route handlers authenticate, validate and normalize HTTP input; billing services orchestrate Stripe and Supabase; `SubscriptionService` owns the subscription read model. The old duplicate implementations in `lib/stripe` are retired so they cannot drift from the production flow.

## Improvements made

| Area         | Change                                                                                                                                                   | Result                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Architecture | Consolidated checkout, portal, cancellation, resume and webhook behavior into `services/billing`.                                                        | Clear HTTP/application/persistence responsibilities and one source of truth. |
| Security     | Checkout accepts only configured price IDs and return URLs are restricted to `NEXT_PUBLIC_APP_URL`'s origin.                                             | Prevents price tampering and open redirects.                                 |
| Security     | All mutation routes derive the user from Supabase Auth; service-role access is isolated to server services.                                              | No caller-controlled user IDs or browser service-role use.                   |
| Stripe       | Adds a customer-creation idempotency key, `client_reference_id`, subscription metadata, customer metadata, and uses hosted Checkout plus Billing Portal. | Safer retries and reliable customer-to-user correlation.                     |
| Stripe       | Uses subscription events as the read-model source, and performs idempotent `upsert` by `user_id`.                                                        | Duplicate or reordered delivery does not create duplicate records.           |
| Supabase     | Adds a migration with customer/subscription uniqueness, foreign keys, indexes, and read-only RLS policies.                                               | Safe concurrency, faster lookup paths and protected client access.           |
| Next.js      | Billing routes explicitly use the Node runtime for Stripe webhooks and force dynamic subscription reads.                                                 | Avoids Edge incompatibility and cached account data.                         |
| Errors       | Defines typed `BillingError` codes and maps them centrally to safe HTTP responses.                                                                       | Predictable API contracts without exposing provider/database errors.         |
| Logging      | Webhook logs use event ID/type only; unexpected errors log error class only.                                                                             | Useful operational signal without leaking PII, secrets or signed payloads.   |
| TypeScript   | Removes stale `_types` imports and obsolete `redirectToCheckout`; Stripe API version matches the installed SDK types.                                    | Billing source type-checks against current Stripe types.                     |

## Required deployment steps

1. Apply `supabase/migrations/20260805000000_harden_billing.sql` in the normal Supabase migration pipeline.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, and the four `STRIPE_PRICE_*` variables. Use production price IDs only in production.
3. Configure Stripe to deliver `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted` to `/api/stripe/webhook`.
4. Configure and test the Stripe Customer Portal in the Stripe Dashboard; portal policy, tax and invoice behavior belongs there.

## Remaining recommendations

- Add a durable webhook-event inbox/outbox if webhooks will trigger side effects beyond the idempotent subscription read model (emails, provisioning, analytics). A unique `stripe_event_id` and worker make those effects exactly-once from the application's perspective.
- Generate Supabase database types and replace the current untyped client table calls. This repository currently has no generated database type file.
- Add integration tests using Stripe test clocks and Stripe CLI forwarding for retry, cancellation, trial and out-of-order webhook cases.
- Restrict the prices endpoint to configured prices only (already done by the service) and consider caching the public price projection at the CDN for larger catalogues.
