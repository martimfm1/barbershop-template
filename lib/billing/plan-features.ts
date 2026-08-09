import { PLANS, type BillingPlan } from "@/lib/stripe/constants";

/** Typed product feature keys used by the entitlement system. */
export type FreeFeatureKey =
  | "agenda"
  | "appointments"
  | "clients"
  | "services"
  | "online_booking"
  | "booking_page"
  | "qr_booking"
  | "basic_dashboard"
  | "basic_revenue"
  | "basic_client_history"
  | "basic_notifications";

export type ProFeatureKey =
  | "advanced_crm"
  | "advanced_analytics"
  | "automated_reminders"
  | "automated_followups"
  | "marketing_campaigns"
  | "customer_segments"
  | "loyalty"
  | "advanced_reports"
  | "ai_assistant"
  | "team_management"
  | "advanced_notifications";

export type EnterpriseFeatureKey =
  | "multi_location"
  | "global_dashboard"
  | "advanced_permissions"
  | "commissions"
  | "inventory"
  | "pos"
  | "api_access"
  | "advanced_ai"
  | "enterprise_reports";

/** Legacy keys retained until existing callers are migrated. */
export type LegacyFeatureKey = "professionals" | "analytics";

export type FeatureKey =
  | FreeFeatureKey
  | ProFeatureKey
  | EnterpriseFeatureKey
  | LegacyFeatureKey;

const FREE_FEATURES: readonly FeatureKey[] = [
  "agenda",
  "appointments",
  "clients",
  "services",
  "online_booking",
  "booking_page",
  "qr_booking",
  "basic_dashboard",
  "basic_revenue",
  "basic_client_history",
  "basic_notifications",
];

const PRO_FEATURES: readonly FeatureKey[] = [
  ...FREE_FEATURES,
  "advanced_crm",
  "advanced_analytics",
  "automated_reminders",
  "automated_followups",
  "marketing_campaigns",
  "customer_segments",
  "loyalty",
  "advanced_reports",
  "ai_assistant",
  "team_management",
  "advanced_notifications",
  "professionals",
  "analytics",
];

const ENTERPRISE_FEATURES: readonly FeatureKey[] = [
  ...PRO_FEATURES,
  "multi_location",
  "global_dashboard",
  "advanced_permissions",
  "commissions",
  "inventory",
  "pos",
  "api_access",
  "advanced_ai",
  "enterprise_reports",
];

export const PLAN_FEATURES: Record<BillingPlan, readonly FeatureKey[]> = {
  [PLANS.FREE]: FREE_FEATURES,
  [PLANS.PRO]: PRO_FEATURES,
  [PLANS.ENTERPRISE]: ENTERPRISE_FEATURES,
};

export const UNLIMITED = Infinity;

export interface PlanLimits {
  barbers: number;
  locations: number;
}

export type PlanLimitKey = keyof PlanLimits;

export const PLAN_LIMITS: Record<BillingPlan, PlanLimits> = {
  [PLANS.FREE]: { barbers: 1, locations: 1 },
  [PLANS.PRO]: { barbers: 5, locations: 1 },
  [PLANS.ENTERPRISE]: { barbers: UNLIMITED, locations: UNLIMITED },
};

export function getPlanLimit(plan: BillingPlan, limit: PlanLimitKey): number {
  return PLAN_LIMITS[plan][limit];
}

export function isUnlimited(value: number): boolean {
  return value === UNLIMITED;
}

export function getPlanFeatures(plan: BillingPlan): readonly FeatureKey[] {
  return PLAN_FEATURES[plan];
}

export function hasPlanFeature(plan: BillingPlan, feature: FeatureKey): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}

export const PLAN_DESCRIPTIONS: Record<BillingPlan, string> = {
  free: "Para uma barbearia pequena começar a gerir tudo gratuitamente.",
  pro: "Para equipas em crescimento.",
  enterprise: "Para operações com maior escala.",
};

export const PLAN_NAMES: Record<BillingPlan, string> = {
  free: "Barbers Free",
  pro: "Barbers Pro",
  enterprise: "Barbers Enterprise",
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  agenda: "Agenda completa",
  appointments: "Marcações ilimitadas",
  clients: "Clientes ilimitados",
  services: "Serviços ilimitados",
  online_booking: "Reservas online",
  booking_page: "Página de reservas",
  qr_booking: "Reservas por QR code",
  basic_dashboard: "Dashboard básico",
  basic_revenue: "Receita básica",
  basic_client_history: "Histórico do cliente",
  basic_notifications: "Notificações essenciais",
  advanced_crm: "CRM avançado",
  advanced_analytics: "Analytics avançado",
  automated_reminders: "Lembretes automáticos",
  automated_followups: "Follow-ups automáticos",
  marketing_campaigns: "Campanhas de marketing",
  customer_segments: "Segmentos de clientes",
  loyalty: "Programa de fidelização",
  advanced_reports: "Relatórios avançados",
  ai_assistant: "Assistente de IA",
  team_management: "Gestão de equipa",
  advanced_notifications: "Notificações avançadas",
  multi_location: "Multi-localização",
  global_dashboard: "Dashboard global",
  advanced_permissions: "Permissões avançadas",
  commissions: "Comissões",
  inventory: "Gestão de stock",
  pos: "Ponto de venda (POS)",
  api_access: "Acesso à API",
  advanced_ai: "IA avançada",
  enterprise_reports: "Relatórios empresariais",
  professionals: "Até 5 profissionais",
  analytics: "Análises essenciais do negócio",
};
