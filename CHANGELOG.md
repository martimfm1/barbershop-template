# Changelog

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

### Next
- Continue implementing the remaining Pro and Enterprise backend modules behind the existing entitlement guards.
