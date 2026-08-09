# Changelog

## [Unreleased]

### Security
- Hardened tenant isolation with a server-resolved current barbershop helper.
- Prevented client-side changes to user `barbershop_id`, `role`, and account identity.
- Restricted user mutations to the authenticated tenant and client records.
- Removed public appointment reads while preserving validated public booking creation.
- Validated appointment service and professional ownership against the selected barbershop.
- Restricted barbershop and marketplace shop writes to the appropriate owner/admin tenant.
- Hardened audit logs against direct client-side writes.
- Added indexes for tenant-scoped users and appointment queries.

## [0.3.1] - 2026-08-06

### Added
- Email notification for bookings
- Forgot password page and systems

### Changed
- Subscription prices

### Fixed
- Mobile acessebility in login page
