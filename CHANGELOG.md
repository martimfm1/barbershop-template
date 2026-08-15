# Changelog

## Unreleased — 2026-08-15

### Fidelização, automações, campanhas e analytics — production hardening

- Transformada `/dashboard/loyalty` numa área de configuração real: ativação do programa, pontos por euro, pontos de boas-vindas e referências.
- Adicionada gestão tenant-scoped de recompensas com criação, edição e eliminação através de APIs server-side.
- Adicionadas validações de custos, tipos e valores de recompensa para impedir configurações inválidas.
- Tornada `/dashboard/automations` editável: regras passam a suportar edição, ativação/desativação, remoção e uma ação real de email ou SMS configurada por regra.
- Adicionado worker diário `/api/cron/automations` para executar regras `client_inactive`, guardar `automation_runs` e evitar duplicações por cliente/dia.
- Agendado o worker de automações no Vercel.
- Endurecida a API de campanhas com validação de datas, atualização/cancelamento/eliminação e respostas de erro com logging server-side.
- Corrigido o caminho de resolução de billing tenant-scoped para não depender da inexistente coluna `subscriptions.barbershop_id`; a subscrição é resolvida através do owner da barbearia.
- O plano administrativo da barbearia passa a ser utilizado pelo mesmo resolver de entitlements usado pelos módulos de campanhas, automações, fidelização e analytics.
- Adicionado `/api/analytics/export` para exportar marcações e clientes em CSV; POS fica disponível no Enterprise.
- Expandida a página `/dashboard/analytics` com secção de downloads operacionais para contabilidade, CRM e análise externa.
- Ajustado o switch de `/dashboard/mensagens/birthdays` para um controlo responsivo, acessível e isolado visualmente de estilos globais.

### Internal administration — API reliability fixes

- Corrigido o endpoint `/api/silentra-admin/shop`: removidas colunas opcionais/instáveis do `select` que podiam provocar `PGRST204` e bloquear todo o snapshot do tenant.
- O snapshot passa a selecionar apenas as colunas estáveis necessárias para a administração.
- Subscrições do tenant passam a ser lidas de forma determinística pela mais recentemente atualizada, evitando falhas de `maybeSingle()` quando existem múltiplos registos históricos.
- O cálculo do plano efetivo no snapshot passa a ignorar overrides administrativos expirados e a indicar corretamente a origem (`admin`, `subscription_override`, `stripe` ou `free`).
- Corrigida a API de atribuição de planos com validação UUID, expiração futura, `Cache-Control: no-store` e tratamento de audit logs sem transformar uma mutação bem sucedida num falso erro HTTP.
- O endpoint de remoção de plano valida a existência do tenant antes de chamar o RPC.
- Adicionado `/api/silentra-admin/diagnostics`, protegido por `requirePlatformAdmin()`, para validar tabelas críticas, appointments, subscriptions, assignments e o RPC de resolução de plano diretamente a partir do Control Center.

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
