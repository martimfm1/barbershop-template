# Changelog

## Unreleased — 2026-08-15

### Production hardening — booking concurrency and Stripe webhook claims

- A proteção final de overlap de appointments passa a tratar também marcações sem `professional_id` como uma lane de disponibilidade por barbearia, evitando dois bookings não atribuídos no mesmo intervalo.
- A constraint PostgreSQL continua a ser a autoridade final para conflitos concorrentes; a API já converte `23P01` em HTTP `409`.
- Adicionado estado de claim atómico para webhooks Stripe com estados `processing`, `processed` e `failed`.
- Webhooks concorrentes para o mesmo `event_id` deixam de poder processar o evento simultaneamente.
- Claims presos recuperam automaticamente após um lease curto, permitindo retry depois de um crash do worker.
- Falhas de processamento ficam registadas no ledger para observabilidade e retry.
- Mantida a validação de assinatura Stripe antes de tocar no ledger.
- Estas alterações requerem `supabase db push --include-all` antes de produção e ainda precisam de evidência em staging.

### Public pages — mobile-first UI/UX harmonization

- Reestruturado `/barbershops` com uma hierarquia visual orientada à descoberta: proposta de valor, pesquisa, localização, filtros, tags, resultados e mapa.
- Melhorada a experiência mobile do diretório com filtros horizontais, touch targets consistentes, estados de loading/empty e resultados em grelha responsiva.
- Mantida a ligação direta entre cards, página pública da barbearia e booking drawer.
- Reestruturado `/plans` com uma introdução orientada à decisão, pricing, comparação completa, FAQ e CTA final.
- A comunicação de planos passa a reforçar explicitamente que o entitlement pertence à barbearia e é partilhado pela equipa.
- Reestruturado `/my-bookings` com fluxo mobile-first de email → código → marcações, cartões de reservas, histórico, cancelamento e reagendamento com disponibilidade real.
- O reagendamento deixou de depender de `prompt()` e usa uma interface responsiva de data + horários disponíveis.
- As três páginas passam a partilhar a mesma linguagem visual da homepage: tipografia, contraste, espaçamento, bordas, superfícies e CTAs.
- Priorizada a leitura rápida em mobile e a expansão progressiva de conteúdo em tablet/desktop.

### Landing page — conversion-focused redesign

- Reestruturada a homepage `/` como uma página de produto orientada à conversão, em vez de uma sequência de demos isoladas.
- Criado um hero com posicionamento imediato do Silentra para barbearias, proposta de valor clara e CTAs distintos para proprietários e clientes.
- Adicionada demonstração visual do fluxo de reserva com serviço, duração, preço, disponibilidade e confirmação.
- Criada uma camada de benefícios segmentada para cliente, equipa e negócio, reduzindo a necessidade de explicar o produto apenas através de funcionalidades.
- Adicionada grelha de capacidades cobrindo agenda, equipa e permissões, QR/página pública, fidelização, campanhas/automação e estatísticas.
- Adicionado percurso de onboarding em três passos: configurar, partilhar e centralizar a operação.
- Reorganizada a apresentação dos planos Free, Pro e Enterprise com posicionamento por estágio do negócio e CTAs apropriadas.
- Adicionado CTA final com dois caminhos: começar uma barbearia ou gerir uma marcação existente por email.
- Removidas métricas e afirmações numéricas demonstrativas que podiam ser confundidas com resultados reais do produto.
- Garantida adaptação responsiva para mobile, tablet e desktop, com touch targets e hierarquia de conteúdo consistentes.
- Mantido o sistema de navegação e footer existentes para preservar os fluxos públicos atuais.

### Customer Booking Portal — production hardening

- O acesso a `/my-bookings` continua sem exigir conta: o cliente confirma o email através de um código de utilização única.
- Pedidos de códigos são limitados por email + IP através do rate limiter distribuído existente.
- As tentativas de confirmação são limitadas por email + IP e o consumo do código passou a ser atómico na base de dados, evitando corridas entre tentativas simultâneas.
- Códigos continuam armazenados apenas como hash e expiram automaticamente.
- A sessão do portal usa token aleatório armazenado como hash e cookie `httpOnly`.
- A listagem de marcações usa comparação exata do email normalizado em vez de `ILIKE`, evitando que caracteres wildcard possam expandir a consulta.
- A listagem continua isolada do restante SaaS: uma sessão do portal só pode consultar marcações associadas ao email verificado.
- O portal reconhece tanto `manual_email` como clientes ligados via `client_id`, permitindo incluir marcações criadas manualmente na dashboard.
- Novos bookings manuais sincronizam o email do cliente para `manual_email` quando disponível.
- Cancelamentos validam estado, janela mínima configurada pela barbearia e identidade da marcação; alterações concorrentes devolvem `409` em vez de aparentarem sucesso.
- Reagendamentos passam a validar novamente server-side o estado, janela mínima, dia de folga, horário de funcionamento, pausa, `schedule_blocks`, duração do serviço e conflitos existentes.
- Conflitos de corrida de atualização continuam a ser tratados como conflito de disponibilidade.
- Adicionado endpoint de disponibilidade para o reagendamento, permitindo mostrar apenas horários realmente elegíveis no portal.
- A disponibilidade do reagendamento considera o barbeiro atualmente associado à marcação e suporta marcações sem profissional específico.
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
