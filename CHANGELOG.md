# Changelog

## Unreleased — 2026-08-13

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
