# Changelog

## v3.0.15 — 2026-08-09

### Fixed
- Corrected Hero pricing feature claims to match the actual Free, Pro and Enterprise entitlements.
- Removed obsolete AI claims from the Pro and Enterprise pricing presentation.
- Removed obsolete API claims from the Enterprise pricing presentation.
- Replaced those claims with implemented Pro loyalty/follow-up capabilities and Enterprise reports.
- Removed obsolete marketing copy referring to intelligence/API capabilities not included in the current plan model.

### Pricing consistency
- `/plans` continues to derive the complete comparison from the centralized `PLAN_FEATURES`, `PLAN_LIMITS` and `FEATURE_LABELS` definitions.
- Hero pricing now uses only capabilities represented by the current entitlement model.
- Pro remains limited to 5 barbers and 1 location.
- Enterprise remains unlimited for barbers and locations.
- No AI assistant or public API access is advertised as a Pro or Enterprise feature.

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
