# Reorganização estrutural

Iniciada em 09/11/2026, validada e continuada em 10/11/2026. [PROJECT_MAP.md](../PROJECT_MAP.md) é o mapa canônico usado por [AGENTS.md](../AGENTS.md); `FEATURE_MAP.md` aponta para o mesmo mapa.

## Responsabilidades reorganizadas

| Antes                                     | Depois                                                      | Responsabilidade                                                                                                                        |
| ----------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Workspace.tsx`, 502 linhas               | Compositor de 55 linhas, controlador e componentes irmãos   | Estados/efeitos no hook; menu em `navigation`; sidebar, cabeçalho, avisos, páginas e formulário separados. Gates de acesso preservados. |
| Atividade/ocorrência no layout            | `activities/workflow.ts`                                    | Preparação de um snapshot único, sem React nem persistência.                                                                            |
| Cartões no diário                         | `activities/ActivityCards.tsx`                              | Compartilhados pelo diário e busca; reexport anterior preservado.                                                                       |
| Repositório com normalização/localStorage | `repository.ts`, `workspace-data.ts`, `local-demo.ts`       | RPC/revisões, contrato do snapshot e demonstração separados.                                                                            |
| `Dashboard.tsx`, 357 linhas               | Compositor de 89 linhas e `reports/dashboard/`              | Seções de atividades, ocorrências, checklists e distribuições.                                                                          |
| `Reports.tsx`, 260 linhas                 | Compositor de 82 linhas e `reports/report/`                 | Filtros, prévia, ações e hooks de tema/exportação.                                                                                      |
| `reports/service.ts`, 226 linhas          | Fachada de 5 linhas e arquivos específicos                  | Calendário, seleção/agregação, resumo, workbook e download.                                                                             |
| `ValidityDashboard.tsx`, 414 linhas       | Compositor de 81 linhas e `validity/components/`            | Resumo, métricas, gráfico e histórico separados das regras.                                                                             |
| Regras de validade em um serviço          | `calendar`, `records`, `selectors`, `metrics`, `formatters` | Calendário, validação/upsert, seleção mensal, cálculos e apresentação.                                                                  |
| `globals.css`, 1.262 linhas               | Entrada de 14 linhas e 13 folhas                            | Tokens, base, layout, áreas funcionais, responsividade e impressão.                                                                     |

As contagens registram a extração. As mudanças funcionais solicitadas em seguida estão em [RELEASE_0.4.0.md](RELEASE_0.4.0.md) e podem acrescentar linhas aos módulos envolvidos.

## Compatibilidade

Mesma entrada Next.js, navegação por fragmentos, formatos de dados, RPCs, chave local e ordem dos estados/efeitos de autenticação. O controlador mantém bloqueio de salvamentos simultâneos, revisão por proprietário e atualização de memória somente após confirmação. Formulários são encerrados ao trocar conta. Erro remoto não recai silenciosamente em modo local.

As fachadas de relatórios/validades e as exportações do repositório preservam os caminhos públicos. Normalização mantém propriedades desconhecidas e compatibilidade de validades ausentes. Serviços não importam interface; componentes recebem dados/callbacks. Nenhuma factory, classe, biblioteca de estado ou dependência foi adicionada.

O CSS global recomposto é byte a byte igual ao original, SHA-256 `2d3b6403dc46c497c98582fcf102ee3f65897acdd1aadcfb242be9b315e7ef28`. Ordem da cascata e regras preservadas; o CSS específico de relatório foi alterado depois, conforme o novo pedido funcional.

## Verificação

Cada extração passou por testes pertinentes e TypeScript. A suíte integral existente passou com **88 testes em 9 arquivos** antes dos novos recursos. Corpos de serviços, normalização e preparação atividade/ocorrência foram comparados com as cópias anteriores. Extração de componentes preservou o DOM explícito; IDs internos de React podem mudar, mantendo labels associados.

Na comparação final Chromium com fixtures fixas, **22 de 26 telas** mantiveram pixels e DOM normalizado idênticos ao baseline. As quatro diferenças são os relatórios reformulados, desktop/celular nos dois temas, conforme o pedido seguinte. As telas preservadas incluem diário, busca, dashboard, validades, checklists, configurações, evidências e lista de ocorrências. O baseline de Reports foi reconstruído do registro original e conferido com arquivo de checkpoint, distinguindo uma proteção NA que fora adicionada depois do checkpoint.

Também foram inspecionadas 12 capturas dos novos formulários/relatório e dois PDFs. Nenhum erro de página ou transbordamento horizontal. A paginação mantém título e os dois grupos de ocorrências juntos quando cabem em uma página. Listas maiores que uma página continuam sujeitas à paginação do navegador.

Resultados consolidados de testes/build/publicação: [VALIDATION.md](VALIDATION.md). Nenhuma migração ou alteração de dados corporativos foi necessária para a reorganização. Testes locais usam fixtures; testes remotos, quando registrados, usam conta temporária isolada.

## Próximas alterações

Consulte `PROJECT_MAP.md`, identifique módulo e testes, leia o contexto necessário e siga somente dependências pertinentes. Atualize o mapa se arquivos/responsabilidades mudarem. Arquivos já pequenos e coesos foram mantidos, evitando extrações sem benefício de manutenção.
