# Silentra for Barbers — Staging Go-Live Runbook

Este documento é o gate operacional antes de promover `production-hardening` para `main` e produção.

## 1. Database

- [ ] Aplicar todas as migrations numa base de staging limpa.
- [ ] Confirmar `20260813180000_stripe_webhook_idempotency.sql` aplicada.
- [ ] Confirmar a migration de rate limiting aplicada.
- [ ] Executar Security Advisor e corrigir findings críticos/altos.
- [ ] Confirmar RLS activo nas tabelas privadas.

## 2. Tenant isolation

Criar duas barbearias independentes, A e B.

- [ ] A vê A.
- [ ] B vê B.
- [ ] A não lê B.
- [ ] A não altera B.
- [ ] A não elimina B.
- [ ] Storage A não atravessa para B.
- [ ] Billing A não atravessa para B.
- [ ] Analytics A não atravessa para B.

## 3. Plan quotas

### Free

- [ ] Criar o primeiro barbeiro.
- [ ] Segundo barbeiro rejeitado.
- [ ] Dois pedidos simultâneos não ultrapassam o limite.
- [ ] Features Pro continuam protegidas no backend.

### Pro

- [ ] Quota correcta.
- [ ] Birthday automation.
- [ ] CRM/analytics Pro.

### Enterprise

- [ ] Limites e features correctos.

## 4. Booking

- [ ] Booking público sem sessão.
- [ ] Serviço pertence à barbearia correcta.
- [ ] Profissional pertence à barbearia correcta.
- [ ] Dois barbeiros diferentes podem usar o mesmo horário.
- [ ] Dois pedidos concorrentes para o mesmo barbeiro/slot: um `201`, um `409`.
- [ ] Cliente é persistido com nome, telefone, email e data de nascimento.
- [ ] Email de confirmação chega.
- [ ] Concluir marcação funciona.
- [ ] Adicionar cliente a partir da marcação concluída não duplica por telefone.

## 5. Public booking abuse

- [ ] Rate limit devolve `429` depois do limite.
- [ ] Bucket é tenant + IP hash.
- [ ] Nenhum IP bruto fica persistido.
- [ ] Expiração do bucket funciona.

## 6. Stripe

Usar Stripe Test Mode em staging.

- [ ] Checkout Pro.
- [ ] Checkout Enterprise.
- [ ] Trial.
- [ ] Upgrade.
- [ ] Downgrade.
- [ ] Cancelamento no fim do período.
- [ ] Falha de pagamento.
- [ ] Webhook com assinatura inválida rejeitado.
- [ ] Mesmo `event_id` enviado duas vezes só é processado uma vez.
- [ ] Subscription e entitlements continuam consistentes.
- [ ] Invoices visíveis.

## 7. Reviews — BLOCKER

O fluxo actual envia o cliente para a página pública da barbearia, mas não existe ainda uma prova server-side da marcação antes da criação da review.

**Não promover para produção pública enquanto a criação de reviews não estiver ligada a uma marcação válida/token de review.**

## 8. Email

- [ ] Brevo sender verificado.
- [ ] SPF.
- [ ] DKIM.
- [ ] DMARC.
- [ ] Booking confirmation.
- [ ] Review request.
- [ ] Birthday automation.
- [ ] Templates usam dados reais.
- [ ] Avatar correcto.
- [ ] Links HTTPS correctos.

## 9. Storage

- [ ] PNG/JPG/JPEG/WebP convertidos para WebP.
- [ ] MIME `image/webp`.
- [ ] Upload inválido rejeitado.
- [ ] Limite de tamanho aplicado.
- [ ] Paths tenant-scoped.
- [ ] A não consegue aceder ao avatar de B.

## 10. Auth / sessions

- [ ] Register.
- [ ] Login.
- [ ] Logout.
- [ ] Session refresh.
- [ ] Expired session.
- [ ] Forgot password.
- [ ] Protected routes.
- [ ] Sem loops de redirect.

## 11. Production configuration

- [ ] Production environment variables configuradas.
- [ ] Stripe Live keys só em Production.
- [ ] Stripe Test keys só em Staging.
- [ ] Supabase staging/prod separados.
- [ ] Brevo configurado para o domínio de produção.
- [ ] Domínio e HTTPS.
- [ ] `NEXT_PUBLIC_APP_URL` correcto.
- [ ] Nenhum secret no cliente.

## 12. Fiscal / Legal

- [ ] Terms of Service revistos.
- [ ] Privacy Policy revisto.
- [ ] DPA preparado.
- [ ] Subprocessors documentados.
- [ ] Retention/deletion definidos.
- [ ] Export/delete account testados.
- [ ] NIF/VAT/B2B/B2C definidos com contabilista.
- [ ] Stripe Tax ou tratamento fiscal equivalente configurado.

## 13. Backup / recovery

- [ ] Backups activos.
- [ ] PITR adequado ao risco.
- [ ] Restore executado em ambiente de teste.
- [ ] RPO documentado.
- [ ] RTO documentado.

## 14. Observability

- [ ] `/api/health` responde 200.
- [ ] Error tracking.
- [ ] 5xx alerts.
- [ ] Stripe webhook alerts.
- [ ] Email failure alerts.
- [ ] Booking failure alerts.
- [ ] Database alerts.

## 15. Release gate

Promover para produção apenas quando todos os itens seguintes estiverem verificados:

```text
P0  ✅ build / typecheck / lint / CI
P0  ✅ booking concurrency
P0  ✅ Stripe webhook verification + idempotency
P0  ✅ environment / health
P1  ✅ tenant isolation
P1  ✅ quotas
P1  ✅ rate limiting
P1  ❌ reviews anti-abuse
P1  ⏳ backups / restore evidence
P1  ⏳ fiscal / GDPR evidence
```

### Regra final

`main` só deve receber esta branch quando o bloco de reviews deixar de estar `❌` e os itens `⏳` tiverem evidência de execução em staging.
