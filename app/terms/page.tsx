import type { Metadata } from "next";
import { Scale, ShieldCheck, UsersRound } from "lucide-react";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { termsAndConditions } from "@/lib/legal/terms-and-conditions";
import {
  CURRENT_LEGAL_UPDATE,
  currentTermsAddendum,
} from "@/lib/legal/current-legal-addendum";

export const metadata: Metadata = {
  title: "Termos e Condições | Silentra for Barbers",
  description:
    "Termos de utilização da plataforma Silentra for Barbers, incluindo acesso, reservas, responsabilidade, comunicação e suporte.",
};

const currentTerms = {
  pt: {
    ...termsAndConditions.pt,
    lastUpdated: CURRENT_LEGAL_UPDATE,
    sections: [...termsAndConditions.pt.sections, currentTermsAddendum.pt],
  },
  en: {
    ...termsAndConditions.en,
    lastUpdated: "August 13, 2026",
    sections: [...termsAndConditions.en.sections, currentTermsAddendum.en],
  },
};

export default function TermsPage() {
  return (
    <LegalDocumentPage
      pageLabel={{ pt: "Termos & condições", en: "Terms & conditions" }}
      title={{
        pt: "Termos e Condições",
        en: "Terms and Conditions",
      }}
      subtitle={{
        pt: "Um contrato claro, pensado para proteger a plataforma, os barbeiros e os clientes finais sem linguagem jurídica desnecessariamente pesada.",
        en: "A clear agreement designed to protect the platform, barbers, and end customers without unnecessary legal noise.",
      }}
      documentByLocale={currentTerms}
      highlights={[
        {
          label: {
            pt: "Âmbito",
            en: "Scope",
          },
          value: {
            pt: "Uso da plataforma SaaS, marketplace público e comunicações operacionais.",
            en: "SaaS platform use, public marketplace, and operational communications.",
          },
          icon: <Scale className="size-4" />,
        },
        {
          label: {
            pt: "Responsabilidade",
            en: "Responsibility",
          },
          value: {
            pt: "A Silentra fornece tecnologia; a barbearia continua responsável pelo serviço prestado.",
            en: "Silentra provides the technology; the barbershop remains responsible for the service delivered.",
          },
          icon: <ShieldCheck className="size-4" />,
        },
        {
          label: {
            pt: "Utilizadores",
            en: "Users",
          },
          value: {
            pt: "Destinado a profissionais e representantes autorizados de barbearias.",
            en: "Intended for professionals and authorized barbershop representatives.",
          },
          icon: <UsersRound className="size-4" />,
        },
      ]}
      supportLabel={{ pt: "Suporte legal", en: "Legal support" }}
      supportValue="contact@silentra.me"
      backLabel={{ pt: "Voltar à home", en: "Back home" }}
    />
  );
}
