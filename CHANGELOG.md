# Changelog

## [Unreleased]

### Added
- Added server-side billing entitlement primitives for feature checks and plan quotas.
- Added centralized helpers for paid-plan checks and professional/location limits.
- Added atomic professional creation with plan-aware quota enforcement and audit logging.
- Added strict server-side validation for professional creation requests.

### Security
- Hardened tenant isolation with a server-resolved current barbershop helper.
- Prevented client-side changes to user `barbershop_id`, `role`, and account identity.
- Restricted user mutations to the authenticated tenant and client records.
- Removed public appointment reads while preserving validated public booking creation.
- Validated appointment service and professional ownership against the selected barbershop.
- Restricted barbershop and marketplace shop writes to the appropriate owner/admin tenant.
- Hardened audit logs against direct client-side writes.
- Added indexes for tenant-scoped users and appointment queries.
- Professional quota checks are serialized per barbershop to prevent concurrent-request bypasses.
- Professional creation now resolves the effective plan from server-side subscription state instead of trusting browser input.

## [0.3.1] - 2026-08-06

### Added
- Email notification for bookings
- Forgot password page and systems

### Changed
- Subscription prices

### Fixed
- Mobile acessebility in login page
