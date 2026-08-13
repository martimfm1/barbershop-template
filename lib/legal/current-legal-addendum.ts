export type LegalLocale = "pt" | "en";

export const CURRENT_LEGAL_UPDATE = "13 de agosto de 2026";

export const currentTermsAddendum = {
  pt: {
    title: "15. Atualização do serviço — 13 de agosto de 2026",
    paragraphs: [
      "A Plataforma pode recolher, durante uma reserva, dados adicionais apresentados pelo cliente, incluindo a data de nascimento quando esse campo for obrigatório no fluxo de marcação. A data de nascimento é disponibilizada à barbearia para gestão da relação com o cliente e para as finalidades indicadas na Política de Privacidade.",
      "As funcionalidades de localização do marketplace e de pesquisa de moradas podem solicitar acesso à localização do dispositivo. A localização do cliente é opcional, é utilizada para melhorar pesquisa, ordenação por proximidade e apresentação do mapa, e não deve ser tratada como necessária para utilizar o marketplace quando a funcionalidade não for escolhida.",
      "A barbearia pode adicionar um cliente à sua lista a partir de uma marcação concluída. Essa ação deve ser utilizada apenas por utilizadores autorizados da respetiva barbearia e associa os dados da marcação ao perfil de cliente correspondente.",
      "As funcionalidades de email e pagamentos dependem dos respetivos fornecedores e do plano contratado. O envio manual de SMS permanece desativado enquanto essa funcionalidade não for disponibilizada pela Plataforma.",
    ],
  },
  en: {
    title: "15. Service update — August 13, 2026",
    paragraphs: [
      "The Platform may collect additional information presented during a booking, including date of birth where that field is mandatory in the booking flow. The date of birth is made available to the barbershop for customer-management purposes described in the Privacy Policy.",
      "Marketplace location and address-search features may request access to device location. Customer location is optional, is used to improve search, proximity ordering, and map presentation, and is not required to use the marketplace when the feature is not chosen.",
      "A barbershop may add a customer to its customer list from a completed appointment. This action must only be used by authorized users of the relevant barbershop and associates booking data with the corresponding customer profile.",
      "Email and payment features depend on the applicable providers and subscription plan. Manual SMS sending remains disabled while the feature is not available in the Platform.",
    ],
  },
} as const;

export const currentPrivacyAddendum = {
  pt: {
    title: "15. Atualização de tratamento — 13 de agosto de 2026",
    paragraphs: [
      "Data de nascimento: o campo pode ser recolhido no processo de reserva e armazenado na marcação até existir uma necessidade operacional de o associar ao perfil de cliente da barbearia. A barbearia deve limitar a utilização deste dado ao necessário e assegurar uma base legal adequada.",
      "Localização: quando o cliente autoriza a localização do dispositivo, a Silentra pode utilizar latitude, longitude e informação de precisão para apresentar o mapa, ordenar resultados por distância e melhorar a pesquisa. A localização do cliente não é tratada como necessária para navegar no marketplace e, por defeito, é utilizada apenas no contexto da experiência em que foi autorizada.",
      "CRM de clientes: utilizadores autorizados da barbearia podem transformar dados de uma marcação concluída num registo de cliente. O acesso é limitado à barbearia correspondente através de controlos de tenant e permissões server-side.",
      "Segurança e minimização: as políticas de acesso procuram aplicar segregação por barbearia, menor privilégio e validação no servidor. Estes controlos destinam-se a apoiar os princípios de minimização, limitação das finalidades, integridade e confidencialidade previstos no RGPD.",
    ],
  },
  en: {
    title: "15. Processing update — August 13, 2026",
    paragraphs: [
      "Date of birth: the field may be collected during booking and stored on the appointment until there is an operational need to associate it with the barbershop's customer profile. The barbershop should limit use of this data to what is necessary and maintain an appropriate lawful basis.",
      "Location: when a customer authorizes device location, Silentra may use latitude, longitude, and accuracy information to display maps, sort results by distance, and improve search. Customer location is not required to browse the marketplace and, by default, is used only in the experience for which it was authorized.",
      "Customer CRM: authorized barbershop users may turn data from a completed appointment into a customer record. Access is limited to the relevant barbershop through tenant controls and server-side authorization.",
      "Security and minimization: access policies aim to apply barbershop-level segregation, least privilege, and server-side validation. These controls are intended to support GDPR principles of data minimization, purpose limitation, integrity, and confidentiality.",
    ],
  },
} as const;
