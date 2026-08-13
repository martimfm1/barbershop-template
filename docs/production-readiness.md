# Silentra for Barbers — Production Readiness

## P0 — Blockers

- [ ] Alinhar `package.json` com `pnpm-lock.yaml`: `pino` deve permanecer em `^10.3.1`.
- [ ] Confirmar `pnpm install --frozen-lockfile`.
- [ ] Confirmar `pnpm typecheck`.
- [ ] Confirmar `pnpm lint`.
- [ ] Confirmar `pnpm build`.
- [ ] Confirmar `pnpm qa`.
- [ ] Validar migrations do Supabase em staging antes de produção.
- [ ] Validar variáveis de ambiente obrigatórias por ambiente.

## P1 — Segurança e dados

- [ ] Teste de isolamento multi-tenant A → A permitido / A → B recusado.
- [ ] Auditar todas as funções `SECURITY DEFINER`.
- [ ] Testar Free/Pro/Enterprise na API e database.
- [ ] Testar quota Free de 1 profissional sob concorrência.
- [ ] Validar Storage por tenant e conversão de avatar para WebP.
- [ ] Rate limiting dos endpoints públicos e de mensagens.
- [ ] Error tracking e logs estruturados sem secrets.

## P1 — Billing

- [ ] Upgrade Free → Pro.
- [ ] Upgrade Pro → Enterprise.
- [ ] Cancelamento e fim do período.
- [ ] Falhas de pagamento.
- [ ] Webhook idempotente.
- [ ] Price ID → entitlement server-side.

## P1 — Booking / CRM

- [ ] Criar marcação pública.
- [ ] Impedir double booking concorrente.
- [ ] Confirmar marcação.
- [ ] Concluir serviço.
- [ ] Adicionar cliente à CRM.
- [ ] Reutilizar cliente existente por telefone.
- [ ] Impedir acesso cross-tenant.

## P2 — Comunicação

- [ ] Confirmar templates com `{{nome}}`, `{{barbearia}}` e `{{booking_url}}`.
- [ ] Validar avatar nos emails.
- [ ] Testar aniversário, confirmação, cancelamento e mensagem manual.
- [ ] Validar domínio/sender da Brevo.

## P2 — Plataforma

- [ ] Staging separado de produção.
- [ ] Backups e recuperação testados.
- [ ] Health checks.
- [ ] Monitoring e alertas.
- [ ] Security headers auditados.
- [ ] `allowedDevOrigins` limitado ao desenvolvimento.
- [ ] Performance e Core Web Vitals.
- [ ] Mobile e acessibilidade.
- [ ] SEO / sitemap / canonical / metadata.

## Release gate

O Silentra só deve ser marcado como **Production Ready** quando os P0 e P1 estiverem concluídos e os fluxos críticos E2E tiverem passado em staging.
