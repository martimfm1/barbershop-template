# Changelog

## v3.0.14 — 2026-08-09

### Added
- Added plan-aware Analytics UI at `/dashboard/analytics` for Pro and Enterprise.
- Added date-range filters and manual refresh.
- Added revenue, bookings, clients and cancellation KPI cards.
- Added daily revenue visualization.
- Added service and professional performance sections.
- Added Enterprise POS revenue, transaction and combined-revenue metrics.
- Added loading, empty and error states.
- Added responsive dashboard layout following the existing design system.

### Security / Access
- Analytics UI checks the existing `advanced_analytics` entitlement before rendering protected data.
- Enterprise-only financial metrics are rendered only when the Enterprise entitlement is present.
- The UI does not replace the server-side authorization already enforced by `/api/analytics`.
- Upgrade CTA directs users without access to `/dashboard/billing`.

## v3.0.13 — 2026-08-09

### Added
- Added `GET /api/analytics` for authenticated Pro analytics.
- Added period filtering with a maximum 366-day range.
- Added revenue, appointment, cancellation and client metrics.
- Added revenue-by-day data for charting.
- Added service and professional performance rankings.
- Added previous-period revenue comparison.
- Added Enterprise-only POS revenue and location breakdowns.

### Security
- Analytics requires the server-side `advanced_analytics` entitlement and `analytics` permission.
- Tenant scope is resolved from the authenticated user; `barbershop_id` is never accepted from the client.
- Enterprise metrics are only returned when the authenticated plan is Enterprise.
- Date ranges are validated server-side to prevent unbounded reporting queries.
- Financial totals are calculated from authoritative database records rather than client-provided values.

### Performance
- Analytics responses use a short private cache window suitable for dashboard refreshes.
- Queries are constrained to the authenticated tenant and requested period.

## v3.0.12 — 2026-08-09

### Added
- Added Enterprise POS sales checkout UI at `/dashboard/pos`.
- Added searchable product and service catalog.
- Added cart with quantity controls and product stock limits.
- Added optional client association.
- Added payment method selection and discount input.
- Added server-backed checkout using the existing atomic POS transaction API.
- Added automatic catalog/history refresh after successful sales and reversals.

### Security
- POS checkout continues to require the Enterprise `pos` entitlement.
- Product, service and client data are read through the authenticated Supabase client with existing tenant RLS; the checkout endpoint remains the authoritative mutation boundary.
- Client-provided prices, totals and stock are never trusted by the backend; the atomic PostgreSQL function revalidates them before committing.
- UI-only cart metadata is stripped before the checkout request.

### UX
- Added responsive catalog, sticky cart and transaction history layout.
- Added clear empty, loading, success and error states.
- Added server-validation notice to make the checkout trust boundary explicit.

## v3.0.11 — 2026-08-09

### Added
- Added the Enterprise POS dashboard at `/dashboard/pos`.
- Added transaction history with payment method, totals, items and transaction status.
- Added POS refund and void actions with confirmation before irreversible operations.
- Added automatic stock restoration feedback after successful refunds/voids.
- Added Enterprise plan-aware access state and upgrade CTA for the POS dashboard.
- Added refresh and loading states for POS transaction history.

### Security
- POS UI access is derived from the existing server-side entitlement API through `useFeatureAccess`; the UI is not an authorization boundary.
- Refund and void operations continue to use the authenticated server-side tenant context and atomic PostgreSQL reversal function.
- Completed transactions are the only transactions exposed as reversible actions in the UI; the API remains authoritative.
- Transaction identifiers are sent only to the existing authenticated reversal endpoint.
