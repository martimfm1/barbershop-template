# Changelog

## Unreleased — 2026-08-15

### Internal administration — route compatibility fix

- Corrigido o routing do Control Center interno: pastas App Router com prefixo `_` são tratadas pelo Next.js como private folders e não são expostas como rotas HTTP.
- Adicionada uma rota pública não indexável `/silentra-admin`, mantendo a autorização exclusiva do platform admin no servidor.
- Mantida a compatibilidade com `/_silentra-admin` através de rewrite interno para a rota funcional.
- Adicionados endpoints HTTP funcionais em `/api/silentra-admin/*` e rewrite de compatibilidade para `/api/_silentra-admin/*`.
- A autorização continua a ser validada em cada request por `requirePlatformAdmin()` e continua baseada em `SILENTRA_PLATFORM_ADMIN_USER_ID` e/ou `SILENTRA_PLATFORM_ADMIN_EMAIL`.

### Production hardening — booking concurrency and Stripe webhook claims

- A proteção final de overlap de appointments passa a tratar também marcações sem `professional_id` como uma lane de disponibilidade por barbearia, evitando dois bookings não atribuídos no mesmo intervalo.
- A constraint PostgreSQL continua a ser a autoridade final para conflitos concorrentes; a API já converte `23P01` em HTTP `409`.
- Adicionado estado de claim atómico para webhooks Stripe com estados `processing`, `processed` e `failed`.
- Webhooks concorrentes para o mesmo `event_id` deixam de poder processar o evento simultaneamente.
- Claims presos recuperam automaticamente após um lease curto, permitindo retry depois de um crash do worker.
- Falhas de processamento ficam registadas no ledger para observabilidade e retry.
- Mantida a validação de assinatura Stripe antes de tocar no ledger.
- Estas alterações requerem `supabase db push --include-all` antes de produção e ainda precisam de evidência em staging.

