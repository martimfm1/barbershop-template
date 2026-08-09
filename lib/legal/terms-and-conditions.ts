export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type TermsDocument = {
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

export const TERMS_LAST_UPDATED = "21 de julho de 2026";

export const termsAndConditions: Record<"pt" | "en", TermsDocument> = {
  pt: {
    lastUpdated: TERMS_LAST_UPDATED,
    intro:
      "Estes Termos e Condições regulam o acesso e a utilização da plataforma Silentra for Barbers (doravante, «Silentra» ou «Plataforma»), disponível em barbershop.silentra.me. Ao criar conta, iniciar sessão ou utilizar qualquer funcionalidade, confirmas que leste, compreendeste e aceitas estes termos.",
    sections: [
      {
        title: "1. Objeto do serviço",
        paragraphs: [
          "A Silentra é uma plataforma de software como serviço (SaaS) destinada à gestão operacional de barbearias, incluindo agendamentos, clientes, serviços, profissionais, estatísticas e comunicações automatizadas.",
          "A Plataforma inclui um marketplace público que permite a clientes finais pesquisar barbearias e efetuar reservas online sem criação de conta, sujeito à disponibilidade de cada estabelecimento.",
          "A Silentra atua exclusivamente como fornecedora de tecnologia. A prestação do serviço de barbearia, preços, horários, cancelamentos e atendimento presencial são da responsabilidade de cada barbearia registada.",
        ],
      },
      {
        title: "2. Elegibilidade e registo",
        paragraphs: [
          "O registo destina-se a profissionais ou representantes autorizados de barbearias com idade mínima de 18 anos.",
          "Comprometes-te a fornecer informação verdadeira, completa e atualizada (nome, email, telefone e demais dados solicitados). És responsável por manter esses dados corretos.",
          "Cada conta é pessoal e intransmissível. A partilha de credenciais ou o acesso por pessoas não autorizadas é proibida. Deves notificar-nos de imediato em caso de uso não autorizado da tua conta.",
        ],
      },
      {
        title: "3. Utilização aceitável",
        paragraphs: [
          "Comprometes-te a utilizar a Plataforma apenas para fins legítimos de gestão de barbearia e em conformidade com a legislação aplicável.",
          "É expressamente proibido: (a) tentar aceder a dados de outras barbearias ou utilizadores; (b) interferir com a segurança, integridade ou disponibilidade da Plataforma; (c) automatizar acessos de forma abusiva; (d) introduzir código malicioso; (e) utilizar a Plataforma para spam, fraude ou recolha ilícita de dados pessoais.",
          "Reservamo-nos o direito de monitorizar padrões de utilização para prevenir abuso, garantir estabilidade do serviço e cumprir obrigações legais.",
        ],
      },
      {
        title: "4. Reservas e clientes finais",
        paragraphs: [
          "Quando um cliente final efetua uma reserva através do marketplace, recolhemos os dados estritamente necessários para processar o pedido (nome, contacto telefónico e email).",
          "A barbearia destinatária é responsável por confirmar, reagendar ou cancelar marcações, prestar o serviço acordado e tratar reclamações dos seus clientes.",
          "A Silentra não garante a disponibilidade de horários publicados em tempo real, embora empregue mecanismos para evitar conflitos de agenda. Em caso de erro técnico, a barbearia deve contactar o cliente final diretamente.",
        ],
      },
      {
        title: "5. Comunicações",
        paragraphs: [
          "A Plataforma pode enviar notificações automatizadas por SMS, email ou push relacionadas com agendamentos, lembretes e mensagens operacionais configuradas pela barbearia.",
          "Ao ativar integrações de mensagens, confirmas que possuis base legal para contactar os teus clientes e que cumpres as políticas dos fornecedores de mensagens aplicáveis.",
          "Custos de dados ou mensagens cobrados pelo operador móvel são da responsabilidade do destinatário ou da barbearia, consoante o caso. Podes desativar funcionalidades de mensagens nas definições da conta, quando disponível.",
        ],
      },
      {
        title: "6. Dados pessoais e privacidade",
        paragraphs: [
          "Tratamos dados pessoais em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD) e a legislação portuguesa aplicável.",
          "Enquanto titular de conta, és responsável pelos dados de clientes e colaboradores que introduzes na Plataforma, devendo informá-los sobre o tratamento e obter consentimentos quando legalmente exigido.",
          "Os dados são armazenados em infraestrutura cloud segura (incluindo Supabase). Implementamos medidas técnicas e organizativas adequadas, mas nenhum sistema é totalmente isento de risco.",
          "Podes solicitar acesso, retificação, eliminação ou portabilidade dos teus dados pessoais contactando contact@silentra.me. Respondemos no prazo legal aplicável.",
        ],
      },
      {
        title: "7. Propriedade intelectual",
        paragraphs: [
          "A Silentra, o seu código, design, marca e documentação são propriedade da Silentra ou dos seus licenciadores. Estes termos não conferem qualquer direito de propriedade sobre a Plataforma.",
          "Manténs a titularidade dos dados comerciais que carregas (clientes, serviços, horários, etc.). Concedes-nos uma licença limitada para processar esses dados exclusivamente para prestar o serviço.",
        ],
      },
      {
        title: "8. Disponibilidade, manutenção e alterações",
        paragraphs: [
          "A Plataforma é fornecida numa base de «melhor esforço». Podemos realizar manutenções programadas ou de emergência que afetem temporariamente o acesso.",
          "Podemos adicionar, alterar ou descontinuar funcionalidades. Alterações materiais serão comunicadas através da Plataforma ou por email, quando aplicável.",
          "Funcionalidades beta ou experimentais podem ser disponibilizadas sem garantias de estabilidade ou continuidade.",
        ],
      },
      {
        title: "9. Planos, preços e faturação",
        paragraphs: [
          "Determinadas funcionalidades podem estar sujeitas a planos pagos no futuro. Quando aplicável, os preços, ciclo de faturação e condições de cancelamento serão apresentados antes da contratação.",
          "Na ausência de plano pago ativo, o acesso pode estar limitado às funcionalidades disponíveis no momento do registo.",
        ],
      },
      {
        title: "10. Limitação de responsabilidade",
        paragraphs: [
          "Na máxima extensão permitida por lei, a Silentra não é responsável por perdas indiretas, lucros cessantes, interrupção de negócio ou danos resultantes de decisões tomadas com base em informação exibida na Plataforma.",
          "A responsabilidade total da Silentra por qualquer reclamação relacionada com estes termos fica limitada ao montante pago por ti nos 12 meses anteriores ao evento que originou a reclamação, ou a zero euros se não existir plano pago.",
          "Nada nestes termos exclui responsabilidade que não possa ser legalmente limitada, incluindo dolo ou negligência grave.",
        ],
      },
      {
        title: "11. Suspensão e rescisão",
        paragraphs: [
          "Podes encerrar a tua conta a qualquer momento contactando contact@silentra.me ou através das funcionalidades de conta, quando disponíveis.",
          "Podemos suspender ou encerrar o acesso imediatamente em caso de violação destes termos, risco de segurança, ordem legal ou utilização abusiva da Plataforma.",
          "Após rescisão, poderemos reter dados durante o período necessário para cumprimento legal, resolução de litígios ou backups de rotina, após o qual serão eliminados ou anonimizados.",
        ],
      },
      {
        title: "12. Alterações aos termos",
        paragraphs: [
          "Podemos atualizar estes Termos e Condições periodicamente. A data da última revisão consta no topo deste documento.",
          "Alterações relevantes serão comunicadas com antecedência razoável. A continuação da utilização após a entrada em vigor implica aceitação da versão atualizada.",
        ],
      },
      {
        title: "13. Lei aplicável e foro",
        paragraphs: [
          "Estes termos regem-se pela lei portuguesa. Qualquer litígio será submetido aos tribunais competentes em Portugal, salvo disposição legal imperativa em contrário.",
          "Para questões sobre estes termos ou sobre a Plataforma, contacta contact@silentra.me.",
        ],
      },
    ],
  },
  en: {
    lastUpdated: "July 21, 2026",
    intro:
      "These Terms and Conditions govern access to and use of the Silentra for Barbers platform (\"Silentra\" or the \"Platform\"), available at barbershop.silentra.me. By creating an account, signing in, or using any feature, you confirm that you have read, understood, and accepted these terms.",
    sections: [
      {
        title: "1. Service scope",
        paragraphs: [
          "Silentra is a software-as-a-service (SaaS) platform for barbershop operations, including appointments, clients, services, staff, analytics, and automated communications.",
          "The Platform includes a public marketplace that allows end customers to discover barbershops and book online without creating an account, subject to each shop's availability.",
          "Silentra acts solely as a technology provider. Service delivery, pricing, schedules, cancellations, and in-person appointments remain the responsibility of each registered barbershop.",
        ],
      },
      {
        title: "2. Eligibility and registration",
        paragraphs: [
          "Registration is intended for professionals or authorized representatives of barbershops who are at least 18 years old.",
          "You agree to provide accurate, complete, and up-to-date information (name, email, phone, and any other requested data). You are responsible for keeping this information correct.",
          "Each account is personal and non-transferable. Sharing credentials or allowing unauthorized access is prohibited. You must notify us immediately of any unauthorized use of your account.",
        ],
      },
      {
        title: "3. Acceptable use",
        paragraphs: [
          "You agree to use the Platform only for legitimate barbershop management purposes and in compliance with applicable law.",
          "The following is strictly prohibited: (a) attempting to access other barbershops' or users' data; (b) interfering with the Platform's security, integrity, or availability; (c) abusive automated access; (d) introducing malicious code; (e) using the Platform for spam, fraud, or unlawful personal data collection.",
          "We reserve the right to monitor usage patterns to prevent abuse, ensure service stability, and comply with legal obligations.",
        ],
      },
      {
        title: "4. Bookings and end customers",
        paragraphs: [
          "When an end customer books through the marketplace, we collect only the data required to process the request (name, phone contact, and email).",
          "The receiving barbershop is responsible for confirming, rescheduling, or canceling appointments, delivering the agreed service, and handling customer complaints.",
          "Silentra does not guarantee real-time availability of published time slots, although conflict-prevention mechanisms are in place. In case of technical error, the barbershop must contact the end customer directly.",
        ],
      },
      {
        title: "5. Communications",
        paragraphs: [
          "The Platform may send automated notifications via SMS, email, or push related to appointments, reminders, and operational messages configured by the barbershop.",
          "By enabling messaging integrations, you confirm that you have a lawful basis to contact your customers and that you comply with applicable messaging provider policies.",
          "Data or messaging costs charged by mobile carriers are the responsibility of the recipient or the barbershop, as applicable. You may disable messaging features in account settings when available.",
        ],
      },
      {
        title: "6. Personal data and privacy",
        paragraphs: [
          "We process personal data in accordance with the General Data Protection Regulation (GDPR) and applicable Portuguese law.",
          "As an account holder, you are responsible for customer and staff data you enter into the Platform, and you must inform data subjects and obtain consent where legally required.",
          "Data is stored on secure cloud infrastructure (including Supabase). We implement appropriate technical and organizational measures, but no system is completely risk-free.",
          "You may request access, rectification, erasure, or portability of your personal data by contacting contact@silentra.me. We will respond within the applicable legal timeframe.",
        ],
      },
      {
        title: "7. Intellectual property",
        paragraphs: [
          "Silentra, its code, design, brand, and documentation are owned by Silentra or its licensors. These terms do not grant any ownership rights in the Platform.",
          "You retain ownership of the business data you upload (clients, services, schedules, etc.). You grant us a limited license to process that data solely to provide the service.",
        ],
      },
      {
        title: "8. Availability, maintenance, and changes",
        paragraphs: [
          "The Platform is provided on a best-effort basis. We may perform scheduled or emergency maintenance that temporarily affects access.",
          "We may add, modify, or discontinue features. Material changes will be communicated through the Platform or by email, where applicable.",
          "Beta or experimental features may be offered without guarantees of stability or continuity.",
        ],
      },
      {
        title: "9. Plans, pricing, and billing",
        paragraphs: [
          "Certain features may be subject to paid plans in the future. When applicable, pricing, billing cycles, and cancellation terms will be presented before purchase.",
          "In the absence of an active paid plan, access may be limited to features available at the time of registration.",
        ],
      },
      {
        title: "10. Limitation of liability",
        paragraphs: [
          "To the maximum extent permitted by law, Silentra is not liable for indirect losses, lost profits, business interruption, or damages arising from decisions made based on information displayed on the Platform.",
          "Silentra's total liability for any claim related to these terms is limited to the amount paid by you in the 12 months preceding the event giving rise to the claim, or zero euros if no paid plan exists.",
          "Nothing in these terms excludes liability that cannot legally be limited, including wilful misconduct or gross negligence.",
        ],
      },
      {
        title: "11. Suspension and termination",
        paragraphs: [
          "You may close your account at any time by contacting contact@silentra.me or through account features when available.",
          "We may suspend or terminate access immediately in case of terms violations, security risk, legal order, or abusive use of the Platform.",
          "After termination, we may retain data for the period necessary for legal compliance, dispute resolution, or routine backups, after which it will be deleted or anonymized.",
        ],
      },
      {
        title: "12. Changes to these terms",
        paragraphs: [
          "We may update these Terms and Conditions periodically. The date of the last revision appears at the top of this document.",
          "Material changes will be communicated with reasonable notice. Continued use after the effective date constitutes acceptance of the updated version.",
        ],
      },
      {
        title: "13. Governing law and contact",
        paragraphs: [
          "These terms are governed by Portuguese law. Any dispute shall be submitted to the competent courts in Portugal, unless mandatory legal provisions state otherwise.",
          "For questions about these terms or the Platform, contact contact@silentra.me.",
        ],
      },
    ],
  },
};
