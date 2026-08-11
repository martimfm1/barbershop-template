# Changelog

## Unreleased — 2026-08-11

### Fixed
- Corrigido o acesso à gestão de profissionais no plano Free.
- O plano Free pode adicionar o primeiro profissional e fica limitado a 1 profissional.
- A comissão do profissional no plano Free é aplicada server-side como 100% fixa.
- Corrigida a distinção entre permissões de equipa e quotas definidas pelo plano.
- Corrigido o fluxo de criação de profissionais para não depender de uma lista rígida de roles legados.
- Adicionados aliases compatíveis para permissões de gestão de equipa.
- Corrigido o acesso ao módulo Mensagens para membros autenticados da barbearia.
- Removida a dependência de uma lista rígida de roles no carregamento dos clientes usado pelo módulo Mensagens.
- Mantida a distinção entre autenticação, autorização e limite de plano.
- Adicionada uma opção para ocultar uma barbearia do diretório público `/barbearias`.
- O estado de visibilidade é validado no servidor do diretório e também ao abrir a página pública direta da barbearia.

### Email
- Adicionado o avatar/logótipo da própria barbearia aos emails de confirmação de agendamento.
- O avatar é carregado directamente do bucket público `avatar/{barbershopId}/avatar.webp`, usando a mesma imagem configurada nas definições da barbearia.
- O nome da barbearia continua a ser apresentado junto ao avatar.
- Emails sem `barbershopId` mantêm fallback sem avatar, preservando compatibilidade com integrações antigas.

### Security
- A gestão de profissionais continua a validar a identidade do utilizador e o `barbershop_id` no servidor.
- A criação de profissionais continua protegida por quota server-side e pelo RPC PostgreSQL com `pg_advisory_xact_lock`.
- O acesso a clientes e envio de mensagens continua limitado ao tenant autenticado.
- O plano Free não pode alterar a comissão do seu profissional através do frontend/API.
- Dados apresentados no HTML dos emails são escapados antes de serem inseridos no template.
- A preferência de visibilidade é armazenada por barbearia e não permite que um tenant altere a visibilidade de outro.

### Supabase
- Adicionada a migration `20260811040000_finalize_professional_management_authorization.sql` para consolidar a autorização da Equipa e as quotas Free/Pro/Enterprise.
- Adicionada a migration `20260811050000_add_barbershop_directory_visibility.sql` com `is_public_in_directory`, por defeito `true` para preservar as barbearias existentes.

### UI/UX
- Adicionado às Definições um controlo simples de visibilidade no diretório público.
- A opção indica claramente se a barbearia está visível ou oculta e mantém o link direto da barbearia disponível quando está oculta.

## v3.0.29 — 2026-08-10

### UI/UX
- Harmonized the dashboard visual language across clients, services, team, messaging, billing and public plans.
- Improved page headers, spacing, surfaces, hierarchy and responsive behavior for desktop, tablet and mobile.
- Added a shared dashboard UI safety layer to prevent horizontal overflow and improve touch targets.
- Improved mobile dialog sizing and internal scrolling for dashboard forms.
- Improved settings-page mobile behavior through shared responsive safeguards without changing its existing business logic.

### Messages
- Redesigned the manual email composer with clearer recipient, template, subject and message sections.
- Added a more realistic email preview with sender, recipient and subject context.
- Improved placeholder guidance for `{{nome}}` and `{{barbearia}}`.
- Kept manual SMS explicitly disabled while preserving the future integration surface.
- Added stronger client-side input limits and safer validation feedback while keeping server-side validation authoritative.

### Accessibility
- Increased interactive control targets to at least 44px in dashboard contexts.
- Added clearer labels and descriptions to edited fields and message controls.
- Added reduced-motion support for users who request it.
- Improved mobile dialog and form navigation.

### Security
- UI changes do not replace server-side authorization, tenant isolation or plan entitlement checks.
- Messaging continues to resolve and validate recipients server-side.

## v3.0.28 — 2026-08-10

### Performance
- Enabled Next.js package import optimization for frequently used client libraries (`lucide-react`, `@tabler/icons-react` and `date-fns`) to reduce unnecessary client bundle code.
- Kept Vercel Analytics and Speed Insights enabled globally so production Core Web Vitals and real-user performance data continue to be collected across the SaaS.

### Security
- Disabled the `X-Powered-By` response header to reduce framework fingerprinting.
- Added HSTS with subdomain coverage and preload eligibility.
- Added DNS prefetch control and cross-domain policy hardening headers.
- Preserved existing anti-clickjacking, MIME-sniffing, referrer and permissions policies.

### Audit
- Reviewed authentication, tenant scoping, Stripe webhook signature verification, service-role usage and manual email recipient validation.
- Confirmed the Stripe webhook verifies `stripe-signature` before processing events.
- Confirmed tenant-scoped APIs validate the authenticated user's `barbershop_id` before accessing protected barbershop data.

### Security follow-up
- Identified that the repository is currently pinned to Next.js `16.2.6`, while the July 2026 security release requires `16.2.11` or later. The dependency and lockfile upgrade is intentionally left as a separate change because the committed `pnpm-lock.yaml` must be regenerated with pnpm rather than edited manually.
- Identified `@whiskeysockets/baileys@7.0.0-rc13` as a release-candidate dependency. The currently documented critical message-spoofing advisory is patched in `7.0.0-rc12` and therefore does not target this version, but the project should move to a stable supported release when the WhatsApp integration permits it.

## v3.0.27 — 2026-08-10

### Fixed
- Added an explicit Supabase-managed billing plan override so support/admin staff can change a user's effective plan without changing Stripe data.
- Billing plan resolution now checks `subscriptions.plan_override` before Stripe/local plan resolution.
- Improved the subscription payment dialog for mobile and desktop with constrained viewport sizing, internal scrolling, larger touch targets, visible focus states, accessible loading/error states and clearer payment security messaging.

### Supabase
- Added `supabase/migrations/20260810130000_add_plan_override.sql`.
