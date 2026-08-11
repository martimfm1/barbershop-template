# Changelog

## Unreleased — 2026-08-11

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
