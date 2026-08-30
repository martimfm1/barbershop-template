# Silentra for Barbers — Product Hardening Roadmap

## Objective

Bring the dashboard and public barber experience to a consistent, production-ready standard with simpler configuration, clearer language, stronger sales workflows, and final quality assurance.

## Delivery order

### 1. Settings: one save flow

- Keep one primary `Guardar alterações` action at the settings page level.
- Treat settings as a single draft, including business identity, location, opening hours, booking rules, cancellation policy, amenities, and automatic booking rules where supported.
- Remove individual `Guardar...` actions from settings sub-panels.
- Show a single dirty state, saving state, success state, and failure state.
- Add safe discard/reset behaviour for unsaved changes.
- Do not silently persist changes when toggles or inputs change.

### 2. Public sales page inside each barber branch (optional)

- Add an optional public sales/offer page under the barber shop public branch.
- Reuse the shop identity, services, professionals, availability, and booking CTA.
- Keep the page conversion-focused and mobile-first.
- Add clear controls in settings to enable/disable the page.

### 3. Sales management

- Redesign sales/POS management around daily operations first.
- Make the primary action obvious: create sale, add items/services, choose payment method, finish sale.
- Surface daily revenue, number of sales, average sale value, refunds/cancellations where available, and top products/services.
- Improve empty states, confirmation feedback, loading states, and error recovery.
- Keep enterprise-only functionality gated by the existing plan system.

### 4. Product language audit

- Replace unexplained acronyms, developer terminology, abbreviated labels, and clipped copy.
- Use formal but natural Portuguese that a first-time barber can understand.
- Prefer full labels over internal names.
- Keep terminology consistent across navigation, forms, notifications, confirmations, tables, and errors.
- Preserve technical identifiers only where they are genuinely required by an admin/developer tool.

### 5. Sales UX/UI upgrade

- Rework cards, totals, payment selection, product selection, and confirmation surfaces.
- Add useful shortcuts such as recent services/products, quick repeat sale, and customer lookup where the existing data model supports them.
- Keep touch targets large and the flow efficient on mobile.
- Use visual hierarchy to reduce time-to-complete for routine sales.

### 6. Global UX/UI pass

- Standardize spacing, typography, card hierarchy, buttons, dialogs, states, and responsive breakpoints.
- Prefer mobile-first layouts and progressively enhance for desktop.
- Keep accessibility states visible: keyboard focus, readable contrast, labels, status announcements, and sensible tab order.
- Reduce duplicated visual patterns and inconsistent interaction behaviour.

### 7. Agenda

- Align the agenda implementation with the existing skeleton reference.
- Preserve current booking/business rules while improving information density, scanning, navigation, and mobile operation.
- Keep client details, service, professional, status, and payment context immediately accessible.

### 8. Dashboard animated tabs

- Add subtle animated transitions to dashboard tabs where they improve orientation.
- Avoid animation that delays interaction or harms accessibility.
- Respect reduced-motion preferences.

### 9. Communication

- Keep messaging functionality grouped under the Comunicação area.
- Avoid scattering communication workflows across unrelated navigation sections.
- Make the information architecture explicit for campaigns, birthdays, templates, and message history.

### 10. Final production QA

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm qa:api`
- `pnpm qa:plans`
- `pnpm qa:security`
- `pnpm qa:env`
- `pnpm qa:deps`
- `pnpm qa:smoke`
- `pnpm format:check`
- Manual mobile/desktop smoke test for: public shop, booking, login/register, plans, checkout, billing, dashboard, agenda, sales, loyalty, communication, settings, analytics, and admin-only routes.

## Definition of done

A feature is only considered complete when:

1. It works with real production data and existing plan entitlements.
2. It has loading, empty, success, and error states.
3. It works on small mobile screens before desktop enhancement.
4. User-facing text is understandable without technical knowledge.
5. Existing flows and permissions remain intact.
6. Relevant automated checks pass, or any known limitation is documented.

## First implementation block

Start with the settings save architecture because it reduces duplicated persistence logic and creates a cleaner interaction pattern for the rest of the dashboard.
