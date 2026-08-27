# Silentra for Barbers — Architecture

## Canonical rules

The project should have one canonical implementation per product surface. Do not create files named `final`, `optimized`, `stable`, `v2`, `new` or `legacy` for a temporary UI variant. Refactor the canonical implementation instead.

### Booking

- `app/barbershops/components/booking-drawer.tsx` is the public entry point.
- `app/barbershops/components/booking-drawer-public.tsx` is the canonical public drawer implementation.
- Availability is read from `/api/shops/[id]/booking-data`.
- Booking creation is handled by `/api/bookings` and finalized by the atomic `create_booking_atomic` database function.
- The browser is never the source of truth for conflicts, tenant ownership, plan access or booking state.

### Public barbershop page

- `app/barbershops/[slug]/page.tsx` owns server-side profile resolution.
- `public-barbershop-page.tsx` is the canonical client presentation.
- Public amenities come from the normalized `shops.amenities` model.

### Settings

`/dashboard/settings` is the single configuration workspace.

- Business: identity and public business data.
- Location: address, map and establishment amenities.
- Hours: opening hours, breaks, days off and booking rules.
- Appearance: logo and cover.
- Billing: subscription and invoices.
- Account: authentication and security.

There is intentionally no separate sidebar section for booking rules. Booking rules belong with operating hours because they directly affect availability and reservations.

## Data boundaries

Use the browser Supabase client only for authenticated user operations that are safe under RLS. Server-only operations that require service-role access belong in API routes or server services. Tenant identity must always come from authenticated context and be checked against the requested barbershop.

Never trust IDs, roles, plan names or visibility flags sent by the browser.

## Plans

Feature access is resolved by `hooks/useFeatureAccess.ts` and `lib/billing/plan-features.ts` for UI state. Backend authorization remains authoritative. Pro-only settings must be enforced again by the server/database function.

## Observability

Production errors use `lib/observability/logger.ts`. Logs must be structured, short and free of credentials or customer PII. See `docs/OBSERVABILITY.md`.

## UI principles

Prefer progressive disclosure, one primary action per section, 44px+ touch targets, visible keyboard focus, reduced-motion friendly transitions and inline validation. See `docs/UI-UX.md`.
