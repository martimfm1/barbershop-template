# Review security plan

Production requirement for public reviews.

Current flow: the public barbershop page can call the `reviews` table directly from the browser. The production target is a one-time token tied to a completed appointment.

Target flow:

1. Appointment transitions to `completed`.
2. Server generates a cryptographically random review token.
3. Only the SHA-256 hash is stored with `appointment_id`, `barbershop_id`, expiry and consumed timestamp.
4. Review email contains the raw token in a HTTPS URL.
5. Public review submission goes through `/api/reviews`.
6. Server hashes the token, validates expiry and unused state, inserts the review with the appointment relationship, and atomically consumes the token.
7. Direct anonymous inserts into `reviews` are removed from RLS.

Required staging tests:

- invalid token -> 401/403
- expired token -> 403
- reused token -> 409
- token from another barbershop -> 403
- completed appointment -> can review once
- scheduled appointment -> cannot review
- concurrent submissions -> one succeeds, one fails
