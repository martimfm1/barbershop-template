# Mapas e localização

## Configuração

A pesquisa de moradas usa o Mapbox no servidor. Define a variável abaixo apenas no ambiente do servidor/Vercel:

```env
MAPBOX_ACCESS_TOKEN=
```

Não uses esta variável com o prefixo `NEXT_PUBLIC_`: o token não deve ser enviado para o browser.

## Experiência de localização

`/barbershops` pede a localização do utilizador logo à entrada, quando o navegador disponibiliza a Geolocation API. A localização é opcional; o utilizador pode continuar a pesquisar por nome, rua ou cidade.

A posição temporária é guardada apenas em `sessionStorage` para evitar pedidos repetidos durante a mesma sessão. Os dados enviados para a API são latitude/longitude e servem apenas para ordenar por proximidade e centrar o mapa.

## Pesquisa de moradas

A API `GET /api/address/search` valida a pesquisa no servidor, limita o tamanho do pedido, restringe os resultados a Portugal e usa `pt-PT`. Quando existe localização do utilizador, é enviada como proximidade para melhorar a ordenação dos resultados.

A UI de autocomplete tem suporte para teclado, leitores de ecrã, touch, limpeza do campo, estado de carregamento e indicação de precisão da sugestão.

## Definições

Em `/dashboard/settings` existe um editor dedicado de morada e localização. O utilizador escolhe uma sugestão confirmada e a API `PATCH /api/barbershops/:barbershopId/location` grava simultaneamente a morada e as coordenadas do mapa, com validação de sessão, tenant e role.

## Segurança

- Coordenadas e moradas são validadas server-side.
- A API de edição verifica que o utilizador pertence à barbearia e é `owner` ou `admin`.
- O token Mapbox é mantido exclusivamente no servidor.
- A localização do utilizador não é gravada na base de dados.
