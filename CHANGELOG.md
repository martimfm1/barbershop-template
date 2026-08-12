# Changelog

## Unreleased — 2026-08-12

### Dashboard e autenticação
- O acesso ao `/dashboard` passa a resolver a barbearia através da sessão Supabase autenticada e do perfil `users`, evitando depender de um cookie como fonte de verdade.
- O proxy deixou de usar helpers de base de dados com cliente de browser durante a validação SSR da sessão.
- O `BarbershopProvider` deixou de confiar cegamente no cookie `barbershop_id` e valida sempre a associação através do utilizador autenticado.
- Adicionados estados de erro distintos para falhas de leitura do perfil e da barbearia, evitando redirecionamentos silenciosos para o onboarding.

### Onboarding e autenticação
- O fluxo `/api/onboarding/create` passa a usar `create_barbershop_onboarding()` como operação transacional única.
- A criação da barbearia, o listing do marketplace e a associação do utilizador como `owner` acontecem na mesma transação PostgreSQL.
- Eliminados rollbacks parciais entre `barbershops`, `shops` e `users`.
- A nova RPC valida sempre `auth.uid()` e nunca aceita um utilizador proprietário enviado pelo cliente.
- A associação inicial fica limitada a contas que ainda não pertencem a uma barbearia.
- O endpoint de onboarding devolve erros específicos de autorização/conflito sem expor detalhes internos do PostgreSQL.

### Autenticação Supabase
- Reforçado o fluxo de recuperação de palavra-passe para nunca verificar publicamente se um email existe.
- Removida a dependência do RPC `check_email_exists()` na recuperação de palavra-passe.
- Revogada a execução de `check_email_exists(text)` para `public`, `anon` e `authenticated`, fechando o endpoint legado de enumeração de contas.
- A criação de conta deixou de distinguir respostas para emails já registados.
- O endpoint de login valida o corpo do pedido, normaliza o email e devolve apenas os dados de perfil necessários; access/refresh tokens não são enviados no JSON.
- O cliente de browser do Supabase passou a usar tipos reais em vez de `any` e configura explicitamente persistência e renovação automática da sessão.
- O endpoint de redefinição de palavra-passe valida primeiro a sessão de recuperação através de `auth.getUser()` antes de alterar a palavra-passe.
- Normalizado o tratamento de erros do reset para evitar exposição de detalhes internos do Supabase.
- Adicionada `20260812180000_auth_security_hardening.sql` para fechar helpers SECURITY DEFINER de autenticação que já não devem ser executáveis pelo cliente.
