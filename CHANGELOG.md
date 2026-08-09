# Changelog

## [Unreleased]

### Added
- Added server-side billing entitlement primitives for feature checks and plan quotas.
- Added centralized helpers for paid-plan checks and professional/location limits.
- Added atomic professional creation with plan-aware quota enforcement and audit logging.
- Added strict server-side validation for professional creation requests.
- Added the `locations` tenant entity with an initial location backfill for existing barbershops.
- Added authenticated location management API with create, list, update and delete operations.
- Added atomic location quota enforcement: Free 1, Pro 1, Enterprise unlimited.
- Added the first Advanced CRM backend foundation with client notes, tags and tag assignments.
- Added tenant-safe CRM client search with pagination.
- Added a client 360 API returning profile, appointment history, notes and tags.
- Added APIs for private client notes and client tag management.
- Added an Advanced CRM dashboard at `/dashboard/crm` with client search, segmentation tags and plan gating.
- Added a 360º client profile at `/dashboard/crm/[clientId]` with appointment history and private notes.

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
- Location mutations require an authenticated owner/admin and always scope the target location to the caller's barbershop.
- Location quota checks are serialized per barbershop to prevent concurrent-request bypasses.
- Client-side direct writes to the locations table are disabled; mutations must use the server API.
- Advanced CRM records are tenant-scoped with RLS and database-level cross-tenant validation.
- CRM APIs authenticate every request and resolve the tenant from the authenticated user instead of accepting a client-supplied tenant ID.
- Client 360 queries only return clients, appointments, notes and tags belonging to the authenticated barbershop.

