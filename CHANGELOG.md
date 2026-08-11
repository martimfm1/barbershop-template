# Changelog

## Unreleased — 2026-08-11

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
