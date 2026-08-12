# Refatoração da base de dados

## Estado atual

A pasta `supabase/migrations` contém várias alterações incrementais sobre o mesmo domínio, mas não contém a migration inicial que criou todo o schema base. Por isso, não é seguro tratar a pasta atual como uma reconstrução completa de raiz.

A refatoração atual mantém a história existente e adiciona uma camada canónica final para:

- roles de utilizador;
- isolamento por `barbershop_id`;
- helpers de tenant;
- políticas RLS de `users`;
- criação/actualização de `barbershops`;
- criação/actualização de `shops`;
- índices essenciais para consultas de tenant.

## Fonte de verdade futura

O objectivo é ter uma baseline real do schema remoto e, a partir daí, manter alterações pequenas e determinísticas.

Depois de ligar o projecto ao Supabase, exportar o schema remoto:

```bash
supabase db dump --schema public -f supabase/schema.sql
```

O `schema.sql` deve ser revisto antes de ser usado como baseline, removendo qualquer dado de produção, segredos ou objectos internos que não pertençam ao schema da aplicação.

Também pode ser usado:

```bash
supabase db pull
```

para gerar uma migration a partir do schema remoto. Este fluxo requer Docker/Desktop para criar a shadow database.

## Rebuild seguro

### Desenvolvimento

Depois de existir uma baseline verdadeira:

```bash
supabase db reset
supabase db lint --local --fail-on error
```

Isto destrói apenas a base local.

### Produção

Não utilizar `supabase db reset --linked` em produção. Esse comando é destrutivo.

As alterações de produção devem ser aplicadas com:

```bash
supabase db push --dry-run
supabase db push
```

Antes disso, verificar a história:

```bash
supabase migration list
```

Se a história remota e local divergirem, reparar explicitamente a tabela de migrations em vez de apagar migrations ao acaso.

## Modelo de roles

O modelo canónico da aplicação é:

- `owner`
- `admin`
- `manager`
- `barber`
- `receptionist`
- `staff`
- `client`

Não devem existir constraints concorrentes com listas diferentes para `users.role`.

## Regras de segurança

A RLS deve continuar a restringir operações de tenant a `auth.uid()` e ao `barbershop_id` derivado do perfil autenticado. A alteração de `barbershop_id` e `role` não deve ser possível através de mutações normais do cliente.

A associação inicial do proprietário é feita pelo RPC de onboarding, com verificação de que `barbershops.created_by = auth.uid()`.

## Conflitos conhecidos resolvidos

- `chk_user_role` vs `users_role_check` — unificado para uma única constraint.
- `current_barbershop_id()` vs `get_my_barbershop_id()` — `get_my_barbershop_id()` passa a ser o helper canónico; o primeiro fica como alias de compatibilidade.
- Policies duplicadas de criação/actualização de `barbershops` e `shops` — substituídas por nomes canónicos e tenant-scoped.
- Onboarding owner association — protegida contra alterações directas pelo cliente e contra cross-tenant linking.

## Próxima fase

Depois de obter o schema remoto completo, a pasta de migrations pode ser verdadeiramente consolidada/squashed para reduzir a quantidade de alterações históricas repetidas. Esse squash deve ser feito contra uma baseline real, e nunca através da remoção manual de migrations que já estão marcadas como `applied` no ambiente remoto.
