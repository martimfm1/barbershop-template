export type LegalLocale = 'pt' | 'en';

export const CURRENT_LEGAL_UPDATE = '21 de agosto de 2026';

export const currentTermsAddendum = {
  pt: {
    title: '15. Oferta promocional, dados e faturação — 21 de agosto de 2026',
    paragraphs: [
      'A Silentra disponibiliza, para novos membros elegíveis que subscrevam o plano Barbers Pro através do checkout aplicável, uma oferta promocional de um mês associada ao código promocional TRIALPRO. A oferta está sujeita à elegibilidade verificada pela Plataforma e às condições configuradas na Stripe.',
      'A oferta TRIALPRO não constitui um período experimental universal nem é garantida para contas que já tenham tido uma subscrição, uma oferta promocional ou outro histórico de faturação que as torne inelegíveis. A Silentra pode impedir a aplicação da oferta quando a conta ou a utilização anterior indicar que as condições de novos membros não são cumpridas.',
      'Quando a oferta for aplicada, o primeiro período elegível será descontado de acordo com a promoção ativa na Stripe. Depois do período promocional, a subscrição será renovada e faturada pelo preço normal e pela periodicidade apresentada no checkout, salvo cancelamento ou alteração da subscrição antes da cobrança aplicável.',
      'A aplicação do código promocional é controlada server-side e pela Stripe. A apresentação do código numa página, anúncio ou mensagem promocional não garante, por si só, a aplicação do desconto se a promoção tiver expirado, sido desativada, atingido os respetivos limites ou se a conta não cumprir os critérios de elegibilidade.',
      'O utilizador deve rever o total, o desconto, a periodicidade e as condições apresentadas no checkout antes de confirmar a subscrição. Em caso de conflito entre uma mensagem promocional e o valor final confirmado no checkout, prevalecem as condições e valores efetivamente apresentados no checkout e registados pelo processador de pagamentos, sem prejuízo dos direitos legais aplicáveis.',
      'As funcionalidades podem incluir reservas públicas, gestão de clientes, agenda, profissionais, fidelização, emails, analytics, automações e outras ferramentas disponibilizadas no plano. Os limites e a disponibilidade podem variar por plano, configuração e estado da conta.',
    ],
  },
  en: {
    title: '15. Promotional offer, data, and billing — August 21, 2026',
    paragraphs: [
      'Silentra provides eligible new members who subscribe to the Barbers Pro plan through the applicable checkout with a one-month promotional offer associated with the TRIALPRO promotion code. The offer is subject to eligibility verified by the Platform and the conditions configured in Stripe.',
      'The TRIALPRO offer is not a universal trial and is not guaranteed for accounts that have previously had a subscription, promotional offer, or other billing history that makes them ineligible. Silentra may prevent the offer from being applied when account or prior-use information indicates that the new-member conditions are not met.',
      'When the offer applies, the eligible first period will be discounted according to the active Stripe promotion. After the promotional period, the subscription will renew and be charged at the normal price and billing interval shown at checkout unless the subscription is canceled or changed before the applicable charge.',
      'Promotion-code application is controlled server-side and by Stripe. Displaying the code on a promotional page, advertisement, or message does not by itself guarantee the discount if the promotion has expired, been disabled, reached its limits, or the account does not meet the eligibility criteria.',
      'Users should review the total, discount, billing interval, and terms shown at checkout before confirming a subscription. If a promotional message conflicts with the final checkout amount, the conditions and values actually presented at checkout and recorded by the payment processor prevail, subject to mandatory legal rights.',
      'Features may include public bookings, customer management, scheduling, professionals, loyalty, email, analytics, automations, and other tools made available under the applicable plan. Limits and availability may vary by plan, configuration, and account state.',
    ],
  },
} as const;

export const currentPrivacyAddendum = {
  pt: {
    title: '15. Atualização do tratamento — 21 de agosto de 2026',
    paragraphs: [
      'Data de nascimento: o campo pode ser recolhido no processo de reserva e armazenado na marcação até existir uma necessidade operacional de o associar ao perfil de cliente da barbearia. A barbearia deve limitar a utilização deste dado ao necessário e assegurar uma base legal adequada.',
      'Localização: quando o cliente autoriza a localização do dispositivo, a Silentra pode utilizar latitude, longitude e informação de precisão para apresentar o mapa, ordenar resultados por distância e melhorar a pesquisa. A localização do cliente não é necessária para navegar no marketplace e, por defeito, é utilizada apenas no contexto da experiência em que foi autorizada.',
      'CRM de clientes: utilizadores autorizados da barbearia podem transformar dados de uma marcação concluída num registo de cliente. O acesso é limitado à barbearia correspondente através de controlos de tenant e permissões server-side.',
      'Billing promocional: a Silentra pode tratar identificadores de promoção, estado de elegibilidade, informação da subscrição e dados de faturação necessários para determinar se uma conta pode beneficiar de uma oferta de novos membros, incluindo a promoção TRIALPRO. Estes dados são utilizados para aplicar a oferta, prevenir reutilização indevida, manter o estado de faturação e cumprir obrigações legais e de auditoria.',
      'Stripe: a aplicação do desconto e a confirmação do estado da cobrança dependem do processador de pagamentos Stripe. A Silentra pode conservar os identificadores técnicos necessários para reconciliar a promoção e a subscrição sem armazenar os dados completos do cartão.',
      'Email e notificações: a plataforma pode tratar endereços de email e dados técnicos necessários para enviar confirmações de reserva, mensagens operacionais, códigos de acesso e outras comunicações configuradas. O envio de comunicações comerciais deve respeitar a base legal e as preferências aplicáveis.',
      'Cookies e analytics: podem ser utilizados identificadores estritamente necessários para sessão, segurança e funcionamento. Quando sejam usados mecanismos opcionais de medição ou tecnologias que exijam consentimento, esse tratamento deve respeitar as preferências de consentimento configuradas pelo utilizador e a legislação aplicável.',
      'Segurança e minimização: as políticas de acesso procuram aplicar segregação por barbearia, menor privilégio e validação no servidor. Estes controlos destinam-se a apoiar os princípios de minimização, limitação das finalidades, integridade e confidencialidade previstos no RGPD.',
    ],
  },
  en: {
    title: '15. Processing update — August 21, 2026',
    paragraphs: [
      "Date of birth: the field may be collected during booking and stored on the appointment until there is an operational need to associate it with the barbershop's customer profile. The barbershop should limit use of this data to what is necessary and maintain an appropriate lawful basis.",
      'Location: when a customer authorizes device location, Silentra may use latitude, longitude, and accuracy information to display maps, sort results by distance, and improve search. Customer location is not required to browse the marketplace and, by default, is used only in the experience for which it was authorized.',
      'Customer CRM: authorized barbershop users may turn data from a completed appointment into a customer record. Access is limited to the relevant barbershop through tenant controls and server-side authorization.',
      'Promotional billing: Silentra may process promotion identifiers, eligibility state, subscription information, and billing data required to determine whether an account may benefit from a new-member offer, including TRIALPRO. This data is used to apply the offer, prevent misuse or repeated redemption, maintain billing state, and meet legal and audit obligations.',
      'Stripe: discount application and billing-state confirmation depend on the Stripe payment processor. Silentra may retain the technical identifiers needed to reconcile the promotion and subscription without storing complete card details.',
      'Email and notifications: the platform may process email addresses and technical data needed to send booking confirmations, operational messages, access codes, and other configured communications. Commercial communications must be supported by an appropriate lawful basis and respect applicable preferences.',
      "Cookies and analytics: strictly necessary identifiers may be used for sessions, security, and essential operation. Where optional measurement tools or technologies requiring consent are used, processing should respect the user's configured consent preferences and applicable law.",
      'Security and minimization: access policies aim to apply barbershop-level segregation, least privilege, and server-side validation. These controls are intended to support GDPR principles of data minimization, purpose limitation, integrity, and confidentiality.',
    ],
  },
} as const;
