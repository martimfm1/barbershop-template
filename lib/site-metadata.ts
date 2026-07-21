import type { Metadata } from "next";

const SITE_URL = "https://barbershop.silentra.me";

export const guestMetadata: Metadata = {
  title: "Silentra Barbershop | Gestão e Agendamento Online",
  description:
    "A plataforma premium de gestão para a tua barbearia. Simplifica o teu negócio e permite que os teus clientes agendem em segundos — sem downloads e sem criar conta.",
  keywords: [
    "gestao de barbearia",
    "agendamento online barbearia",
    "sistema de marcaçoes",
    "plataforma para barbeiros",
    "silentra for barbers",
    "agendamento sem conta",
    "barber saas",
  ],
  openGraph: {
    title: "Silentra Barbershop | Eleva o Nível da tua Barbearia",
    description:
      "Gestão completa, faturação e agendamentos online sem fricção. O teu cliente agenda diretamente pelo browser, sem necessidade de registo ou aplicações.",
    url: SITE_URL,
    siteName: "Silentra Barbershop",
    locale: "pt_PT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Silentra Barbershop | Gestão e Agendamento Eficiente",
    description:
      "Elimina a fricção no atendimento. Um sistema de agendamento ultra-rápido onde o teu cliente não precisa de criar conta para marcar.",
  },
};

export const authenticatedMetadata: Metadata = {
  title: "Silentra | O teu painel de gestão",
  description:
    "Gere agendamentos, clientes, serviços e estatísticas da tua barbearia num único painel.",
  openGraph: {
    title: "Silentra | Painel de gestão",
    description:
      "Acede ao teu painel para gerir marcações, equipa e receita da barbearia.",
    url: SITE_URL,
    siteName: "Silentra Barbershop",
    locale: "pt_PT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Silentra | Painel de gestão",
    description:
      "Gere agendamentos, clientes e serviços da tua barbearia.",
  },
};

export function metadataForAuth(isAuthenticated: boolean): Metadata {
  return isAuthenticated ? authenticatedMetadata : guestMetadata;
}
