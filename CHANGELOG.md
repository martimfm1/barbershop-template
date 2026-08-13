# Changelog

## Unreleased — 2026-08-13

### Database — shop slug hardening

- Adicionada proteção server-side para garantir que novos registos em `public.shops` recebem automaticamente um slug quando um fluxo legado não o fornece.
- O trigger `shops_ensure_slug_before_insert` reutiliza `normalize_shop_slug` e cria um sufixo curto baseado no UUID para evitar colisões.
- Slugs fornecidos explicitamente continuam a ser normalizados, preservando o fluxo canónico existente.
- A correção mantém `shops.slug` como `NOT NULL` e não remove a restrição de unicidade.
- O onboarding atómico existente continua a gerar o slug explicitamente; o trigger funciona como proteção adicional para outros caminhos de criação.

### Booking — disponibilidade, folgas e bloqueios

- Reforçada a API pública de disponibilidade para respeitar os dias de encerramento configurados na barbearia.
- Os dias de folga continuam selecionáveis no drawer para que o cliente veja explicitamente o aviso de que a barbearia está fechada, em vez de receber apenas um botão desativado.
- Adicionados avisos visuais para dias de folga no booking drawer mobile.
- Os `schedule_blocks` específicos da data deixam de aparecer como horários disponíveis.
- Bloqueios de dia inteiro e bloqueios parciais passam a ser comunicados no drawer com a razão configurada e o intervalo de horas quando aplicável.
- A geração de horários passou a considerar a duração real do serviço, evitando apresentar slots que ultrapassariam o horário de fecho.
- A disponibilidade passou a excluir sobreposições com marcações `pending` e `scheduled`, em vez de comparar apenas a hora inicial.
- A API de criação de marcações passou a repetir server-side todas as validações críticas de disponibilidade: folgas, horário de funcionamento, pausa, bloqueios e conflitos de marcações.
- Conflitos de corrida de inserção PostgreSQL (`23505` e `23P01`) continuam a ser convertidos em HTTP 409.
- Melhorado o tratamento de erros da API de disponibilidade e booking para devolver mensagens utilizáveis pelo cliente em vez de um erro interno genérico sempre que a causa é conhecida.
- O email do cliente não é usado como chave única de marcação: o mesmo email pode ser utilizado em várias reservas.

### Booking — mobile UX

- Melhorada a composição do `BookingDrawer` em ecrãs pequenos, incluindo altura dinâmica, safe-area inferior e footer fixo mais seguro para dispositivos móveis.
- Reduzidos problemas de overflow horizontal nos seletores de serviços e dias.
- Melhorados touch targets e estados ativos dos horários.
- O drawer passa a apresentar diretamente a mensagem devolvida pela API quando uma operação de disponibilidade ou confirmação falha.
- Adicionada indicação explícita no formulário de que o mesmo email pode ser utilizado em várias marcações.

### Equipa — membros e permissões

- A aba **Membros e permissões** passa a listar exclusivamente utilizadores com função `barber` que tenham efetivamente entrado através de um código de convite utilizado.
- Administradores, gestores e utilizadores criados por outros fluxos deixam de aparecer nesta lista específica.
- A associação `joined_via_code` é determinada server-side através dos códigos utilizados, não através de dados enviados pelo frontend.
- Mantida a validação tenant-scoped da API de membros.

### Definições — mobile

- Mantido o botão de `Guardar alterações` na barra fixa inferior mobile das Definições, juntamente com a ação de descartar quando existem alterações pendentes.
- A ação de guardar continua a reutilizar o mesmo fluxo server-side das Definições, sem criar um caminho de gravação separado para mobile.

### Production Hardening

- Criada a branch dedicada `production-hardening` para validação antes de merge na `main`.
- Adicionado `/api/health` sem cache para health checks e smoke tests.
- Reforçada a CI com `typecheck`, `lint`, build, smoke QA, contratos de planos e auditoria estática de segurança.
- Adicionada auditoria de dependências de produção através de `pnpm qa:deps`.
- Adicionado `.env.example` sem valores reais para documentar o contrato de ambiente.
- Adicionada validação local de variáveis obrigatórias com `pnpm qa:env`.
- Actualizada a checklist `docs/production-readiness.md` com gates P0/P1/P2 e critérios de release.
- Reforçado o booking público para respeitar `professional_id` na deteção de conflitos e converter corridas de inserção PostgreSQL (`23505`) em HTTP 409.
- Adicionado rate limiting distribuído ao booking público: 20 tentativas por 10 minutos por hash de IP + barbearia, sem persistir o IP em bruto.
- Adicionado `RATE_LIMIT_SECRET` ao contrato de ambiente para proteger os identificadores do rate limiter.
- Adicionada uma migration para buckets atómicos de rate limiting com locks transacionais na database.
- Adicionada idempotência persistente aos webhooks Stripe através de um ledger de `event_id` único.
- Mantido como blocker o fluxo público de reviews, que ainda necessita de prova server-side de uma marcação válida antes da publicação.
- Mantido como requisito de release a aplicação das migrations e a execução dos testes E2E de isolamento multi-tenant, quotas e billing em staging.

### Hardening → UX/Conversion

- Harmonizados os raios da UI base: controlos e botões usam formas mais retas e cards mantêm apenas uma camada de arredondamento maior para agrupamento visual.
- Aumentados os targets base dos botões e controlos para melhorar a usabilidade em desktop e mobile.
- Melhorados os estados de foco visível e a hierarquia de interações para reduzir incerteza durante ações críticas.
- Adicionado suporte global para `prefers-reduced-motion`, reduzindo animações quando o utilizador o solicita.
- Criadas classes visuais partilhadas para superfícies, secções, ações primárias/secundárias, estados vazios e CTA, evitando estilos divergentes entre páginas.
- Reforçada a hierarquia dos preços com o Pro como opção recomendada, contraste visual controlado e CTAs orientadas à ação.
- Melhorada a comunicação de valor dos planos Free, Pro e Enterprise sem dark patterns.
- Reforçada a leitura rápida dos benefícios através de espaçamento, agrupamento e contraste.
- Melhorados os estados vazios de Clientes e Equipa para orientar diretamente para a próxima ação.
- Harmonizado o catálogo de Serviços com cards menos arredondados, CTA principal único e copy orientada à configuração mínima necessária.
- Simplificada a composição de Mensagens para reduzir decisões: escolher cliente, template, ajustar conteúdo e enviar.
- Reforçado o destaque contextual da automação de aniversários sem competir com o envio manual.

### Definições — correções de gravação e avatar

- Corrigido o fluxo de gravação das definições da barbearia através de um RPC `SECURITY DEFINER` tenant-scoped, permitindo aos proprietários e administradores guardar as alterações sem abrir o RLS.
- O RPC de definições aceita apenas os campos de configuração suportados e valida a pertença do utilizador à barbearia.
- Corrigido o upload do avatar para utilizar o bucket Supabase existente `avatars`, mantendo o caminho público `avatar/{barbershopId}/avatar.webp`.
- Corrigida a validação do URL do avatar no RPC para corresponder ao bucket real.
- Mantida a conversão obrigatória para WebP, validação do ficheiro e limpeza do upload quando a associação do avatar falha.
- Melhorado o tratamento de erros técnicos no service de definições.

### Equipa — membros, códigos e permissões

- As entradas através de código passam sempre a entrar como `barber`.
- Removida da geração de códigos a escolha de funções administrativas; promoções e permissões passam a ser geridas pelo proprietário.
- Adicionada a aba **Membros e permissões** em `/dashboard/equipa`.
- O proprietário consegue alterar a função dos membros, ajustar permissões por área e remover membros.
- A função `owner` é imutável e mantém acesso total à barbearia.
- Os membros que entraram por código ficam identificados como tal na gestão da equipa.
- Adicionados RPCs e API server-side para listar, atualizar e remover membros com validação por tenant.

### Segurança — permissões e CRM

- Adicionado o RPC `add_client_from_completed_appointment` com `SECURITY DEFINER`, validação de sessão, role e `barbershop_id`.
- A criação de clientes a partir de marcações deixou de depender de inserts diretos na tabela `users` através do browser.
- A operação de adicionar cliente passou a ser atómica e tenant-scoped, mantendo `role='client'` e evitando clientes duplicados por telefone.
- Mantidos os controlos RLS existentes em vez de abrir uma policy genérica de escrita em `users`.

### Jurídico — atualização de 13 de agosto de 2026

- Atualizados os Termos e Condições com o fluxo atual de reservas, data de nascimento, localização e CRM.
- Atualizada a Política de Privacidade com o tratamento da localização opcional, data de nascimento em reservas e conversão de marcações em perfis de cliente.
- Clarificados princípios de minimização, segregação por barbearia e validação server-side.
- Mantido o envio manual de SMS como desativado.

### Marcações — dados do cliente e CRM

- A data de nascimento passou a ser obrigatória no `BookingDrawer` público.
- A API `/api/bookings` valida a data de nascimento, impede datas futuras e guarda-a em `appointments.manual_birth_date`.
- A confirmação da agenda passou a permitir adicionar o cliente à lista de clientes antes de escolher o método de pagamento.
- A associação à lista de clientes reutiliza o cliente existente por telefone quando aplicável e copia nome, telefone, email e data de nascimento da marcação.
- O fluxo mantém isolamento por barbearia e evita associações duplicadas.

### Marketplace — URLs canónicas de barbearias

- A rota pública usa uma única rota dinâmica: `/barbershops/[slug]`.
- O slug é o identificador público e canónico da barbearia.
- UUIDs antigos são aceites apenas como fallback interno na mesma rota e são resolvidos para o slug canónico.
- Slugs passam a ser únicos sem distinção entre maiúsculas/minúsculas.
- Slugs em falta ou duplicados são corrigidos de forma determinística durante a migration.
- O sitemap gera exclusivamente URLs com slug.
- Os links do marketplace usam o slug e só recorrem ao ID quando não existir slug durante uma migração/estado legado.

### Definições — redesign UI/UX

- Redesenhada a página `/dashboard/settings` como um centro de controlo profissional, organizado por secções de Negócio, Localização, Horários, Aparência, Marcações, Plano e Conta.
- Adicionada navegação lateral no desktop e seletor de secção otimizado para mobile.
- Adicionada pesquisa de definições para reduzir tempo de procura e carga cognitiva.
- Adicionado estado de configuração com progresso visual baseado em informação real preenchida.
- Implementado estado explícito de alterações por guardar, com ações `Guardar alterações` e `Descartar`.
- Adicionada barra de ações fixa no mobile para guardar alterações sem regressar ao topo.
- Melhorados labels, focus states, touch targets e hierarquia visual para acessibilidade.
- Mantidos os fluxos existentes de localização, faturação, uploads de imagem, marcações e gestão da sessão.
- O plano e funcionalidades condicionadas continuam dependentes do sistema de permissões existente, sem confiar apenas na UI.

### Pricing

- Reforçada a diferenciação visual e funcional do plano Pro como escolha recomendada.
- Os CTAs de pricing foram alinhados com a intenção do utilizador e o estado atual da subscrição.
- Reduzido o excesso de elementos em formato pill na comparação dos planos.
