# Silentra for Barbers — Product Priority Roadmap

## P0 — corrigir antes da próxima release

- [x] SEO canonical das páginas públicas e legais principais
- [x] `lang` inicial PT/EN alinhado com o locale persistido
- [x] Corrigir o `A` literal no loading do mapa
- [x] Evitar pedidos automáticos duplicados de `LocationRequest`
- [x] Expor falhas de carregamento de preços/billing com retry explícito

## P1 — grande impacto comercial

- [ ] POS / Vendas
- [ ] Perfil de cliente
- [ ] Analytics orientada a decisões
- [ ] Linguagem global
- [ ] Metadata das páginas públicas
- [x] Sitemap das páginas públicas de vendas e legais

## P2 — polish

- [ ] Agenda ainda mais visual
- [ ] Tabs animadas aplicadas onde realmente ajudam
- [ ] Microinterações
- [ ] Melhoria dos empty states
- [ ] Loading states consistentes
- [ ] Refinação dos mobile layouts

## Notas de execução

As alterações de produção são feitas diretamente na branch `main`. Cada correção deve ser pequena, verificável e reversível. Não criar tabelas, RPCs ou fluxos paralelos quando a implementação existente já define a arquitetura.
