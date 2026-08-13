# Changelog

## Unreleased — 2026-08-13

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
