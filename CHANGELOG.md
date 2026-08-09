# Changelog

## v3.0.8 — 2026-08-09

### Added
- Added a shared server-side authorization boundary for Pro/Enterprise module APIs.
- Added protected CRM tag management using the new `customer_tags` model.
- Added protected automation rule management.
- Added Enterprise inventory product API.
- Added Enterprise location API with plan quota enforcement.
- Added Enterprise commissions API with tenant validation and database-calculated commission amounts.
- Added Enterprise advanced report configuration API.
- Added Enterprise staff permission API.
- Added Enterprise POS transaction API with server-side totals and tenant validation.

### Security
- Pro/Enterprise API access is resolved from the authenticated subscription, never from client-supplied plan values.
- Module APIs resolve the authenticated user's barbershop server-side and enforce tenant boundaries.
- Enterprise permission checks are enforced server-side for staff operations.
- POS products and services are validated against the authenticated barbershop before transaction creation.
- Marketing campaigns now enforce the `marketing_campaigns` entitlement and use server-side tenant access.
- The existing locations endpoint was aligned with the new `parent_barbershop_id` schema and multi-location entitlement.

### Compatibility
- Reused the existing billing entitlement and module authorization architecture.
- Existing marketing, CRM, loyalty and location APIs remain under their existing routes.
- No Stripe subscription contract was changed.

## v3.0.7 — 2026-08-09

### Fixed
- Resolved the duplicate migration timestamp for the Pro/Enterprise module foundation.
- Renamed `20260809000000_pro_enterprise_modules.sql` to `20260809000100_pro_enterprise_modules.sql` so it no longer conflicts with the existing `20260809000000_loyalty.sql` migration.

### Database
- Preserved the Pro/Enterprise migration SQL without changing its schema or RLS definitions.
- Kept `20260809210000_locations_and_quota_enforcement.sql` as the unique migration for that timestamp.
- Migration identifiers are now unique in the repository and can be reconciled with the remote Supabase migration history.

### API / Compatibility
- Reviewed the existing module authorization boundary and API guard architecture for timestamp-related conflicts; migration filenames do not overlap with API routes or service paths.
- No API endpoint names or request contracts were changed by this migration fix.

## v3.0.6 — 2026-08-09

### Added
- Added a centralized server-side module authorization boundary for Pro and Enterprise modules.
- Added a single mapping between dashboard modules and billing `FeatureKey` entitlements.
- Added `GET /api/modules/access` to resolve authenticated module access from the server-side subscription state.
- Added support for checking an individual module or all registered modules.

### Security
- Module access never trusts a plan supplied by the client.
- Paid access continues to require the existing server-side subscription entitlement checks.
- New module mutations should use the same authorization boundary before touching tenant data.

### Database
- No new database migration is required for this step. The existing Pro/Enterprise migrations remain the source of truth for the module tables.

## v3.0.5 — 2026-08-09

### Added
- Added the database foundation for Pro CRM segmentation and customer tags.
- Added automation rules and execution history tables.
- Added Enterprise locations and location membership models.
- Added Enterprise staff permission storage.
- Added Enterprise inventory products and stock movement history.
- Added Enterprise commission records with database-calculated commission amounts.
- Added Enterprise POS transactions and transaction items.
- Added advanced report configuration storage.

### Security
- Added tenant-scoped indexes and foreign keys across the new modules.
- Added RLS to every new module table.
- Added a follow-up RLS hardening migration that removes browser write access from the new Pro/Enterprise module tables.
- New mutations are intended to pass through server APIs where plan entitlements and staff permissions are enforced.

### Database
- Added `supabase/migrations/20260809000000_pro_enterprise_modules.sql`.
- Added `supabase/migrations/20260809000001_harden_pro_enterprise_rls.sql`.

## v3.0.4 — 2026-08-09

### Added
- Added a reusable `FeatureGate` UI component for plan-aware dashboard features.
- Added `useFeatureGate` for centralized client-side entitlement checks.
- Added upgrade toasts for unavailable Pro and Enterprise functionality.
- Upgrade toasts navigate directly to `/dashboard/billing`.
- Added optional locked/disabled presentation with a visual lock indicator.

### Security
- UI gating is explicitly presentation-only; server-side feature guards remain the enforcement boundary.
- The current plan is resolved through the existing subscription access hook rather than client-provided plan values.

## v3.0.3 — 2026-08-09

### Fixed
- Fixed `POST /api/stripe/create-subscription` returning `409` for users with the default Free subscription row.
- Free is now treated as the default access state, not as an active paid Stripe subscription.
- Upgrading Free creates the first paid Stripe subscription.
- Changing Pro ↔ Enterprise reuses the existing Stripe subscription instead of creating a second subscription.
- Added explicit `created` / `changed` subscription transition results for the billing UI.

### Billing UI
- Updated billing mutations for Free-to-paid activation and paid-plan changes.
- Subscription and invoice state is refreshed after plan transitions.
- Customers can continue managing plans inside Silentra without visiting Stripe.

### Security
- Paid access still requires Stripe `active` / `trialing` state.
- A Free subscription row can no longer satisfy paid-subscription checks.
- The system maintains one subscription record per user and avoids duplicate paid Stripe subscriptions.

## v3.0.2 — 2026-08-09

### Added
- Added the Pro Loyalty data model with settings, rewards, customer balances, point transactions and redemptions.
- Added database constraints and tenant-scoped RLS for Loyalty.
- Added the Pro-gated `/api/loyalty` API and `/dashboard/loyalty` UI.

### Security
- Loyalty writes are denied to browser clients and reads are tenant-scoped.
- Loyalty access is enforced server-side.

## v3.0.1 — 2026-08-09

### Changed
- Removed **Assistente de IA** from Pro and Enterprise.
- Removed **Acesso à API** from Enterprise.
- Kept Free as the fully usable base plan.
- Kept Pro focused on CRM, analytics, automation, marketing, loyalty, reports and team management.
- Kept Enterprise focused on multi-location, global management, permissions, commissions, inventory, POS and enterprise reporting.

### Security
- Paid features continue to be resolved from server-side subscription state rather than client-provided plan values.
