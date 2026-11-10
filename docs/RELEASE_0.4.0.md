# TI Log 0.4.0 — atividades e relatórios objetivos

## Atividades

Formulário com título, categoria, status, setor, tempo, chamado opcional e descrição, além de data/loja. “Abrir ocorrência para acompanhar” cria a ocorrência junto da atividade em uma única gravação. Atividades já vinculadas mantêm o vínculo.

Ao editar um registro antigo, a descrição reúne problema, procedimentos, resultado e observações. Os campos anteriores, equipamento, próximas ações, dependências, datas e demais propriedades permanecem guardados; o novo formulário não os apaga. Novos registros usam `description`, sem migração destrutiva nem reescrita em massa.

Abra a atividade e use **Remover atividade**. Após confirmação, ela sai do diário, pesquisa, indicadores e relatórios. Em **Atividades → Atividades removidas**, pode ser restaurada com o mesmo ID. Ocorrência, eventos, evidências e revisões permanecem guardados. Restaurar uma atividade não restaura implicitamente uma ocorrência também removida.

## Ocorrências

Atualização com data, Status, Resolvido? Sim/Não e O que aconteceu? obrigatório. Sim define Concluído; Não reabre como Em andamento quando necessário. Selecionar um status sincroniza a resposta. Não há segunda flag persistida que possa divergir do histórico. Uma atualização de acompanhamento não cria atividade automaticamente.

## Relatórios

Técnico com Título, Setor, Categoria, Chamado, Status e Descrição; campos vazios mostram N/A. Data identifica o registro. Informações legadas são reunidas sem inventar conteúdo.

Ocorrências em seção própria: concluídas no mês com título/data real de resolução; pendentes ao final do período com título/status daquela data. Grupos lado a lado no desktop/PDF e empilhados no celular. Resolução em outro mês e reabertura respeitam o histórico.

Resumo executivo com mês por extenso, como “novembro de 2026”, e uma informação por linha. Edição, impressão e texto para e-mail preservam as quebras. Tempo agregado continua em horas/minutos.

O XLSX conserva colunas anteriores e acrescenta Descrição na coluna M de Atividades, Situação no período e Data de resolução em Ocorrências. Horas permanecem numéricas na coluna K. Detalhes antigos continuam disponíveis na planilha.

## Persistência e operação

Nenhuma dependência ou migração SQL nova. Os opcionais `description` e `deletedAt` de Activity ficam no JSONB existente, sob as mesmas políticas/revisões. O teste de banco verifica seu roundtrip junto dos campos legados e vínculos. Login e configuração Supabase permanecem os mesmos.

Após a publicação, recarregue o site. O controle de revisão impede que outra aba sobrescreva uma gravação mais recente sem recarregar.

Arquivos e testes: [PROJECT_MAP.md](../PROJECT_MAP.md). Validações: [VALIDATION.md](VALIDATION.md). Reorganização anterior: [REFACTORING.md](REFACTORING.md).
