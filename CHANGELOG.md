# Changelog

## Unreleased — 2026-08-15

### API production hardening

- A criação pública e manual de appointments passa a usar `create_booking_atomic`, com lock transacional por barbearia e verificação final de conflitos dentro da mesma transação.
- Bookings com profissional específico passam a respeitar também bookings globais (`professional_id = null`), evitando sobreposição sem profissional e por profissional.
- A API pública de bookings mantém rate limit, validação de serviço/profissional e bloqueios de agenda antes da operação atómica.
- A API de appointments da dashboard passa a usar o mesmo caminho atómico e devolve `409` para conflitos de concorrência.
- A API de CRM clients passa a usar `requireModuleContext` e respeita a permissão canónica `clients` da equipa.
- A API de mensagens passa a usar `requireModuleContext` e respeita a permissão canónica `messages`.
- O envio de email manual passa a utilizar `BREVO_FROM_EMAIL` e `BREVO_FROM_NAME`, alinhado com o ambiente de produção documentado.
- Adicionado `scripts/qa/api-audit.mjs` e `qa:api` ao quality gate para detetar handlers privados sem um guard server-side reconhecível.

### Internal administration — production control center

- Evoluído o painel interno para um Control Center orientado a operações de produção, mantendo-o fora da navegação pública e protegido por `requirePlatformAdmin()`.
- Adicionado snapshot operacional por tenant com owner, membros, appointments do dia, próximos appointments, concluídos e cancelados.
- Adicionados atalhos para abrir a página pública da barbearia e copiar o UUID do tenant.
- Gestão de plano administrativo passa a mostrar plano efetivo, origem do entitlement, motivo e expiração do override.
- Adicionadas confirmações antes de remover um override de plano.
- Adicionado search operacional por nome, slug ou UUID.
- Adicionado health check com status HTTP e latência.
- Melhorada a leitura mobile com navegação por tabs horizontal e cartões responsivos.
- Separada a UI de produção do componente legado do painel interno para reduzir risco de manutenção.
- Adicionado endpoint interno de snapshot `/api/silentra-admin/shop`, protegido server-side e sem exposição de secrets.

### Internal administration — route compatibility fix

- Corrigido o routing do Control Center interno: pastas App Router com prefixo `_` são tratadas pelo Next.js como private folders e não são expostas como rotas HTTP.
- Adicionada uma rota pública não indexável `/silentra-admin`, mantendo a autorização exclusiva do platform admin no servidor.
- Mantida a compatibilidade com `/_silentra-admin` através de rewrite interno para a rota funcional.
- Adicionados endpoints HTTP funcionais em `/api/silentra-admin/*` e rewrite de compatibilidade para `/api/_silentra-admin/*`.
- A autorização continua a ser validada em cada request por `requirePlatformAdmin()` e continua baseada em `SILENTRA_PLATFORM_ADMIN_USER_ID` e/ou `SILENTRA_PLATFORM_ADMIN_EMAIL`.

### Production hardening — booking concurrency and Stripe webhook claims

- A proteção final de overlap de appointments passa a tratar também marcações sem `professional_id` como uma lane de disponibilidade por barbearia.
- A constraint PostgreSQL continua a ser a autoridade final para conflitos concorrentes; a API converte conflitos de overlap em HTTP `409`.
- Adicionado estado de claim atómico para webhooks Stripe com estados `processing`, `processed` e `failed`.
- Webhooks concorrentes para o mesmo `event_id` deixam de poder processar o evento simultaneamente.
- Claims presos recuperam automaticamente após um lease curto, permitindo retry depois de um crash do worker.
- Falhas de processamento ficam registadas no ledger para observabilidade e retry.
