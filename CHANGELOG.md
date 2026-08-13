# Changelog

## Unreleased — 2026-08-13

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
