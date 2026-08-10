# Silentra for Barbers

> SaaS de gestão e agendamento para barbearias, construído para reduzir a fricção entre clientes e equipas de barbearia.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Billing-635bff?logo=stripe)](https://stripe.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)

## Sobre o projeto

O Silentra for Barbers é uma plataforma web multi-tenant para barbearias. O produto combina uma experiência pública de marcação com um dashboard de gestão para proprietários e equipas.

O objetivo do produto é simples: permitir que um cliente faça uma marcação rapidamente e dar à barbearia ferramentas para gerir agenda, clientes, equipa, comunicação, métricas e subscrição num único sistema.

## Funcionalidades

### Experiência do cliente

- Marcações sem obrigar o cliente a criar uma conta.
- Seleção de barbearia, serviço, profissional, data e horário.
- Disponibilidade baseada na agenda e bloqueios existentes.
- Marketplace público de barbearias.
- Pesquisa, filtros e localização.
- Gestão de uma marcação através de token seguro.
- Confirmação e validação de dados do cliente.

### Dashboard

- Visão geral operacional da barbearia.
- Agenda e gestão de marcações.
- Gestão de clientes.
- Serviços, preços e duração.
- Profissionais e permissões.
- Bloqueios de agenda.
- Analytics e métricas.
- Marketing e campanhas.
- Mensagens manuais por email.
- Notificações push para alertas operacionais aos barbeiros.
- Gestão de subscrição e faturação.
- Configurações da barbearia.

### Comunicação

- Email transacional e mensagens manuais através da Brevo.
- Templates de email com variáveis da barbearia e do cliente.
- Sender name baseado no nome da barbearia.
- Push notifications para a equipa, incluindo alertas de novas marcações.
- SMS manual atualmente desativado e preparado para futura ativação através de Twilio.

### Planos SaaS

O acesso às funcionalidades é controlado no servidor através dos entitlements dos planos.

| Área | Free | Pro | Enterprise |
|---|:---:|:---:|:---:|
| Gestão de marcações | ✓ | ✓ | ✓ |
| Clientes e serviços | ✓ | ✓ | ✓ |
| Gestão de profissionais | ✓ | ✓ | ✓ |
| Dashboard operacional | ✓ | ✓ | ✓ |
| Funcionalidades avançadas | — | ✓ | ✓ |
| Marketing e automações | — | ✓ | ✓ |
| Analytics avançado | — | ✓ | ✓ |
| Funcionalidades Enterprise | — | — | ✓ |

> As quotas e os entitlements efetivos são definidos no código e validados pelas APIs. A interface adapta-se ao plano atual do utilizador, mas nunca é usada como mecanismo de segurança.

## Billing

A faturação é integrada com Stripe Billing.

- Cada utilizador começa com uma subscrição Free.
- Um upgrade cria ou altera a subscrição paga existente, evitando subscrições pagas duplicadas.
- Pro e Enterprise são resolvidos através dos Stripe Price IDs configurados no ambiente.
- O estado da subscrição é sincronizado através dos eventos Stripe.
- O backend reconcilia o plano guardado com o preço atual da subscrição Stripe para evitar que um utilizador Enterprise seja incorretamente tratado como Pro.
- Faturas transitórias pendentes são removidas da apresentação após o período de retenção de 10 minutos; não são apagadas do Stripe.

## Segurança e arquitetura

O projeto utiliza uma arquitetura multi-tenant com autorização server-side.

- **Supabase Auth** para autenticação.
- **PostgreSQL + Row Level Security (RLS)** para isolamento dos dados.
- Clientes administrativos do Supabase apenas em código server-side.
- APIs validam a identidade do utilizador antes de aceder a dados protegidos.
- Entitlements de planos são verificados no backend.
- Permissões de staff são verificadas separadamente das permissões do plano.
- Stripe webhooks sincronizam o estado de billing.
- Tokens de gestão de marcações são armazenados de forma segura.
- Dados de auditoria e filas de notificações suportam operações assíncronas.

## Stack

- **Framework:** Next.js 16, App Router
- **Linguagem:** TypeScript
- **UI:** React, Tailwind CSS, shadcn/ui, Lucide
- **Backend:** Next.js API Routes / server-side services
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **Billing:** Stripe
- **Email:** Brevo
- **Push:** Web Push
- **SMS:** Twilio (infraestrutura preparada, envio manual desativado)

## Estrutura do projeto

```text
app/
├── api/                  # APIs e webhooks
├── dashboard/            # Área autenticada da barbearia
├── plans/                # Planos públicos
└── ...

components/               # Componentes React reutilizáveis
lib/                      # Supabase, Stripe, billing, utilitários
services/                 # Regras de negócio e serviços server-side
supabase/
├── migrations/           # Migrações PostgreSQL
└── ...
scripts/                  # Scripts de desenvolvimento/manutenção
types/                    # Tipos partilhados
```

## Desenvolvimento local

### Requisitos

- Node.js compatível com a versão definida no projeto.
- pnpm.
- Uma conta Supabase para a base de dados e autenticação.
- Stripe para billing, quando as funcionalidades de subscrição forem utilizadas.
- Docker Desktop apenas quando forem necessárias operações locais do Supabase CLI que criem uma shadow database.

### Instalação

```bash
pnpm install
```

Cria `.env.local` com as credenciais e configurações necessárias para o ambiente de desenvolvimento.

### Desenvolvimento

```bash
pnpm dev
```

### Validação

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Supabase

As alterações de schema são versionadas em `supabase/migrations`.

Antes de aplicar migrações num ambiente remoto, confirma o estado da migration history e evita editar migrações que já tenham sido aplicadas em produção. Quando a history local e remota divergir, resolve primeiro a discrepância de migrations em vez de executar comandos destrutivos.

## Variáveis de ambiente

Os nomes exatos podem evoluir com a implementação. As principais integrações utilizam variáveis semelhantes a:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=
STRIPE_PRICE_ENTERPRISE_MONTHLY=
STRIPE_PRICE_ENTERPRISE_YEARLY=

BREVO_API_KEY=
SENDER_EMAIL=

# Preparado para futura ativação de SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

Nunca coloques chaves privadas, tokens ou secrets diretamente no repositório.

## Roadmap

O desenvolvimento do Silentra está organizado em ciclos incrementais. Entre as áreas de evolução estão:

- Internacionalização completa da aplicação.
- Melhorias contínuas de analytics e reporting.
- Expansão de automações de marketing.
- Melhorias de comunicação e notificações.
- Ativação de SMS quando o fornecedor estiver configurado.
- Mais ferramentas Enterprise.
- Melhorias contínuas de UX, acessibilidade e experiência mobile.

## Documentação legal

A aplicação disponibiliza Termos de Serviço e Política de Privacidade atualizados para o modelo SaaS atual. Estes documentos devem ser revistos juridicamente antes de uma utilização comercial definitiva.

## Estado do projeto

O Silentra for Barbers encontra-se em desenvolvimento ativo. APIs, schema, UI e regras de billing continuam a evoluir em conjunto.

Para alterações de schema, billing ou autorização, deve ser sempre validado o impacto entre:

```text
UI → API → service layer → Supabase / Stripe
```

Uma funcionalidade não deve ser considerada concluída apenas porque a UI funciona; o entitlement e a autorização server-side devem permanecer como fonte de verdade.

## Licença

Projeto privado. A licença e as condições de utilização do código são definidas pelo proprietário do repositório.
