# Changelog

## v3.0.2 — 2026-08-09

### Added
- Added the Pro Loyalty data model with loyalty settings, rewards, customer balances, point transactions and redemptions.
- Added strict database constraints for loyalty point balances, reward costs, tiers and reward types.
- Added tenant-scoped RLS policies for all Loyalty tables.
- Added a server-side Pro-gated Loyalty API at `/api/loyalty`.
- Added a Pro-gated `/dashboard/loyalty` interface following the existing dashboard design language.
- Added a focused Loyalty overview with points, customer tiers and reward summaries.
- Added reward cards with clear point costs and empty states.

### Security
- Loyalty mutations are denied to browser clients; write operations must use trusted server-side services.
- Loyalty reads are scoped to the authenticated user's barbershop through RLS and server-side tenant resolution.
- Loyalty access is enforced from the canonical server-side entitlement state; hiding the UI is not the security boundary.
- Reward and points values are constrained at the database layer to prevent invalid negative or excessive values.

## v3.0.1 — 2026-08-09

### Changed
- Removed **Assistente de IA** from Pro and Enterprise entitlements.
- Removed **Acesso à API** from Enterprise entitlements.
- Removed the corresponding feature keys from the canonical billing model so they cannot be granted accidentally through the entitlement service.
- Kept Free as the fully usable base plan with its existing core booking and management features.
- Kept Pro focused on CRM, analytics, automation, marketing, loyalty, reports and team management.
- Kept Enterprise focused on multi-location, global management, permissions, commissions, inventory, POS and enterprise reporting.
- Improved Pro and Enterprise plan descriptions for the pricing UI.

### Security
- Plan entitlements now have no AI/API capabilities available through the canonical feature registry.
- Paid features continue to be resolved from server-side subscription state rather than client-provided plan values.
