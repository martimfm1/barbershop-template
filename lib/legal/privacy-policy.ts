export type PrivacySection = {
  title: string;
  paragraphs: string[];
};

export type PrivacyDocument = {
  lastUpdated: string;
  intro: string;
  sections: PrivacySection[];
};

export const PRIVACY_LAST_UPDATED = "5 de agosto de 2026";

export const privacyPolicy: Record<"pt" | "en", PrivacyDocument> = {
  pt: {
    lastUpdated: PRIVACY_LAST_UPDATED,
    intro:
      "Esta Política de Privacidade explica como a Silentra for Barbers recolhe, utiliza, partilha e protege dados pessoais quando utilizas a plataforma, o marketplace público ou os nossos canais de suporte.",
    sections: [
      {
        title: "1. Quem é responsável pelos dados",
        paragraphs: [
          "Para os dados associados à conta da barbearia, faturação, suporte e administração da plataforma, a Silentra atua como responsável pelo tratamento.",
          "Para os dados introduzidos por clientes finais numa reserva pública, a barbearia que recebe a marcação é, em regra, a responsável pelo tratamento desses dados e a Silentra atua como prestadora tecnológica ou subcontratante, conforme aplicável.",
          "Se existirem dúvidas sobre uma situação concreta, podes contactar-nos em contact@silentra.me.",
        ],
      },
      {
        title: "2. Dados que recolhemos",
        paragraphs: [
          "Recolhemos dados de conta e perfil (nome, email, telefone, password encriptada e preferências de idioma), dados de negócio adicionados pela barbearia (serviços, horários, equipa e definições), e dados de utilização e apoio (registos técnicos, mensagens enviadas e interações com a plataforma).",
          "Quando um cliente final faz uma reserva no marketplace, podemos recolher o nome, contacto telefónico, email, serviço selecionado, data, hora e notas de agendamento fornecidas voluntariamente.",
          "Também podemos recolher informação técnica do dispositivo e do navegador, como endereço IP, identificadores de sessão, eventos de desempenho e métricas de utilização necessárias para proteger e melhorar o serviço.",
        ],
      },
      {
        title: "3. Finalidades e bases legais",
        paragraphs: [
          "Tratamos dados para criar e gerir contas, processar reservas, enviar notificações operacionais, prestar suporte, prevenir fraude, cumprir obrigações legais e melhorar a estabilidade da plataforma.",
          "A base legal pode incluir a execução de contrato, o cumprimento de obrigações legais, o interesse legítimo em operar e proteger a plataforma, ou o consentimento quando este seja exigido por lei.",
          "Não vendemos dados pessoais e não utilizamos os dados para finalidades incompatíveis com o contexto em que foram recolhidos.",
        ],
      },
      {
        title: "4. Partilha de dados",
        paragraphs: [
          "Podemos partilhar dados com fornecedores que nos ajudam a alojar, monitorizar, enviar mensagens e prestar suporte técnico, incluindo fornecedores de cloud e comunicações.",
          "Quando a reserva é feita para uma barbearia específica, os dados necessários à gestão dessa marcação são partilhados com essa barbearia.",
          "Também podemos divulgar dados quando tal for exigido por lei, por ordem judicial ou para proteger a segurança da plataforma, dos utilizadores ou dos nossos direitos legais.",
        ],
      },
      {
        title: "5. Cookies, analytics e registos",
        paragraphs: [
          "Utilizamos cookies ou tecnologias equivalentes para autenticação, segurança, preferências de idioma e funcionamento essencial da interface.",
          "Podemos usar ferramentas analíticas e registos técnicos para compreender desempenho, corrigir erros e detetar abuso, sempre com foco em dados agregados ou minimizados quando possível.",
          "Se o teu browser bloquear cookies essenciais, algumas funcionalidades podem deixar de funcionar corretamente.",
        ],
      },
      {
        title: "6. Retenção de dados",
        paragraphs: [
          "Guardamos os dados apenas pelo tempo necessário para prestar o serviço, cumprir obrigações legais, resolver disputas e manter backups operacionais.",
          "Quando uma conta é encerrada, podemos reter alguns dados durante o período exigido por lei ou para fins de auditoria e segurança, após o qual são eliminados ou anonimizados.",
        ],
      },
      {
        title: "7. Segurança",
        paragraphs: [
          "Aplicamos medidas técnicas e organizativas adequadas, como controlo de acessos, segregação de permissões, encriptação quando aplicável e monitorização de eventos anómalos.",
          "Apesar disso, nenhum sistema é totalmente isento de risco. Recomendamos que uses credenciais seguras e informes imediatamente qualquer atividade suspeita na tua conta.",
        ],
      },
      {
        title: "8. Transferências internacionais",
        paragraphs: [
          "Alguns fornecedores podem processar dados fora de Portugal ou da União Europeia. Nesses casos, usamos salvaguardas apropriadas para proteger a transferência, incluindo mecanismos contratuais e medidas adicionais quando necessárias.",
        ],
      },
      {
        title: "9. Os teus direitos",
        paragraphs: [
          "Nos termos da lei aplicável, podes solicitar acesso, retificação, eliminação, limitação, oposição e portabilidade dos teus dados, bem como retirar consentimento quando essa for a base do tratamento.",
          "Também tens o direito de apresentar reclamação à autoridade de controlo competente, incluindo a CNPD, se considerares que o tratamento dos teus dados não é legítimo.",
        ],
      },
      {
        title: "10. Contacto",
        paragraphs: [
          "Para questões de privacidade, pedidos de exercício de direitos ou dúvidas sobre esta política, contacta contact@silentra.me.",
          "Podemos atualizar esta política periodicamente. A data da última revisão aparece no topo desta página.",
        ],
      },
    ],
  },
  en: {
    lastUpdated: "August 5, 2026",
    intro:
      "This Privacy Policy explains how Silentra for Barbers collects, uses, shares, and protects personal data when you use the platform, the public marketplace, or our support channels.",
    sections: [
      {
        title: "1. Who is responsible for the data",
        paragraphs: [
          "For account, billing, support, and platform administration data, Silentra acts as the controller.",
          "For personal data entered by end customers through a public booking, the receiving barbershop is generally the controller of that data and Silentra acts as a technology provider or processor, as applicable.",
          "If you have any questions about a specific case, contact us at contact@silentra.me.",
        ],
      },
      {
        title: "2. Data we collect",
        paragraphs: [
          "We collect account and profile data (name, email, phone, encrypted password, and language preference), business data added by the barbershop (services, schedules, staff, and settings), and usage/support data (technical logs, messages sent, and platform interactions).",
          "When an end customer books through the marketplace, we may collect name, phone contact, email, selected service, date, time, and any appointment notes provided voluntarily.",
          "We may also collect technical information from the device and browser, such as IP address, session identifiers, performance events, and usage metrics required to protect and improve the service.",
        ],
      },
      {
        title: "3. Purposes and legal bases",
        paragraphs: [
          "We process data to create and manage accounts, process bookings, send operational notifications, provide support, prevent fraud, comply with legal obligations, and improve platform stability.",
          "The legal basis may include contract performance, legal obligations, legitimate interests in running and securing the platform, or consent when required by law.",
          "We do not sell personal data and we do not use it for purposes incompatible with the context in which it was collected.",
        ],
      },
      {
        title: "4. Data sharing",
        paragraphs: [
          "We may share data with vendors that help us host, monitor, send messages, and provide technical support, including cloud and communications providers.",
          "When a booking is made for a specific barbershop, the data needed to manage that appointment is shared with that barbershop.",
          "We may also disclose data when required by law, by court order, or to protect the security of the platform, users, or our legal rights.",
        ],
      },
      {
        title: "5. Cookies, analytics, and logs",
        paragraphs: [
          "We use cookies or equivalent technologies for authentication, security, language preferences, and essential interface behavior.",
          "We may use analytics and technical logs to understand performance, fix errors, and detect abuse, focusing on aggregated or minimized data where possible.",
          "If your browser blocks essential cookies, some features may not work correctly.",
        ],
      },
      {
        title: "6. Data retention",
        paragraphs: [
          "We keep data only for as long as necessary to provide the service, comply with legal obligations, resolve disputes, and maintain operational backups.",
          "When an account is closed, some data may be retained for the period required by law or for audit and security purposes, after which it is deleted or anonymized.",
        ],
      },
      {
        title: "7. Security",
        paragraphs: [
          "We apply appropriate technical and organizational measures, such as access controls, permission segregation, encryption where applicable, and monitoring of anomalous events.",
          "Even so, no system is completely risk-free. We recommend using strong credentials and reporting suspicious activity on your account immediately.",
        ],
      },
      {
        title: "8. International transfers",
        paragraphs: [
          "Some vendors may process data outside Portugal or the European Union. In those cases, we use appropriate safeguards to protect the transfer, including contractual mechanisms and additional measures where needed.",
        ],
      },
      {
        title: "9. Your rights",
        paragraphs: [
          "Subject to applicable law, you may request access, rectification, erasure, restriction, objection, and portability of your data, and you may withdraw consent when consent is the basis of processing.",
          "You also have the right to lodge a complaint with the competent supervisory authority, including the CNPD, if you believe your data is being processed unlawfully.",
        ],
      },
      {
        title: "10. Contact",
        paragraphs: [
          "For privacy questions, data requests, or questions about this policy, contact contact@silentra.me.",
          "We may update this policy from time to time. The last revision date appears at the top of this page.",
        ],
      },
    ],
  },
};
