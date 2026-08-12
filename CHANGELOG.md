# Changelog

## Unreleased — 2026-08-12

### Refatoração da base de dados
- Consolidado o modelo de roles em `users_role_check`, removendo a definição concorrente `chk_user_role`.
- O modelo canónico de roles passa a ser `owner`, `admin`, `manager`, `barber`, `receptionist`, `staff` e `client`.
- Criado `get_my_barbershop_id()` como helper canónico de tenant.
- Mantido `current_barbershop_id()` como alias de compatibilidade para migrations/policies existentes.
- Normalizadas as RLS de `users` para leitura própria/tenant e atualização apenas da própria linha.
- Mantida a proteção server-side de `barbershop_id` e `role`, com excepção exclusivamente para o contexto interno de onboarding.
- Normalizadas as policies de criação/actualização de `barbershops` e `shops` para `created_by` e roles `owner`/`admin`.
- Adicionados índices para `users.barbershop_id` e `shops.barbershop_id`.
- Adicionada a migration `20260812160000_database_consistency_refactor.sql`.
- Adicionada a documentação `docs/database-refactor.md` com o processo para obter uma baseline real, validar um rebuild local e preparar posteriormente um squash seguro.
- Não foram executadas operações destrutivas sobre a base de dados de produção.

### Onboarding UX
- Redesigned the onboarding flow around a clearer two-step journey instead of presenting an open-ended form immediately.
- Added a persistent progress indicator that starts above zero and updates as the user completes the essential setup fields.
- Added smart defaults for opening time, closing time, reference price and marketplace tags.
- Reduced decision fatigue by grouping setup fields into Identity, Initial configuration and Visibility sections.
- Clarified that non-essential settings can be changed later in the dashboard.
- Improved the primary create-barbershop call to action for desktop and mobile.
- Added trust-building copy around server-side invitation validation and post-onboarding configuration.
- Improved the join-existing-barbershop flow with a focused invitation experience and accessible one-time-code autocomplete.
- Added visible keyboard focus states and mobile-friendly touch targets.
- Improved address autocomplete feedback, including confirmed-location state and accessible loading feedback.
- Limited marketplace tags submitted by the onboarding UI to the first eight entries.
- Added mobile-first layout safeguards for the onboarding container, forms, grids, buttons and safe-area spacing.

### Onboarding security and reliability
- Fixed the `Falha ao associar barbearia ao utilizador` error caused by direct `users` table updates being blocked by RLS during barbershop creation.
- Added `complete_barbershop_onboarding(uuid)`, a narrowly scoped `SECURITY DEFINER` RPC that can only modify the authenticated user's own profile and only when that profile is not already linked to a barbershop.
- The onboarding create API now uses the protected RPC to assign the newly created barbershop and `owner` role.
- Added a migration aligning `chk_user_role` with the application role model by explicitly allowing `owner`.
- Added `barbershops.created_by` and require the onboarding RPC to match the target barbershop to the authenticated creator, preventing cross-tenant association attempts.
- Hardened the `users` tenant/role trigger so only the explicit onboarding transaction context can perform the owner association; normal client updates remain blocked.
- Kept the `users` RLS update policy restricted to the authenticated user's own row instead of weakening tenant isolation.
- Improved rollback behaviour when owner association fails.
- Kept authentication and tenant validation server-side; no service-role credentials are exposed to the browser.

## Unreleased — 2026-08-11

### Onboarding e equipa
- Adicionado sistema de funções de equipa: proprietário, administrador, gestor, barbeiro e rececionista.
- O utilizador que cria uma nova barbearia passa a ser explicitamente o proprietário.
- Adicionados códigos de entrada de utilização única para onboarding.
- Os códigos são armazenados apenas como hash e expiram automaticamente após 10 minutos.
- O proprietário ou administrador pode gerar um código e escolher a função que será atribuída ao novo membro.
- O fluxo de entrada existente `/api/onboarding/join` é encaminhado para a validação server-side segura do novo sistema.
- O novo membro recebe automaticamente a barbearia e a função associadas ao código.
- Adicionados valores de acesso predefinidos por função, mantendo `staff_permissions` como mecanismo para permissões adicionais.
- Adicionada interface na página Equipa para gerar, copiar e acompanhar o tempo restante do código.
- O código nunca é exposto em listagens da base de dados nem reutilizado depois de consumido.

### Billing e planos
- Melhorada a resolução de `plan_override` para que uma atribuição administrativa `pro` ou `enterprise` seja tratada como entitlement efectivo em toda a aplicação.
- Um override administrativo não depende do estado da subscrição Stripe nem cria uma subscrição Stripe fictícia.
- As quotas PostgreSQL passam a usar a mesma resolução de plano efectiva da aplicação.
- A remoção do override (`NULL`) devolve o controlo do plano à subscrição Stripe/local.
- `free` pode ser usado explicitamente como override para forçar o plano gratuito.
- Adicionado o RPC interno `get_effective_billing_plan` e alinhada a criação de profissionais com a mesma regra de entitlement.

### Marcações, clientes e analytics
- Adicionado campo opcional de data de nascimento ao criar uma marcação.
- A data de nascimento de clientes existentes é reutilizada automaticamente ao selecionar o cliente.
- Para marcações manuais, a data fica guardada até o barbeiro decidir adicionar o cliente ao CRM.
- Ao concluir um serviço, é apresentada uma ação para adicionar o cliente à lista de clientes sem criar duplicados.
- Ao adicionar um cliente a partir de uma marcação concluída, a data de nascimento é transferida para o perfil CRM.
- Adicionada análise demográfica por faixa etária na página de Analytics, baseada em clientes únicos com data de nascimento conhecida e serviços concluídos no período.
- Mantida a proteção por barbearia e o acesso aos Analytics através do sistema de permissões/planos existente.

### Autenticação e confirmação de email
- Corrigido o fluxo de registo para usar o cliente público do Supabase Auth em vez da `service_role` para criar contas que necessitam de confirmação por email.
- Centralizado o URL de callback de confirmação em `lib/auth/email-confirmation.ts`.
- O callback usa `NEXT_PUBLIC_SITE_URL` quando configurado e valida o destino antes de redirecionar.
- O email de confirmação passa agora a usar apenas `/api/auth/callback`, eliminando o parâmetro `next` aninhado e a dupla codificação do destino.
- O callback server-side continua responsável por encaminhar a confirmação bem-sucedida para a página de confirmação de email.
- O reenvio de confirmação usa o mesmo URL de callback do registo, evitando fluxos diferentes entre o primeiro email e os reenvios.
- Melhorado o tratamento de erros no reenvio sem expor detalhes internos do Supabase ao utilizador.
- Adicionado aviso para verificar a pasta de spam quando o email não é encontrado.
- Mantida a proteção contra redirecionamentos externos no callback.

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

### Changelog
- Adicionada uma página dedicada para erros de confirmação de email em `/email-confirmation-error`.
