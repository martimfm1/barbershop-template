# Changelog

## Unreleased — 2026-08-15

### Pro trial eligibility

- O trial de 14 dias do Barbers Pro fica agora reservado a utilizadores que nunca tiveram uma subscrição registada.
- A elegibilidade é validada server-side através do histórico de `subscriptions`, impedindo que uma conta antiga recupere o trial apenas por estar atualmente no Free.
- A Checkout Session regista `offer` como `pro_trial` apenas para utilizadores elegíveis e `pro_standard` para contas existentes sem trial disponível.
- O Enterprise e restantes planos não recebem este trial automaticamente.

### Stripe promotion codes

- Adicionado campo de código promocional no cartão Barbers Pro antes do checkout.
- Códigos promocionais são aceites apenas como texto fornecido pelo utilizador e limitados server-side a 100 caracteres.
- A API de checkout valida o código diretamente na Stripe através dos Promotion Codes ativos.
- Promotion Codes válidos são aplicados diretamente à Checkout Session; o browser não decide o desconto nem o identificador interno do Promotion Code.
- Quando nenhum código é fornecido, o checkout continua a disponibilizar o campo nativo de códigos promocionais da Stripe.
- O Promotion Code utilizado é registado apenas em metadata técnica da Checkout Session/subscrição para diagnóstico, sem expor dados sensíveis.

### Fidelização, automações, campanhas e analytics — production hardening

- Transformada `/dashboard/loyalty` numa área de configuração real: ativação do programa, pontos por euro, pontos de boas-vindas e referências.
- Adicionada gestão tenant-scoped de recompensas com criação, edição e eliminação através de APIs server-side.
- Adicionadas validações de custos, tipos e valores de recompensa para impedir configurações inválidas.
- Tornada `/dashboard/automations` editável: regras passam a suportar edição, ativação/desativação, remoção e uma ação real de email ou SMS configurada por regra.
- Adicionado worker diário `/api/cron/automations` para executar regras `client_inactive`, guardar `automation_runs` e evitar duplicações por cliente/dia.
- Adicionado dispatcher server-side `dispatchAppointmentAutomations()` para processar regras orientadas a eventos de booking com idempotência por appointment/regra e envio de email via Brevo.
- Ligado o dispatcher a `booking_created` na criação pública de bookings e a confirmações manuais da dashboard.
- Ligado o dispatcher a `booking_completed` quando um atendimento é concluído.
- Ligado o dispatcher a `booking_cancelled` quando o cliente cancela pelo customer portal.
- Os dispatches de automação são assíncronos e nunca bloqueiam o sucesso da operação principal.
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
