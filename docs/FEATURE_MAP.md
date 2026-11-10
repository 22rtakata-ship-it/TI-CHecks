# Índice de funcionalidades

O mapa canônico agora fica em **[PROJECT_MAP.md](../PROJECT_MAP.md)**, na raiz. Consulte-o antes de investigar ou modificar código. Ele reúne finalidade, diretório, arquivos principais, dependências, serviços, testes e orientações de manutenção de cada módulo.

| Funcionalidade                                | Diretório                                               | Localização detalhada                                      |
| --------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| Diário                                        | `src/features/daily-log/`                               | Mapa: Diário por data/loja                                 |
| Atividades, busca e vínculo de ocorrência     | `src/features/activities/`                              | Mapa: Atividades; workflow separado da interface           |
| Ocorrências e histórico                       | `src/features/incidents/`                               | Mapa: Ocorrências                                          |
| Modelos, programação e execução de checklists | `src/features/checklists/`                              | Mapa: Checklists                                           |
| Registro e evolução de validades              | `src/features/validity/`                                | Mapa: Validades; regras, seletores e componentes separados |
| Indicadores                                   | `src/features/reports/dashboard/`                       | Mapa: Dashboard técnico                                    |
| Relatórios, impressão e planilha              | `src/features/reports/report/` e serviços em `reports/` | Mapa: Relatórios e exportação                              |
| Anexos privados                               | `src/features/evidence/`                                | Mapa: Evidências privadas                                  |
| Categorias e backup                           | `src/features/settings/`                                | Mapa: Configurações                                        |
| Login e senha                                 | `src/features/auth/`                                    | Mapa: Autenticação                                         |
| Estado, sessão e composição                   | `src/components/layout/`                                | Mapa: Entrada; Sessão, gravação e navegação                |
| Modal e campos                                | `src/components/ui/`                                    | Mapa: UI compartilhada                                     |
| Persistência local/remota                     | `src/lib/`                                              | Mapa: Persistência e normalização                          |
| Banco, autorização e arquivos                 | `supabase/migrations/`                                  | Mapa: Banco e autorização                                  |
| Temas, layout e impressão                     | `src/styles/` e CSS das features                        | Mapa: Estilos                                              |

Não duplique as relações e listas de arquivos neste índice. Atualize o mapa da raiz quando a estrutura mudar. Histórico das versões: [CHANGELOG.md](CHANGELOG.md). Contratos e integridade: [ARCHITECTURE.md](ARCHITECTURE.md) e [DATABASE.md](DATABASE.md). Evidências dos testes: [VALIDATION.md](VALIDATION.md).
