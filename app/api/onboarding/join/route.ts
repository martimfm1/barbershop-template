// Backwards-compatible entry point.
// Keep the legacy route aligned with the canonical invite implementation so
// there is only one source of truth for validation, expiry, seat limits and
// role assignment.
export { POST } from '@/app/api/onboarding/join-v2/route';
