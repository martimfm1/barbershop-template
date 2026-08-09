# Changelog

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

### UX
- Added responsive transaction table with clear status and payment information.
- Added explicit distinction between refund and void actions.
- Added disabled states while a reversal is being processed to prevent duplicate requests.
- Added success and error toasts for POS operations.

## v3.0.10 — 2026-08-09

### Added
- Added atomic Enterprise POS refund and void support.
- Added `POST /api/enterprise/pos/[transactionId]/reversal` with `refund` and `void` modes.
- Added a PostgreSQL transaction function that locks the POS transaction and inventory rows before reversing stock.

### Security
- Reversal APIs reuse the existing Enterprise POS authorization boundary and resolve the tenant server-side.
- A transaction can only be reversed when it belongs to the authenticated barbershop and is currently `completed`.
- Reversal is idempotent by transaction state: already refunded or voided transactions cannot be reversed again.
- Inventory is restored and the corresponding `return` stock movement is created atomically with the status change.
- The reversal RPC is executable only by Supabase `service_role`.

### Database
- Added `supabase/migrations/20260903010000_pos_refund_void_atomic.sql`.

## v3.0.9 — 2026-08-09

### Fixed
- Made Enterprise POS sales atomic at the database level.
- POS transaction creation, transaction items, inventory decrement and stock movement now succeed or roll back as one PostgreSQL transaction.
- Removed the previous application-level create-then-delete rollback pattern, which could leave inconsistent state after partial failures.

### Security
- Product stock is locked with `FOR UPDATE` before a sale is accepted, preventing concurrent sales from overselling inventory.
- POS prices are revalidated against the authoritative database product/service price inside the transaction.
- Location, client and appointment ownership is validated inside the database transaction.
- The atomic POS RPC is executable only by the Supabase `service_role`; clients cannot call it directly.
- Inventory sale movements are created together with the stock decrement and POS transaction.

### API
- `POST /api/enterprise/pos` now delegates transaction creation to the atomic database RPC.
- Added explicit `409` responses for insufficient stock and stale prices.
- POS item creation remains protected by the existing Enterprise module authorization boundary.

### Database
- Added `supabase/migrations/20260903000000_pos_atomic_transactions.sql`.

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
