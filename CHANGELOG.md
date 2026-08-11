# Changelog

## Unreleased — 2026-08-11

### Upload de imagens
- Corrigido o fluxo de upload de imagens da barbearia para produzir sempre um ficheiro WebP real antes do Storage.
- Removido o suporte a SVG neste fluxo, evitando formatos vectoriais desnecessários.
- Mantido o limite máximo de 10 MB para o ficheiro original.
- Adicionadas validações de dimensões máximas e número máximo de píxeis para reduzir risco de imagens abusivas.
- Validado o `Content-Type` final como `image/webp` antes do upload.
- Mantido `upsert: true` e cache de longa duração para os assets versionados pelo caminho.
- O utilitário de processamento deixou de actualizar directamente a tabela `barbershops`.
- A associação do avatar à barbearia passou para uma função PostgreSQL protegida por autenticação, tenant e role de administrador.
- O URL guardado só pode apontar para `avatar/{barbershopId}/avatar.webp` no Storage público do Supabase.

### Security
- Adicionada a migration `20260811100000_avatar_upload_hardening.sql`.
- O RPC `set_barbershop_avatar_url` exige uma sessão autenticada e um administrador pertencente à barbearia alvo.
- O RPC rejeita URLs de avatar fora do caminho esperado do tenant.
- Nenhum `service_role` é exposto ou utilizado no browser.

### Birthday Automation
- Adicionada a automação de emails de aniversário para planos Pro e Enterprise.
- Criada a página `/dashboard/mensagens/birthdays` para ativar/desativar a automação e gerir o template.
- Adicionadas as variáveis `{{nome}}`, `{{barbearia}}` e `{{booking_url}}`.
- Adicionada a data de nascimento opcional aos clientes.
- Cada cliente só pode receber uma mensagem por aniversário através de um registo idempotente.
- Adicionado worker diário protegido por `CRON_SECRET` e agendado através do Vercel Cron.
- O envio usa o provider Brevo existente e o nome/avatar da barbearia quando disponíveis.
- A automação é protegida server-side pelo entitlement `automated_followups`, disponível em Pro e Enterprise.
- Registados envios bem-sucedidos e falhados em `birthday_email_logs` para auditoria e diagnóstico.

### Clientes e agenda
- Adicionada uma acção server-side para transformar uma marcação concluída num cliente da barbearia.
- A operação verifica a marcação, tenant e estado `completed` antes de criar o cliente.
- É feita verificação por telefone para reduzir duplicados.
- Quando o cliente já existe, a marcação é associada ao cliente existente em vez de criar um registo duplicado.
- Adicionado estado de carregamento específico para a acção de adicionar cliente na agenda.

### Mensagens
- Adicionado acesso rápido à automação de aniversários em `/dashboard/mensagens`.
- Adicionado botão "Aniversários" no cabeçalho da página de Mensagens.
- Adicionado cartão contextual para gerir a automação de aniversários.

### Fixed
- Corrigido o acesso à gestão de profissionais no plano Free.
- O plano Free pode adicionar o primeiro profissional e fica limitado a 1 profissional.
- A comissão do profissional no plano Free é aplicada server-side como 100% fixa.
- Corrigida a distinção entre permissões de equipa e quotas definidas pelo plano.
- Corrigido o fluxo de criação de profissionais para não depender de uma lista rígida de roles legados.
- Adicionados aliases compatíveis para permissões de gestão de equipa.
- Corrigido o acesso ao módulo Mensagens para membros autenticados da barbearia.
- Removida a dependência de uma lista rígida de roles no carregamento dos clientes usado pelo módulo Mensagens.
- Mantida a distinção entre autenticação, autorização e limite de plano.
- Adicionada uma opção para ocultar uma barbearia do diretório público `/barbearias`.
- O estado de visibilidade é validado no servidor do diretório e também ao abrir a página pública direta da barbearia.

### Email
- Adicionado o avatar/logótipo da própria barbearia aos emails de confirmação de agendamento.
- O avatar é carregado directamente do bucket público `avatar/{barbershopId}/avatar.webp`, usando a mesma imagem configurada nas definições da barbearia.
- O nome da barbearia continua a ser apresentado junto ao avatar.
- Emails sem `barbershopId` mantêm fallback sem avatar, preservando compatibilidade com integrações antigas.

### Security
- A gestão de profissionais continua a validar a identidade do utilizador e o `barbershop_id` no servidor.
- A criação de profissionais continua protegida por quota server-side e pelo RPC PostgreSQL com `pg_advisory_xact_lock`.
- O acesso a clientes e envio de mensagens continua limitado ao tenant autenticado.
- O plano Free não pode alterar a comissão do seu profissional através do frontend/API.
- Dados apresentados no HTML dos emails são escapados antes de serem inseridos no template.
- A preferência de visibilidade é armazenada por barbearia e não permite que um tenant altere a visibilidade de outro.

### Supabase
- Adicionada a migration `20260811040000_finalize_professional_management_authorization.sql` para consolidar a autorização da Equipa e as quotas Free/Pro/Enterprise.
- Adicionada a migration `20260811050000_add_barbershop_directory_visibility.sql` com `is_public_in_directory`, por defeito `true` para preservar as barbearias existentes.
- Adicionada a migration `20260811070000_birthday_email_automation.sql` com datas de nascimento, configurações e histórico idempotente de emails de aniversário.

### UI/UX
- Adicionado às Definições um controlo simples de visibilidade no diretório público.
- A opção indica claramente se a barbearia está visível ou oculta e mantém o link direto da barbearia disponível quando está oculta.
- Adicionada uma interface dedicada de automação de aniversários com estado, editor de template, variáveis e pré-visualização.

## v3.0.29 — 2026-08-10

### UI/UX
- Harmonized the dashboard visual language across clients, services, team, messaging, billing and public plans.
- Improved page headers, spacing, surfaces, hierarchy and responsive behavior for desktop, tablet and mobile.
- Added a shared dashboard UI safety layer to prevent horizontal overflow and improve touch targets.
- Improved mobile dialog sizing and internal scrolling for dashboard forms.
- Improved settings-page mobile behavior through shared responsive safeguards without changing its existing business logic.

### Messages
- Redesigned the manual email composer with clearer recipient, template, subject and message sections.
- Added a more realistic email preview with sender, recipient and subject context.
- Improved placeholder guidance for `{{nome}}` and `{{barbearia}}`.
- Kept manual SMS explicitly disabled while preserving the future integration surface.
- Added stronger client-side input limits and safer validation feedback while keeping server-side validation authoritative.
