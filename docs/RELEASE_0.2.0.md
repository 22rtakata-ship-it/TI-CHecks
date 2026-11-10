# TI Log 0.2.0 — 07/11/2026

Atualização solicitada após uso real do sistema. As entradas e os valores armazenados de tempo continuam em minutos, preservando registros e cálculos existentes; a apresentação é em horas e minutos (672 → 11 h 12 min).

## Alterações

1. Diário e dashboard apresentam totais e duração de atividades em horas/minutos.
2. Relatórios gerencial/técnico, resumo para e-mail e PDF usam a mesma apresentação. XLSX exporta horas numéricas e inclui aba Resumo.
3. Ocorrências podem ser removidas com confirmação e restauradas em Ocorrências → Mostrar removidas. A remoção utiliza `deletedAt` no payload, exclui a ocorrência dos indicadores/relatórios e preserva atividades, evidências e eventos. Não existe exclusão física automática desses registros.
4. O modal compartilhado reconhece início e fim do gesto no fundo; arrastar seleção para fora ou cancelar/rolar um toque não fecha formulários. Fechar, Escape e clique intencional no fundo continuam funcionando. O foco volta ao botão de origem quando ele existe.
5. Tema do PDF selecionável: Claro ou Escuro, inicialmente seguindo o tema da interface. A impressão aplica cores também ao canvas da página, preservando contraste e fundo.
6. Categoria Celulares disponível para novas contas e adicionada de forma incremental às existentes, preservando categorias personalizadas.
7. Pesquisa explícita no histórico de atividades por título, categoria ou chamado; aceita #, espaços, pontos, hífens e prefixos de chamado. Resultados respeitam a loja selecionada e mostram as datas.
8. Dashboard organizado em atividades, ocorrências e checklists; mês selecionável, tempo destacado, distribuição por categoria/loja e previsões futuras separadas do percentual de execução até hoje.

## Compatibilidade e dados

A migração `202611070001_add_mobile_category.sql` acrescenta apenas a categoria ausente e incrementa a revisão das configurações alteradas. Não converte durações salvas, não altera históricos e é idempotente. Abas abertas antes da alteração precisam recarregar caso recebam conflito de revisão; a gravação obsoleta continua bloqueada.

A remoção de ocorrências é uma ação explícita do usuário na interface. O deploy não remove ocorrências existentes. Não foram usados registros do proprietário para testar o sistema. A validação remota utiliza conta temporária isolada, removida depois.

## Arquivos principais

- `src/lib/duration.ts`, `src/lib/seed.ts`.
- `src/features/reports/{Dashboard.tsx,Reports.tsx,service.ts,reports.css}`.
- `src/features/incidents/{types.ts,service.ts,IncidentPanel.tsx}`.
- `src/features/activities/{ActivitiesView.tsx,service.ts}`.
- `src/features/daily-log/DailyLog.tsx`, `src/features/evidence/EvidencePanel.tsx`.
- `src/components/{ui/shared.tsx,layout/Workspace.tsx}`, `src/styles/globals.css`.
- `supabase/migrations/202611070001_add_mobile_category.sql`.
- Testes de regras, migração, modal, busca, remoção/restauração, tempo, planilha e PDF em `tests/`.

Resultados finais de validação e implantação são registrados em `VALIDATION.md` e `DEPLOYMENT.md` após a publicação.
