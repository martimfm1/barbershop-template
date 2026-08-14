# Changelog

## Unreleased — 2026-08-14

### Billing — tenant-scoped entitlements

- O plano efetivo deixou de ser resolvido pela subscrição individual do utilizador e passa a ser resolvido pela `barbershop_id`.
- `subscriptions.barbershop_id` foi adicionado e preenchido a partir da barbearia atual do owner.
- Mantido `subscriptions.user_id` como titular da relação Stripe/billing; este campo já não é a fonte de verdade para feature access.
- Criada uma constraint única por barbearia para impedir múltiplas subscrições de entitlement no mesmo tenant.
- Subscrições existentes são reconciliadas para a respetiva barbearia, preferindo o owner quando existem linhas duplicadas.
- O acesso efetivo de todos os membros da mesma barbearia passa a refletir o mesmo plano Free/Pro/Enterprise.
- `plan_override` continua a funcionar como override da subscrição da barbearia, em vez de conceder acesso apenas ao utilizador proprietário.
- O endpoint de subscrição passou a devolver o estado da subscrição da barbearia para qualquer membro autenticado do tenant.
- Checkout, criação, alteração, cancelamento e retoma da subscrição continuam exclusivos do owner.
- Added fallback para ligar automaticamente subscrições legadas sem `barbershop_id` à barbearia do owner.

### Team — permissions authoritative

- `barbershop_member_permissions` passa a ser a fonte canónica para permissões individuais.
- Removida a herança silenciosa de permissões por role na autorização de módulos: desligar uma permissão na aba **Membros e permissões** passa efetivamente a bloquear essa área no backend.
- `staff_permissions` fica apenas como fallback de compatibilidade para membros sem registo canónico.
- Expandido o mapa de permissões para Agenda, Clientes, Serviços, Equipa, Mensagens, Marketing, Fidelização, Automações, Estatísticas, QR, Definições e Faturação.
- A API da equipa passa a devolver todos os membros reais do tenant, incluindo a informação de entrada por código, em vez de filtrar apenas barbeiros convidados por código.
- A UI da equipa passou a mostrar as permissões correspondentes às áreas reais do SaaS e explica que o plano é da barbearia, enquanto os switches controlam acesso individual.
- Alterações de role continuam a sincronizar o profissional associado e a respeitar a quota do plano da barbearia.

### Professionals — tenant quotas

- As quotas de profissionais passaram a usar exclusivamente o plano da `barbershop_id`.
- Convites novos, promoção de membro para `barber`, criação de profissionais e triggers de base de dados usam a mesma quota tenant-scoped.
- O fluxo de reconciliação de barbeiros históricos continua a ignorar a quota durante o backfill, sem criar bypass para novos convites.
- Novos convites continuam sujeitos à quota Free/Pro/Enterprise.
- A quota passa a contar apenas profissionais ativos.

### Production migration hardening

- Adicionada migration `20260814235000_barbershop_billing_entitlements_and_team_permissions.sql` para migrar entitlements para o tenant e preencher permissões existentes.
- Harmonizada `20260904000000_team_barber_professional_sync.sql` para não reintroduzir lógica de plano por utilizador.

