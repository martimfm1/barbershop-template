# Changelog

## Unreleased — 2026-08-15

### Billing trial notice

- Adicionado um aviso dedicado no `/dashboard/billing` para novos utilizadores elegíveis para os 14 dias grátis do Barbers Pro.
- A elegibilidade do aviso é resolvida server-side através de `/api/stripe/trial-eligibility`, usando a mesma regra aplicada ao checkout.
- O aviso desaparece automaticamente para contas que já possuem histórico de subscrição.
- O CTA do aviso encaminha para `/plans` sem duplicar a lógica de checkout no portal de faturação.

### Checkout promotion code UX

- Removido o campo de Promotion Code dos `PricingCard` para manter a página de preços limpa.
- Os códigos promocionais passam a ser introduzidos no checkout da Stripe, através do campo nativo de Promotion Codes.
