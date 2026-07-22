# 💈 Silentra for barbers — Agendamentos de Barbearia sem Fricção

> Plataforma SaaS *Mobile-First* de agendamento rápido de cortes e barba, eliminando a necessidade de os clientes criarem conta ou descarregarem aplicações.

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![Aceternity UI](https://img.shields.io/badge/Aceternity_UI-000000?style=for-the-badge&logo=framer&logoColor=white)
---

## 🎯 A Visão do Produto

A maioria das plataformas de agendamento obriga o cliente a:
1. Descarregar uma aplicação pesada.
2. Criar conta e confirmar e-mail antes de ver os horários.
3. Passar por fluxos lentos e com demasiados passos.

**O Silentra for barbers resolve este problema.** O foco é a **fricção zero**: o cliente escolhe a barbearia, seleciona o dia/hora e confirma com Nome, Telemóvel e Email em menos de 30 segundos.

---

## ✨ Funcionalidades Principais

### 📱 Para Clientes (Experiência Web/Mobile)
* **Agendamento em 3 Passos**: Seleção de serviço e horário → Escolha de barbeiro → Confirmação direta (sem registo de conta nem instalação de apps).
* **Disponibilidade Real**: Algoritmo que filtra e exibe apenas barbearias com vagas livres no dia selecionado (*Hoje* ou *Amanhã*).
* **Geolocalização & Proximidade (`Near Me`)**: Cálculo de distância exata em quilómetros a partir da posição GPS do dispositivo.
* **Filtros Inteligentes**: Ordenação dinâmica por proximidade geográfica ou por avaliação dos utilizadores (`Top Rated`).

---

## 🛠️ Tech Stack

* **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions e API Routes)
* **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
* **Base de Dados & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security)
* **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
* **Componentes UI & Ícones**: [Lucide React](https://lucide.dev/), [Shadcn](https://ui.shadcn.com/), [Aceterny UI](https://ui.aceternity.com/) 

## 🗺️ Roadmap de Desenvolvimento

---

### 🟢 Fase 1: Motor de Agendamento Base & UX Mobile *(Concluído)*
> **Objetivo:** Eliminar totalmente a fricção no agendamento e garantir uma experiência perfeita em smartphones.

- [x] **Agendamento em 3 Passos** (`BookingDrawer.tsx`) sem necessidade de criação de conta.
- [x] **Validação Rápida em Tempo Real**: Sanitização e validação de Nome, Telemóvel PT e Email.
- [x] **Ajustes Avançados de Viewport Mobile**:
  - Resolução de sobreposição pelo teclado virtual (`scrollIntoView` suave).
  - Prevenção de auto-zoom no iOS Safari (`text-base` em ecrãs pequenos).
  - Configuração de ações do teclado virtual (`enterKeyHint="next"` / `"done"`).
- [x] **Proteção contra Duplos Agendamentos**: Gestão de estado de envio e bloqueio do botão de submissão.

---

### 🟢 Fase 2: Pesquisa, Filtros & Geolocalização *(Concluído)*
> **Objetivo:** Permitir ao cliente encontrar horários disponíveis e barbearias próximas de forma instantânea.

- [x] **Barra de Pesquisa Otimizada**: Implementação de *Debounce* (300ms) para minimizar re-renders e chamadas à API.
- [x] **Filtro Estrito de Disponibilidade**: Exibição exclusiva de barbearias com vagas livres no dia selecionado (*Hoje* ou *Amanhã*).
- [x] **Geolocalização "Perto de Mim"**: Integração da `Geolocation API` do navegador com cálculo de distância exata em km via *Fórmula Haversine*.
- [x] **Ordenação Dinâmica**: Filtros por proximidade geográfica ou por classificação média (`Top Rated`).

---

### 🟠 Fase 3: Sistema de Avaliações Verificadas *(Próximo Sprint)*
> **Objetivo:** Construir prova social legítima baseada exclusivamente em serviços efetivamente realizados.

- [ ] **Modelação de Dados & Supabase**:
  - Tabela `reviews` com associação direta ao `booking_id`, pontuação (1-5 estrelas) e comentário.
  - *Trigger/Database Function* em SQL para atualização automática do `rating` médio e `reviewCount` da barbearia.
- [ ] **Fluxo de Submissão Pós-Corte**:
  - Envio automático de link temporário com token único por e-mail/SMS X horas após a conclusão do serviço.
  - Modal interativo de avaliação de 1 a 5 estrelas com caixa de comentários rápida.
- [ ] **Componente de Exibição de Reviews**: Secção de testemunhos verificados no perfil público da barbearia.

---

### 🔵 Fase 4: Painel de Controlo do Barbeiro *(Dashboard SaaS)*
> **Objetivo:** Entregar a ferramenta central de gestão operacional e financeira para os donos e barbeiros.

- [ ] **Autenticação & Níveis de Acesso (RBAC)**:
  - Autenticação via **Supabase Auth** com perfis diferenciados (`owner` vs `barber`).
- [ ] **Dashboard & Cards de Métricas**:
  - **Faturação Estimada**: Métrica diária e mensal com comparativo percentual em relação ao período anterior.
  - **Agendamentos do Dia**: Estado em tempo real (*Confirmados*, *Em Andamento*, *Concluídos*, *Cancelados*).
  - **Taxa de Ocupação (%)**: Percentagem de horas preenchidas vs. capacidade total da agenda.
  - **Taxa de No-Show**: Controlo visual de faltas não justificadas.
  - **Barbeiro em Destaque**: Identificação do colaborador com mais serviços realizados e melhor nota média.
- [ ] **Gestão de Agenda & Calendário**:
  - **Visão Multicoluna**: Visualização diária/semanal lado a lado para cada barbeiro da equipa.
  - **Bloqueio Rápido de Slots**: Pausa imediata de horários (almoço, emergências).
  - **Marcação Manual (Walk-in)**: Registo rápido de clientes presenciais sem agendamento prévio.
  - **Reagendamento Drag & Drop**: Mover marcações entre horários ou barbeiros.
- [ ] **Catálogo, Equipa & CRM**:
  - **Gestão de Serviços**: Definição de preço, duração e tempo de margem entre cortes.
  - **Gestão de Turnos**: Horários de trabalho, folgas e pausas fixas por colaborador.
  - **Ficha do Cliente & Blacklist**: Histórico por telemóvel e bloqueio de clientes recorrentes em *no-show*.

---

### 🟣 Fase 5: Comunicação & Notificações Automáticas
> **Objetivo:** Maximizar a comparência dos clientes e manter os barbeiros informados em tempo real.

- [ ] **Confirmação Instantânea**: Envio imediato de e-mail de confirmação de reserva via **Resend** / **SendGrid**.
- [ ] **Lembretes via WhatsApp / SMS**: Envio de lembretes automáticos 2h e 24h antes do corte (via **Twilio** ou **Z-API**).
- [ ] **Alertas de Cancelamento**: Notificação em tempo real para o barbeiro em caso de cancelamento por parte do cliente.

---

### ⚪ Fase 6: Pagamentos & Monetização SaaS
> **Objetivo:** Gerar receita recorrente para a plataforma e proteger as barbearias contra perdas financeiras.

- [ ] **Sinal / Caução de Reserva**: Cobrança opcional de valor parcial no agendamento via **Stripe** / **MB WAY** para evitar *no-shows*.
- [ ] **Planos de Subscrição SaaS**: Criação e gestão dos planos *Starter*, *Pro* e *Enterprise* para as barbearias (**Stripe Billing**).
- [ ] **Faturação Automática**: Gestão e emissão automática das mensalidades do software.