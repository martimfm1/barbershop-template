# Changelog

## Unreleased — 2026-08-15

### Checkout promotion code UX

- Removido o campo de Promotion Code dos `PricingCard` para manter a página de preços limpa.
- Os códigos promocionais passam a ser introduzidos no checkout da Stripe, através do campo nativo de Promotion Codes.
- A API continua a validar e aplicar Promotion Codes server-side quando fornecidos.
- O checkout mantém `allow_promotion_codes` quando não existe um código pré-selecionado, permitindo utilizar qualquer Promotion Code elegível da Stripe.

### Billing promotions and Pro trial

- O trial de 14 dias do Barbers Pro fica disponível para todos os novos utilizadores elegíveis.
- A elegibilidade do trial é validada server-side através do histórico de `subscriptions`; contas que já tiveram uma subscrição não recuperam o trial por regressarem ao Free.
- A regra de trial é aplicada tanto no Checkout Session como no fluxo direto de criação de subscrição, evitando caminhos alternativos sem trial ou com trial indevido.
- O Enterprise e restantes planos não recebem automaticamente o trial de Pro.
- Os campos de Promotion Code passam a estar preparados para qualquer plano pago, não apenas o Pro.
- Promotion Codes são validados diretamente na Stripe e aplicados server-side à compra; o browser nunca escolhe o ID interno do desconto.
- O fluxo direto de criação de subscrição também aceita Promotion Codes.
- A entrada promocional na página de preços foi removida; a aplicação do código fica concentrada no checkout.

### Pro trial eligibility

- A Checkout Session regista `offer` como `pro_trial` apenas para utilizadores elegíveis e `pro_standard` para contas existentes sem trial disponível.

### Stripe promotion codes

- O campo de código promocional é apresentado no checkout da Stripe em vez do cartão de preços.
- O Promotion Code utilizado é registado apenas em metadata técnica da Checkout Session/subscrição para diagnóstico.

### Fidelização, automações, campanhas e analytics — production hardening

- Transformada `/dashboard/loyalty` numa área de configuração real: ativação do programa, pontos por euro, pontos de boas-vindas e referências.
- Adicionada gestão tenant-scoped de recompensas com criação, edição e eliminação através de APIs server-side.
- Adicionadas validações de custos, tipos e valores de recompensa para impedir configurações inválidas.
- Tornada `/dashboard/automations` editável: regras passam a suportar edição, ativação/desativação, remoção e uma ação real de email ou SMS configurada por regra.
- Adicionado worker diário `/api/cron/automations` para executar regras `client_inactive`, guardar `automation_runs` e evitar duplicações por cliente/dia.
- Adicionado dispatcher server-side `dispatchAppointmentAutomations()` para processar regras orientadas a eventos de booking com idempotência por appointment/regra e envio de email via Brevo.
- Ligado o dispatcher a `booking_created` na criação pública de bookings e a confirmações manuais da dashboard.
- Ligado o dispatcher a `booking_completed` quando um atendimento é concluído.