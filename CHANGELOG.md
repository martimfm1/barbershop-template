# Changelog

## v3.0.27 — 2026-08-10

### Fixed
- Added an explicit Supabase-managed billing plan override so support/admin staff can change a user's effective plan without changing Stripe data.
- Billing plan resolution now checks `subscriptions.plan_override` before Stripe/local plan resolution.
- Improved the subscription payment dialog for mobile and desktop with constrained viewport sizing, internal scrolling, larger touch targets, visible focus states, accessible loading/error states and clearer payment security messaging.

### Supabase
- Added `supabase/migrations/20260810130000_add_plan_override.sql`.
- Set `subscriptions.plan_override` to `free`, `pro`, `enterprise`, or `NULL` to control whether a user has a manual plan override.
- `NULL` keeps the normal Stripe-based plan resolution.

### Notes
- Manual paid-plan overrides are intended for controlled support/admin use. When setting a paid override for a user without an active Stripe subscription, keep the subscription status as an access-granting status such as `active` if downstream billing components require an active subscription.

## v3.0.26 — 2026-08-10

### Fixed
- Made the resolved Stripe plan the single source of truth for billing UI consumers.
- Fixed stale local subscription plans causing Enterprise accounts to appear as Pro or Free in billing-related UI.
- Billing consumers now receive the effective plan returned by `/api/stripe/subscription` while preserving the subscription's Stripe identifiers and billing status.

### Changed
- Removed the personalized greeting from the dashboard top bar; the top bar now focuses on navigation and the live clock.
- Preserved the dashboard hero greeting and date presentation in the main dashboard content.

## v3.0.25 — 2026-08-10

### Fixed
- Fixed paid-plan authorization using the current Stripe subscription price as the source of truth when the persisted subscription row is stale.
- Fixed cases where an Enterprise subscription could be persisted or resolved as Pro and consequently receive incorrect feature entitlements.
- Fixed access checks continuing to grant paid access from stale local state when Stripe reports a subscription status that does not grant paid access.
- Added reconciliation of the local plan, Stripe price ID, subscription status and billing period when the current Stripe subscription is available.
- Pending Stripe invoices in `draft`/`open`/transitional states older than 10 minutes are no longer returned by the billing invoices API.
- Pending invoices are hidden from the application without deleting or modifying them in Stripe.

### Documentation
- Reworked the README to accurately document the current SaaS architecture, dashboard, plans, billing, security model, integrations, development workflow and roadmap.

## v3.0.24 — 2026-08-10

### Legal
- Updated the Terms and Conditions to reflect the current SaaS model, free/pro/enterprise plans, plan-based quotas and feature access, Stripe billing, public bookings, marketplace responsibilities, and account lifecycle.
- Updated the Privacy Policy to reflect current account, booking, customer, analytics, audit, billing, email, push-notification and operational data processing.
- Documented Brevo as the email delivery provider and clarified that the barbershop name may be used as the sender name.
- Clarified that manual SMS sending is currently disabled.
- Clarified that push notifications are currently used for operational alerts to barbers, including new bookings.
- Added clearer controller/processor responsibilities between Silentra and barbershops for customer data.
- Expanded information about retention, international transfers, security, data-subject rights and third-party service providers.
- Updated the last-review date of both legal documents to 10 August 2026.

## v3.0.23 — 2026-08-10

### Changed
- Removed the dashboard sidebar navigation to simplify the dashboard layout.
- Removed the dashboard date from the top bar because the date is already available in the existing dashboard context.
- Kept the personalized greeting with the authenticated user's first name, contextual greeting and live clock in the top bar.

### Added
- Added an accessible "Voltar ao site" action in the dashboard top bar linking to `/`.
- The return action includes a keyboard-visible focus state and an accessible label.

## v3.0.22 — 2026-08-10

### Added
- Added a branded Silentra header to the dashboard sidebar.
- Added a personalized dashboard top bar with the user's first name, contextual Portuguese greeting, current date and live local clock.
- Added manual email messaging at `/dashboard/mensagens` with reusable templates and custom messages.
- Added secure server-side email delivery through the existing Brevo configuration.
- Added tenant-scoped recipient validation and audit logging for manual emails.

### Changed
- Manual messaging now uses the barbershop name as the Brevo sender name.
- Email templates support `{{nome}}` and `{{barbearia}}` placeholders.
- Improved the messaging UI with accessible controls, preview, validation and responsive layout.

### Disabled
- Manual SMS sending remains explicitly disabled until the SMS provider is activated.

### Security
- Manual email recipients are resolved server-side and must belong to the authenticated user's barbershop.
- The API never accepts a client-supplied barbershop ID for authorization.
- Email message HTML is escaped server-side before being sent.
