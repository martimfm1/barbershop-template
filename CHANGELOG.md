# Changelog

## v3.0.23 — 2026-08-10

### Changed
- Removed the dashboard sidebar navigation to simplify the dashboard layout.
- Removed the dashboard date from the top bar because the date is already available in the existing dashboard context.
- Kept the personalized greeting with the authenticated user's first name and the live clock in the top bar.

### Added
- Added an accessible "Voltar ao site" action in the dashboard top bar linking to `/`.
- The return action includes a keyboard-visible focus state and an accessible label.

## v3.0.22 — 2026-08-10

### Added
- Added a branded Silentra header to the dashboard sidebar.
- Added a personalized dashboard top bar with the user's first name, contextual Portuguese greeting, current date and live local clock.
- Added manual email messaging at `/dashboard/mensagens` with reusable templates and custom messages.
- Added secure server-side email delivery through the existing Brevo configuration.
- Added tenant-scoped recipient validation and audit logging for manual emails.

### Changed
- Manual messaging now uses the barbershop name as the Brevo sender name.
- Email templates support `{{nome}}` and `{{barbearia}}` placeholders.
- Improved the messaging UI with accessible controls, preview, validation and responsive layout.

### Disabled
- Manual SMS sending remains explicitly disabled until the SMS provider is activated.

### Security
- Manual email recipients are resolved server-side and must belong to the authenticated user's barbershop.
- The API never accepts a client-supplied barbershop ID for authorization.
- Email message HTML is escaped server-side before being sent.

## v3.0.21 — 2026-08-10

### Changed
- Redesigned the dashboard navigation for mobile-first use with a persistent bottom navigation for the most common sections.
- Added an accessible full-screen mobile navigation drawer for all dashboard sections.
- Improved dashboard navigation spacing, focus states, active states and touch targets.
- Added safe-area support for mobile devices with gesture/navigation areas.
- Added explicit locked-feature states with an upgrade action instead of navigating to unavailable modules.
- Added accessible labels and semantic navigation landmarks throughout the dashboard navigation.
- Reserved mobile viewport space for the fixed dashboard navigation to prevent content from being obscured.

### Accessibility
- Increased primary mobile navigation targets to at least 44px high.
- Added visible keyboard focus indicators.
- Added `aria-current`, `aria-expanded`, `aria-modal` and descriptive labels where applicable.
- Locked features now expose their unavailable state to assistive technologies.

## v3.0.20 — 2026-08-10

### Changed
- Moved dashboard cards into dedicated pages: `/dashboard/agenda`, `/dashboard/clientes`, `/dashboard/servicos`, `/dashboard/equipa`, `/dashboard/mensagens`.
- `/dashboard` is now an overview with quick actions, business KPIs, weekly chart and upcoming appointments.
- Updated `DashboardSidebar` with the new navigation entries.
