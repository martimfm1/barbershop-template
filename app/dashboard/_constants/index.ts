import {
  LucideIcon,
  DollarSign,
  Calendar,
  Users,
  Scissors,
} from "lucide-react";

export type MetricKey = "revenue" | "appointments" | "clients" | "services";

export interface MetricDescriptor {
  key: MetricKey;
  label: string;
  icon: LucideIcon;
  variant: "emerald" | "blue" | "amber" | "purple" | "default";
}

export const DASHBOARD_METRIC_DESCRIPTORS: MetricDescriptor[] = [
  {
    key: "revenue",
    label: "Faturação Estimada",
    icon: DollarSign,
    variant: "emerald",
  },
  {
    key: "appointments",
    label: "Agendamentos Ativos",
    icon: Calendar,
    variant: "blue",
  },
  {
    key: "clients",
    label: "Clientes Registados",
    icon: Users,
    variant: "amber",
  },
  {
    key: "services",
    label: "Menu de Serviços",
    icon: Scissors,
    variant: "purple",
  },
];

export const APPOINTMENT_STATUS_CONFIG = {
  scheduled: {
    label: "Agendado",
    textColor: "text-sky-400",
    bgColor: "bg-sky-400/10",
    borderColor: "border-sky-400/20",
    badgeClass: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  },
  pending: {
    label: "Pendente",
    textColor: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
    badgeClass: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
  completed: {
    label: "Concluído",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
    badgeClass: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  cancelled: {
    label: "Cancelado",
    textColor: "text-zinc-500",
    bgColor: "bg-zinc-500/10",
    borderColor: "border-zinc-500/20",
    badgeClass: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
  },
} as const;

export const PAYMENT_METHOD_CONFIG = {
  cash: {
    label: "Dinheiro",
    shortLabel: "Dinheiro",
  },
  mbway: {
    label: "MB Way",
    shortLabel: "MB Way",
  },
  card: {
    label: "Cartão Bancário",
    shortLabel: "Cartão",
  },
} as const;

export const WEEK_DAYS = [
  { index: 0, label: "Domingo", shortLabel: "Dom" },
  { index: 1, label: "Segunda-feira", shortLabel: "Seg" },
  { index: 2, label: "Terça-feira", shortLabel: "Ter" },
  { index: 3, label: "Quarta-feira", shortLabel: "Qua" },
  { index: 4, label: "Quinta-feira", shortLabel: "Qui" },
  { index: 5, label: "Sexta-feira", shortLabel: "Sex" },
  { index: 6, label: "Sábado", shortLabel: "Sáb" },
] as const;

export const BARBERSHOP_DEFAULTS = {
  MIN_DURATION_MINUTES: 30,
  TIME_LIMIT_CANCELLATION_HOURS: 2,
  DEFAULT_OPENING_TIME: "09:00",
  DEFAULT_CLOSING_TIME: "19:00",
} as const;

export const colorVariants = {
  emerald: {
    active:
      "border-emerald-500/40 bg-emerald-500/10 ring-1 ring-emerald-500/20",
    icon: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  red: {
    active: "border-red-500/40 bg-red-500/10 ring-1 ring-red-500/20",
    icon: "text-red-400 bg-red-500/10 border-red-500/20",
  },
  purple: {
    active: "border-purple-500/40 bg-purple-500/10 ring-1 ring-purple-500/20",
    icon: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  blue: {
    active: "border-blue-500/40 bg-blue-500/10 ring-1 ring-blue-500/20",
    icon: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  amber: {
    active: "border-amber-500/40 bg-amber-500/10 ring-1 ring-amber-500/20",
    icon: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  green: {
    active: "border-green-500/40 bg-green-500/10 ring-1 ring-green-500/20",
    icon: "text-green-400 bg-green-500/10 border-green-500/20",
  },
  zinc: {
    active: "border-zinc-500/40 bg-zinc-500/10 ring-1 ring-zinc-500/20",
    icon: "text-zinc-400 bg-white/5 border-white/10",
  },
};

export type ColorKey = keyof typeof colorVariants;
export type AppointmentStatusType = keyof typeof APPOINTMENT_STATUS_CONFIG;
export type PaymentMethodType = keyof typeof PAYMENT_METHOD_CONFIG;
