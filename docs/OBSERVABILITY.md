# Production observability

## Goals

Production logs exist to answer three questions quickly:

1. Which operation failed?
2. Where did it fail?
3. Was the failure caused by infrastructure, validation, authorization or application logic?

## Logger

Use `productionLogger` from `lib/observability/logger.ts` for server-side operational logs.

Prefer event names such as:

- `booking.create_failed`
- `booking.availability_failed`
- `marketing.campaign_load_failed`
- `settings.update_failed`
- `server.unhandled_rejection`

Use stable context fields such as `route`, `operation`, `status`, `error_code`, `request_id` and `duration_ms`.

## Never log

Do not log passwords, access tokens, refresh tokens, authorization headers, cookies, API keys, QR payloads, email addresses, phone numbers, birth dates or full request bodies.

The logger redacts sensitive keys as a second line of defence, but callers should still avoid passing sensitive data.

## Unhandled errors

`instrumentation.ts` registers production handlers for `uncaughtException` and `unhandledRejection`. They keep diagnostic information in the server logs without exposing request payloads.

## API routes

API handlers should:

- return a user-safe error message;
- log the internal event once at the boundary;
- include an error code when available;
- never log the complete Supabase, Stripe or provider object.

Expected user-facing errors are not exceptional and should generally not be logged as server errors (for example, invalid form input or an occupied booking slot).
