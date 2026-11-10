# TI Log 0.3.0 — 09/11/2026

## Checklists

“Não se aplica” continua visível, mas não reduz a execução: 8 concluídos + 1 não aplicável representam 100% de 8 aplicáveis. A barra distribui todos os previstos por situação, destacando os não aplicáveis em azul. O percentual usa somente os aplicáveis, com explicação dos denominadores na interface. Quando não há aplicáveis, a interface informa isso sem dividir por zero.

Clique em Não preenchidos no dashboard para consultar o nome, a data e a loja de cada checklist pendente até a data de corte. Ver dia abre o diário na data correspondente. As previsões futuras continuam separadas do atraso. O mesmo cálculo de execução é usado em relatórios e XLSX.

## Remoção de ocorrência e atividades vinculadas

Ao remover a ocorrência, todas as atividades cujo `incidentId` aponta para ela também saem do diário, da pesquisa, dos indicadores e dos relatórios. Isso vale para ocorrências removidas antes desta atualização. Um registro independente com o mesmo número de chamado permanece visível: a associação é por identificador, não por coincidência de texto.

A remoção continua reversível: os registros, eventos e anexos são guardados; restaurar a ocorrência devolve suas atividades às telas e aos indicadores. Nenhum dado físico existente é apagado pelo deploy. Novas evidências não podem ser associadas às atividades ocultas.

## Validades

Novo módulo em `src/features/validity/`, com contrato, serviço, componentes e CSS próprios. No diário de segunda a sexta-feira, o usuário informa Vencidas, Em risco e Não vinculados como quantidades inteiras não negativas. Data e loja vêm da seleção do diário. Há um único registro por usuário/data/loja; editar mantém o identificador e não duplica a data.

A aba Validades apresenta gráficos de barras diários, histórico, dias sem preenchimento e comparação entre primeiro/último registro do mês por loja. Ausência não vira zero. Os snapshots diários não são somados como se representassem produtos únicos. Sábados e domingos não exigem preenchimento.

## Banco e compatibilidade

A nova migração `202611090001_validity_records.sql` cria `validity_records`, com unicidade, validações de dia útil/quantidades e RLS por proprietário. As RPCs mantêm as assinaturas e a versão1. `load_workspace` acrescenta `validityRecords`; `save_workspace` preserva os registros de validades quando clientes antigos omitem essa seção. Lista explícita é validada e salva na transação com revisão otimista.

No navegador, registros antigos são normalizados com uma lista vazia apenas quando o campo ainda não existe. Um campo malformado é rejeitado. Backup/importação explícita inclui a nova seção, preservando a cópia local.

## Arquivos principais

- `src/features/checklists/metrics.ts`.
- `src/features/reports/{service.ts,Dashboard.tsx,Reports.tsx,reports.css}`.
- `src/features/activities/{visibility.ts,ActivitiesView.tsx}`.
- `src/features/incidents/IncidentPanel.tsx`.
- `src/features/validity/{types.ts,service.ts,DailyValidity.tsx,ValidityDashboard.tsx,validity.css}`.
- `src/features/daily-log/DailyLog.tsx`, `src/features/evidence/EvidencePanel.tsx`.
- `src/types/domain.ts`, `src/lib/{seed.ts,repository.ts}`, `src/components/layout/Workspace.tsx`.
- `supabase/migrations/202611090001_validity_records.sql`.
- Testes unitários/SQL em `tests/` e de interface em `tests/browser/v030.spec.ts`.

Resultados finais e publicação: `VALIDATION.md` e `DEPLOYMENT.md`.
