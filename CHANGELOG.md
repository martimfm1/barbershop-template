# Changelog

## v3.0.20 — 2026-08-10

### Changed
- Renamed the dashboard navigation entry from `Stats` to `Analytics` and moved the primary analytics experience to `/dashboard/analytics`.
- Added a shared desktop dashboard sidebar with navigation for overview, Analytics, Marketing, Automations, Loyalty, POS, billing and settings.
- Dashboard navigation now uses the canonical plan entitlements for gated modules.
- Made the existing dashboard navbar transparent on dashboard routes while keeping its original behaviour elsewhere.
- Highlighted the authenticated user's current plan in the full plan comparison table.

### Fixed
- Fixed the Analytics API returning a payload shape that did not match the Analytics UI.
- Fixed Analytics daily revenue, service, professional and KPI rendering to consume the actual `/api/analytics` response.
- Fixed an accidental `analytics` permission requirement that could return `PERMISSION_DENIED` to valid Pro/Enterprise users even when the plan entitlement was present.
- Reduced stale subscription state so a recently changed Enterprise subscription is not incorrectly displayed as Pro for several minutes.
- Analytics now explicitly bypasses browser HTTP caching when resolving the current subscription state.

### Security / Access
- Analytics remains protected server-side by the canonical `advanced_analytics` entitlement.
- Tenant isolation continues to be enforced by the server-side module context and authenticated user/barbershop resolution.
- Removing the accidental role-permission gate does not remove plan enforcement; users without the Analytics entitlement still receive the feature-not-included response.

### Notes
- The legacy `/dashboard/stats` implementation is no longer linked from the dashboard navigation; `/dashboard/analytics` is the canonical route.

## v3.0.19 — 2026-08-09

### Changed
- Improved `/dashboard` UI.
- Redesigned `/dashboard/stats`.
- Improved responsive behaviour.
- Improved loading and empty states.
- Replaced legacy feature checks with canonical entitlements where applicable.

### Fixed
- Removed legacy `professionals` / `analytics` feature checks in `/dashboard` in favour of `team_management` / `advanced_analytics`.

## v3.0.18 — 2026-08-09

### Added
- Added `/dashboard/automations` for Pro and Enterprise follow-up automation management.
- Added automation creation with validated trigger selection.
- Added supported triggers for new bookings, completed bookings, cancelled bookings, inactive clients and birthdays.
- Added rule listing with active/inactive status and action count.
- Added loading, empty, error and refresh states.
- Added upgrade CTA for plans without `automated_followups`.

### Security / Access
- UI access is gated by the canonical `automated_followups` entitlement.
- Tenant authorization and validation remain enforced by `/api/automations/rules`.
- The UI does not accept `barbershop_id`, user identity or recipient lists from the client.
- Automation actions remain server-controlled; the UI only creates validated rule metadata and does not bypass the backend execution layer.

### Scope
- Destructive rule deletion and action-builder controls remain disabled because the current API does not expose safe mutation endpoints for those operations.
- No fake automation execution is performed by the UI.

## v3.0.17 — 2026-08-09

### Added
- Added `/dashboard/marketing` for Pro marketing campaign management.
- Added campaign list with channel, status and creation date.
- Added email campaign creation with subject and message validation.
- Added SMS campaign creation UI while keeping SMS provider activation controlled by the existing backend/provider configuration.
- Added responsive campaign creation form and empty/loading/error states.
- Added refresh control and upgrade CTA for plans without `marketing_campaigns`.
- Campaign creation continues to use the authenticated `/api/marketing/campaigns` endpoint; tenant identity and recipient limits remain server-side concerns.

### Security / Access
- Marketing UI is gated by the canonical `marketing_campaigns` entitlement.
- Client-side feature gating is not treated as authorization; the API remains authoritative.
- The UI does not accept or display arbitrary recipient lists.
- Campaign payloads are sent only to the existing validated server endpoint.

## v3.0.16 — 2026-08-09

### Fixed
- Removed duplicated legacy `professionals` and `analytics` entries from the actual plan feature lists.
- Added a single compatibility resolver mapping legacy UI checks to canonical entitlements.
- `professionals` now resolves to the canonical `team_management` entitlement.
- `analytics` now resolves to the canonical `advanced_analytics` entitlement.
- Updated `useFeatureAccess` to use the canonical resolver instead of directly checking the raw feature array.
- Prevented legacy feature names from becoming independently configurable plan entitlements.

### Pricing consistency
- Free, Pro and Enterprise limits remain centralized in `PLAN_LIMITS`.
- Feature presentation remains centralized in `PLAN_FEATURES` and `FEATURE_LABELS`.
- Pro remains 5 barbers / 1 location.
- Enterprise remains unlimited barbers / unlimited locations.
- AI assistant and API access remain excluded from all advertised plan features.
