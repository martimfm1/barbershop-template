# Changelog

## Unreleased — 2026-08-15

### Customer Booking Portal — manual appointments

- O `/my-bookings` passa a reconhecer marcações criadas manualmente na dashboard quando estão ligadas a um cliente cujo email corresponde ao email verificado do portal.
- Novas marcações manuais criadas na dashboard passam a copiar o email do cliente para `appointments.manual_email`, mantendo compatibilidade com o modelo `client_id` existente.
- Marcações antigas que não tenham `manual_email` continuam a ser encontradas através do `client_id` e do email do cliente.
- Cancelar e reagendar já não dependem de `manual_email` estar preenchido; a autorização é determinada pelo email verificado e pela relação `client_id`.
- Corrigido o cálculo de disponibilidade do reagendamento para não fazer comparação SQL direta com `professional_id = null`, evitando `APPOINTMENT_LOOKUP_FAILED` em marcações sem profissional associado.
- A disponibilidade passa a carregar as marcações do tenant para o dia e filtra o profissional em server-side, mantendo os conflitos corretos para profissionais com ou sem associação.

### Customer Booking Portal — production hardening

- O acesso a `/my-bookings` continua sem exigir conta: o cliente confirma o email através de um código de utilização única.
- Pedidos de códigos são limitados por email + IP através do rate limiter distribuído existente.
- As tentativas de confirmação são limitadas por email + IP e o consumo do código passou a ser atómico na base de dados, evitando corridas entre tentativas simultâneas.
- Códigos continuam armazenados apenas como hash e expiram automaticamente.
- A sessão do portal usa token aleatório armazenado como hash e cookie `httpOnly`.
- A listagem de marcações usa comparação exata do email normalizado em vez de `ILIKE`, evitando que caracteres wildcard possam expandir a consulta.
- A listagem continua isolada do restante SaaS: uma sessão do portal só pode consultar marcações associadas ao email verificado.
- Cancelamentos validam estado, janela mínima configurada pela barbearia e identidade da marcação; alterações concorrentes devolvem `409` em vez de aparentarem sucesso.
- Reagendamentos passam a validar novamente server-side o estado, janela mínima, dia de folga, horário de funcionamento, pausa, `schedule_blocks`, duração do serviço e conflitos existentes.
- Conflitos de corrida de atualização continuam a ser tratados como conflito de disponibilidade.
- Adicionado endpoint de disponibilidade para o reagendamento, permitindo mostrar apenas horários realmente elegíveis no portal.
- A disponibilidade do reagendamento considera o barbeiro atualmente associado à marcação.
- A UI deixou de usar `prompt()` para reagendamento e passou a usar calendário + grelha de horários responsiva.
- A UI mobile do portal apresenta estados de carregamento, estados vazios, bloqueios, dias de folga e mensagens de erro de forma contextual.
- O portal mostra claramente que o mesmo email pode ser usado em várias reservas e agrega essas marcações num único acesso.
- O histórico mantém marcações concluídas/canceladas sem permitir ações indevidas sobre elas.

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
- Adicionada migration `20260815003000_harden_customer_booking_portal.sql` para tornar a verificação do código do portal atómica.
