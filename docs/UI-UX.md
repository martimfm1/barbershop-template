# UI / UX guidelines

## Information architecture

Keep settings grouped by the real-world concept the setting affects:

- Business = who the barbershop is.
- Location = where it is and what the place offers.
- Hours = when it operates and how bookings behave.
- Appearance = how the public profile looks.
- Billing = what is paid for.
- Account = who can access it.

Avoid duplicate navigation entries for the same concept.

## Booking flow

The public booking flow is progressive:

1. choose the professional and day;
2. choose an available time;
3. enter/confirm customer data;
4. show a compact confirmation summary.

Only fetch time slots after enough context exists to calculate them. Changing professional, day or service invalidates a previous slot selection.

## Forms

- Labels must be programmatically associated with inputs.
- Errors appear beside the affected action and use `role="alert"` where appropriate.
- Async actions expose a loading state and never allow duplicate submissions.
- Dates are entered as `DD/MM/AAAA` when shown to Portuguese users and converted to ISO before API calls.
- Keep destructive or irreversible actions separate from ordinary save actions.

## Accessibility

Use semantic headings, buttons for actions, visible `focus-visible` states, `aria-pressed` for selectable cards, `aria-live` for asynchronous status and 44px minimum interactive targets.

Respect `prefers-reduced-motion` for non-essential animation.

## Visual system

Use the shared UI primitives from `components/ui` instead of page-local variants. Glass surfaces should remain subtle and preserve text contrast. Prefer one primary accent per surface and avoid excessive borders, gradients and decorative motion.
