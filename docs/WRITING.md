# Silentra — guia de linguagem

## Objetivo

Todos os textos apresentados ao utilizador devem ser fáceis de entender sem conhecimento técnico. A pessoa deve saber imediatamente **o que está a acontecer, o que pode fazer e qual será o resultado**.

## Regras

- Preferir palavras concretas: “Marcações”, “Clientes”, “Barbeiros”, “Relatórios”, “Pagamentos”.
- Evitar jargão de software: “endpoint”, “payload”, “RPC”, “tenant”, “webhook”, “infraestrutura”, “deploy”, “cron”, “API”, “ID”, “status code”. Esses termos pertencem a logs e documentação técnica, nunca à interface normal.
- Escrever botões como ações: “Guardar alterações”, “Ver marcação”, “Criar campanha”, “Escolher hora”.
- Para erros, explicar o problema e a próxima ação: “Não foi possível guardar. Tenta novamente.” em vez de uma mensagem técnica.
- Não usar frases que culpem o utilizador. Preferir “Não foi possível concluir…” a “Fizeste algo errado…”.
- Mostrar unidades e datas de forma humana: “24 horas”, “amanhã às 15:30”, “Segunda-feira (Monday)” quando uma tradução evita ambiguidade.
- Evitar linguagem excessivamente comercial dentro do produto. A interface deve orientar primeiro e vender depois.
- Usar o mesmo termo para a mesma coisa em toda a plataforma. Ex.: “Marcação” para a reserva de um cliente; “Barbeiro” para o profissional; “Definições” para configurações.

## Padrão para estados

| Situação | Texto recomendado |
|---|---|
| A carregar | A carregar… |
| Guardar | Guardar alterações |
| Sucesso | Alterações guardadas. |
| Erro | Não foi possível guardar. Tenta novamente. |
| Sem resultados | Não encontrámos resultados. |
| Estado pending | Por confirmar |
| Estado active | Ativo |
| Estado inactive | Desativado |
| Upgrade | Mudar de plano |

## Acessibilidade de linguagem

Os textos devem funcionar para leitores de ecrã, pessoas com pouca familiaridade digital e utilizadores em telemóvel. Não depender apenas de cor, ícones ou abreviaturas para transmitir significado.
