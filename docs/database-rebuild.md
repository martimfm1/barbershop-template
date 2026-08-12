# Estratégia de reconstrução da base de dados

## Estado atual

A pasta `supabase/migrations` contém a evolução funcional e de segurança do projeto, mas não contém uma migration inicial que crie todo o schema base da aplicação. As primeiras migrations já pressupõem a existência de tabelas como `public.users`, `public.barbershops` e outras estruturas existentes anteriormente.

Por esse motivo, `supabase db reset` com esta pasta, isoladamente, não é uma reconstrução completa e autónoma da base de produção.

## O que foi normalizado

A migration `20260812150000_normalize_schema_roles_and_onboarding_rls.sql` elimina a duplicação/conflicto entre `chk_user_role` e `users_role_check` e estabelece uma única lista canónica de roles:

- `owner`
- `admin`
- `manager`
- `barber`
- `receptionist`
- `staff`
- `client`

Também normaliza as policies de criação/actualização de `barbershops` e `shops` para o fluxo de onboarding e mantém o isolamento por tenant.

## Reconstrução limpa recomendada

Antes de substituir a história de migrations da produção, deve existir um dump estrutural completo do schema real da base remota.

1. Criar um dump apenas do schema:

```bash
supabase db dump --db-url "$SUPABASE_DB_URL" --schema public,extensions --file supabase/schema-base.sql
```

2. Validar o dump num projeto Supabase local.

3. Criar uma migration baseline única a partir desse schema, seguida apenas das migrations diferenciais necessárias.

4. Testar a reconstrução num projeto Supabase descartável:

```bash
supabase db reset
supabase db push
```

5. Comparar o schema resultante com a produção antes de qualquer alteração destrutiva.

6. Só depois de validar dados, RLS, funções, triggers, índices e constraints é que se deve fazer squash da história antiga.

## Regras de nomenclatura

- Um timestamp único por migration.
- Um nome descritivo e estável por migration.
- Não reutilizar timestamps antigos.
- Não criar duas constraints para representar a mesma regra.
- Não manter policies antigas com o mesmo significado depois de introduzir uma policy canónica.
- Funções/RPCs devem ter um único nome canónico e usar `create or replace function` apenas para alterações da mesma API.

## Nota de produção

Não executar `drop schema public cascade`, `supabase db reset` ou substituição da história de migrations na base de produção sem backup e validação. O objectivo desta reorganização é tornar a reconstrução determinística sem perda de dados.
