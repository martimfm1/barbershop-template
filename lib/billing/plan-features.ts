export type PaidPlan = "pro" | "enterprise";

export const PLAN_FEATURES: Record<PaidPlan, readonly string[]> = {
  pro: [
    "Até 10 profissionais",
    "Agendamentos e clientes ilimitados",
    "Gestão de serviços e horários",
    "Página de reservas online",
    "Gestão de equipa e comissões",
    "Notificações e automações WhatsApp",
    "Análises essenciais do negócio",
    "Suporte prioritário",
  ],
  enterprise: [
    "Profissionais ilimitados",
    "Tudo incluído no Barbers Pro",
    "Relatórios e análises avançadas",
    "Exportação de dados",
    "Gestão de várias localizações",
    "Acesso antecipado a novas funcionalidades",
    "Suporte dedicado prioritário",
  ],
};

export const PLAN_DESCRIPTIONS: Record<PaidPlan, string> = {
  pro: "Para equipas em crescimento.",
  enterprise: "Para operações com maior escala.",
};
