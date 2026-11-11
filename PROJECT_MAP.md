# Mapa do projeto — TI Diário

Este é o ponto de entrada para manutenção. Identifique a funcionalidade na tabela abaixo e abra primeiro os arquivos indicados. Leia dependências apenas quando a alteração atravessar seus contratos. Não é necessário varrer todo o repositório para uma solicitação localizada.

## Estrutura

```text
src/
├── app/                         entrada Next.js e layout raiz
├── components/
│   ├── layout/                  composição, navegação e estado da sessão
│   └── ui/                      modal, campos e elementos compartilhados
├── features/
│   ├── activities/              registro, edição, busca e cartões
│   ├── auth/                    login e definição de senha
│   ├── checklists/              modelos, programação, execução e métricas
│   ├── daily-log/               composição do expediente por dia
│   ├── evidence/                anexos privados e metadados
│   ├── incidents/               ocorrência, eventos e remoção reversível
│   ├── reports/
│   │   ├── dashboard/           seções de indicadores e consulta de datas
│   │   └── report/              filtros, prévia e estado de exportação
│   ├── settings/                categorias e backup
│   └── validity/
│       └── components/          gráficos, resumo e histórico de validades
├── lib/                         persistência, datas e configuração Supabase
├── styles/                      estilos globais separados por responsabilidade
└── types/                       composição AppData e contratos comuns
supabase/migrations/             histórico SQL, RPCs, RLS e bucket
tests/                          regras, repositório e banco
tests/browser/                  fluxos de interface em Chromium
docs/                           arquitetura, banco, publicação e validação
```

## Localização por funcionalidade

Os caminhos da coluna central são relativos ao diretório informado. Todos os testes são relativos à raiz. Os tipos específicos ficam em `types.ts` da respectiva feature.

| Módulo e finalidade                        | Diretório e arquivos principais                                                                                                                                                                                           | Dependências e serviços                                                                                                              | Testes e orientação para alterar                                                                                                                                                                                                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrada e composição                       | `src/app/{page,layout}.tsx`; `src/components/layout/Workspace.tsx`                                                                                                                                                        | React, controlador e componentes de layout                                                                                           | `tests/browser/*.spec.ts`. Preserve a ordem dos estados de autenticação/carregamento; não coloque regras de domínio na composição.                                                                                                                                                                                      |
| Sessão, gravação e navegação               | `src/components/layout/{useWorkspaceController.ts,navigation.ts,WorkspaceSidebar.tsx,WorkspaceHeader.tsx,WorkspaceNotices.tsx,WorkspacePages.tsx,ActivityDialog.tsx}`                                                     | `repository`, Supabase Auth, workflow de atividades, features via props/callbacks                                                    | `tests/repository.test.ts`, browser workflow/update/v030. Preserve gravação antes da atualização de memória, bloqueio de salvamentos simultâneos e isolamento ao trocar conta. Menu usa fragmentos `#diario`, etc.; não há rotas independentes para as features.                                                        |
| Diário por data/loja                       | `src/features/daily-log/DailyLog.tsx`                                                                                                                                                                                     | `activities/ActivityCards`, visibilidade, checklists, ocorrências, `validity/DailyValidity`, datas                                   | `tests/browser/workflow.spec.ts`, `tests/browser/v030.spec.ts`. Pendência antiga não se torna atividade do dia.                                                                                                                                                                                                         |
| Atividades: formulário, busca e cartões    | `src/features/activities/{ActivityForm.tsx,ActivityTitleFields.tsx,title-fields.ts,title-fields.css,ActivitiesView.tsx,ActivityCards.tsx,RemovedActivityHistory.tsx,description.ts,service.ts,visibility.ts,workflow.ts}` | Datas, UI, tipos; workflow usa serviço de ocorrências para preparar uma única gravação                                               | `tests/activity-lifecycle.test.ts`, `tests/activities-update.test.ts`, `tests/incidents-update.test.ts`, `tests/rules.test.ts`, browser workflow/update/v030/v040. Validação/edição/busca em `service`; visibilidade por `incidentId` em `visibility`; vínculo/criação de ocorrência em `workflow`. Chamado é opcional. |
| Ocorrências: eventos, situação e histórico | `src/features/incidents/{IncidentPanel.tsx,IncidentUpdateForm.tsx,service.ts}`                                                                                                                                            | Datas, UI; recebe gravação e abertura de atividade por callback                                                                      | `tests/incident-resolution.test.ts`, `tests/incidents-update.test.ts`, `tests/rules.test.ts`, browser update/workflow/v030/v040. Preserve datas dos eventos e remoção/restauração reversível. Concluir atividade não conclui ocorrência.                                                                                |
| Checklists: programação e respostas        | `src/features/checklists/{ChecklistPanel.tsx,TemplateManager.tsx,service.ts,metrics.ts}`                                                                                                                                  | Datas, UI, identidade modelo/data/loja; relatórios consomem `planned` e `checklistMetrics`                                           | `tests/checklist-metrics-v030.test.ts`, `tests/rules.test.ts`, `tests/database.test.ts`, browser workflow/v030. Alterar recorrência pode impactar relatórios. A fazer é ausência de resposta; NA fica fora do percentual; mantenha vigência e execuções antigas.                                                        |
| Validades: registro diário                 | `src/features/validity/{DailyValidity.tsx,records.ts,calendar.ts,types.ts}`                                                                                                                                               | Datas, UI, callback de gravação                                                                                                      | `tests/validity.test.ts`, `tests/validity-database.test.ts`, browser v030. Três inteiros não negativos por loja/dia útil; editar substitui a mesma identidade lógica.                                                                                                                                                   |
| Validades: evolução mensal                 | `src/features/validity/{ValidityDashboard.tsx,selectors.ts,metrics.ts,formatters.ts}` e `components/{EvolutionChart,ValiditySummary,ValidityMetricCards,ValidityHistory}.tsx`                                             | Registros e calendário do próprio módulo; `onOpenDay` para voltar ao diário                                                          | Mesmos testes de validades. Ausência difere de zero; contagens são retratos do dia, não totais acumulados. `service.ts` mantém reexports públicos compatíveis.                                                                                                                                                          |
| Dashboard técnico                          | `src/features/reports/Dashboard.tsx`; `dashboard/{ActivityMetrics,IncidentMetrics,ChecklistMetrics,ChecklistStatusDialog,ActivityDistributions}.tsx`, `dashboard/checklist-status.ts`                                     | `selectors.ts` agrega dados, checklists/metrics, visibilidade, ocorrências/statusOn, duração                                         | `tests/reports-update.test.ts`, `tests/checklist-metrics-v030.test.ts`, browser update/v030. Não misture indicadores técnicos e checklists; não inclua previsões futuras no percentual atual.                                                                                                                           |
| Relatórios e exportação                    | `src/features/reports/Reports.tsx`; `report/{ReportFilters,ReportExportActions,ReportPreview,ReportActivityEntries,ReportIncidentSections}.tsx`; `report/{usePdfTheme,useReportExport}.ts`                                | `selectors.ts` (dados), `calendar.ts` (limites), `summary.ts` (texto), `workbook.ts` (XLSX/ExcelJS), `export.ts` (download), duração | `tests/report-objectivity.test.ts`, `tests/reports-update.test.ts`, `tests/rules.test.ts`, browser workflow/update/v040. PDF usa impressão; tema em hook e CSS do módulo. Conteúdo vem dos registros; resolução pertence ao mês real. `service.ts` mantém a API pública por reexports.                                  |
| Evidências privadas                        | `src/features/evidence/{EvidencePanel.tsx,service.ts}`                                                                                                                                                                    | Supabase Storage, AppData, visibilidade, UI                                                                                          | `tests/rules.test.ts` (formatos/limites), `tests/database.test.ts` (políticas), teste remoto isolado conforme `docs/VALIDATION.md`. Metadados e objetos não compartilham transação. Nunca tornar bucket público.                                                                                                        |
| Configurações                              | `src/features/settings/Settings.tsx`                                                                                                                                                                                      | AppData, UI, gravação por callback                                                                                                   | Browser workflow/update para categorias usadas nos formulários; smoke de backup. Categorias antigas permanecem nos registros.                                                                                                                                                                                           |
| Autenticação                               | `src/features/auth/{Login.tsx,SetPassword.tsx}`                                                                                                                                                                           | `lib/supabase.ts`, Supabase Auth; sessão coordenada no controlador                                                                   | Teste remoto isolado conforme `docs/VALIDATION.md`. Convite/recuperação usa `?setup=1` e sessão válida. Nunca usar service_role no cliente.                                                                                                                                                                             |
| UI compartilhada                           | `src/components/ui/{shared.tsx,CopyTicketButton.tsx,TechnicalStatusBadge.tsx,statusPresentation.ts,BrandMark.tsx}`                                                                                                        | React e Lucide; não importa features                                                                                                 | `tests/browser/modal.spec.ts`. Preserve foco, Escape, labels e distinção entre clique externo e arraste de seleção.                                                                                                                                                                                                     |
| Persistência e normalização                | `src/lib/{repository.ts,local-demo.ts,workspace-data.ts}`                                                                                                                                                                 | `supabase.ts`, `seed.ts`, AppData; RPCs `load_workspace`/`save_workspace`                                                            | `tests/repository.test.ts`, SQL e browser/reload. `repository` coordena revisão remota; `local-demo` contém apenas localStorage; `workspace-data` valida/normaliza snapshots. Erro remoto nunca recai silenciosamente em modo local.                                                                                    |
| Datas, duração e dados iniciais            | `src/lib/{date.ts,duration.ts,seed.ts}`                                                                                                                                                                                   | Tipos de domínio; Intl e APIs nativas                                                                                                | `tests/rules.test.ts`, `tests/reports-update.test.ts`. Datas civis em São Paulo; auditoria UTC. Minutos são unidade armazenada; horas são apresentação.                                                                                                                                                                 |
| Banco e autorização                        | `supabase/migrations/*.sql` em ordem de nome; `docs/DATABASE.md`                                                                                                                                                          | PostgreSQL, Auth, Storage; formato AppData e RPCs                                                                                    | `tests/database.test.ts`, `tests/validity-database.test.ts`. Mudança de banco exige migração nova; nunca editar migração aplicada.                                                                                                                                                                                      |
| Tipos                                      | `src/types/{domain.ts,shared.ts}`; `features/*/types.ts`; tipos locais de relatório/dashboard                                                                                                                             | Apenas tipos; `domain.ts` compõe AppData e reexporta contratos                                                                       | `npm run typecheck`. Não importar componentes nem implementar regras nesses arquivos.                                                                                                                                                                                                                                   |

## Relações entre camadas

```text
app/page → Workspace → controlador + layout + WorkspacePages → features
controlador → activities/workflow → activities/service + incidents/service
controlador → repository → workspace-data + local-demo OU Supabase RPC
features de interface → serviços/seletores puros + UI compartilhada
reports/selectors → activities/visibility + incidents/service + checklists/service/metrics
daily-log → ActivityCards + ChecklistPanel + IncidentPanel + DailyValidity
validity/seletores e regras → calendário + tipos do próprio módulo
```

As features recebem `data` e callbacks; não acessam o estado React de outra feature. Serviços e seletores não importam componentes. `AppData` continua sendo a unidade de gravação transacional, com revisão por proprietário. O vínculo atividade/ocorrência é preparado sem persistência no workflow e gravado uma só vez pelo controlador. Não introduza dependências no sentido inverso dessas relações.

As fachadas `reports/service.ts`, `validity/service.ts`, as exportações de `lib/repository.ts` e o reexport de `ActivityCards` no diário preservam os caminhos públicos anteriores. Código novo dentro de um módulo deve usar o arquivo responsável diretamente; evite novos ciclos por fachadas.

## Estilos

`src/app/layout.tsx` importa `src/styles/globals.css`, que apenas compõe os arquivos abaixo **na ordem da cascata existente**:

`tokens` → `base` → `layout` → `daily-log` → `checklists-and-status` → `activity-and-incident-cards` → `dialogs-and-forms` → `data-views` → `reports-base` → `evidence-and-auth` → `responsive` → `print` → `incident-removal`.

Abra a folha correspondente à área solicitada. `tokens.css` contém variáveis de tema; `responsive.css`, breakpoints; `print.css`, impressão global. Estilos específicos de dashboard/PDF estão em `features/reports/reports.css`; gráficos e formulário de validades, em `features/validity/validity.css`. Não reordene imports para uma alteração visual localizada.

## Fluxo para a próxima tarefa

1. Identifique a funcionalidade e consulte esta tabela.
2. Leia os arquivos responsáveis e os testes indicados; amplie a análise somente pelas dependências necessárias.
3. Separe mudanças de interface, regra, estado e acesso a dados nos arquivos correspondentes.
4. Preserve contratos públicos, histórico e autorização; não refatore áreas não relacionadas.
5. Execute os testes pertinentes e `npm run typecheck`. Mudanças na composição, persistência ou contratos comuns justificam a suíte completa e browser.
6. Execute `npm run build` para validar integração de produção. Browser requer servidor separado em modo demonstração (`npm run dev` ou build sem variáveis Supabase).
7. Atualize este mapa e `docs/ARCHITECTURE.md` quando arquivos/responsabilidades mudarem; registre validações e informe os arquivos alterados.

```bash
npm test
npm run typecheck
npm run build
# Em outro terminal, com servidor local em execução:
npm run test:browser
# Servidor em outra porta:
TEST_BASE_URL=http://127.0.0.1:3001 npm run test:browser
```

Configuração e execução: `README.md` e `.env.example`. Modelo e políticas: `docs/DATABASE.md`. Publicação: `docs/DEPLOYMENT.md`. Evidências e limites: `docs/VALIDATION.md`. Registro desta reorganização: `docs/REFACTORING.md`.

## Alterações localizadas da versão 0.4.0

- **Formulário e descrição:** `activities/ActivityForm.tsx` usa `activities/description.ts`. `Activity.description` é opcional; registros antigos exibem seus textos anteriores sem migração destrutiva. Ao editar, o formulário preserva o payload existente antes de aplicar os novos valores. Cartões antigos mantêm o resumo `result/procedure`; novos cartões usam a descrição.
- **Remoção de atividade:** `removeActivity`/`restoreActivity` em `activities/service.ts` alteram somente `deletedAt`. `visibility.ts` exclui atividades removidas e vinculadas a ocorrências removidas das telas normais. `RemovedActivityHistory.tsx` oferece restauração por loja. Eventos de ocorrência e evidências continuam vinculados ao mesmo ID.
- **Resolução explícita:** `incidents/IncidentUpdateForm.tsx` sincroniza Status e Resolvido? por `statusForResolution`. Não há flag redundante no banco: Sim significa evento Concluído; Não reabre quando necessário. Histórico e data permanecem no evento.
- **Técnico objetivo:** `reports/report/technical-fields.ts` define os seis campos e o fallback N/A. `ReportIncidentSections.tsx` mostra concluídas/pendentes em colunas usando situação no fim do mês. `reports/calendar.ts` formata o mês; `summary.ts` monta linhas separadas. Planilha conserva colunas antigas e acrescenta descrição/classificação/data de resolução.
- **Verificação:** `tests/activity-lifecycle.test.ts`, `tests/incident-resolution.test.ts`, `tests/report-objectivity.test.ts`, `tests/browser/v040.spec.ts`; o teste SQL existente confirma que os novos campos e os legados sobrevivem ao roundtrip sem migração.

Detalhes e compatibilidade: `docs/RELEASE_0.4.0.md`. Esta mudança funcional sucede a refatoração estrutural descrita em `docs/REFACTORING.md`.

## Miniupdate 0.1.4 — títulos padrão, cartões e marca

| Área                     | Arquivos responsáveis                                                                                                                                                                                                         | Relações e validação                                                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogo por usuário     | `features/settings/title-presets/{types.ts,service.ts,TitlePresetManager.tsx,title-presets.css}`; integração em `settings/Settings.tsx`                                                                                       | `AppData.titlePresets?`; criação/edição/remoção não modifica atividades. `tests/title-presets.test.ts`, `tests/title-presets-database.test.ts`, `tests/browser/v014.spec.ts`.                               |
| Título composto          | `features/activities/{ActivityTitleFields.tsx,title-fields.ts,title-fields.css,ActivityForm.tsx,types.ts}`                                                                                                                    | Consome serviço puro do catálogo; salva título completo e snapshot opcional de ID/prefixo/complemento. `tests/activity-title-presets.test.ts` e browser v014. Não fazer parsing de títulos antigos.         |
| Persistência do catálogo | `lib/{seed.ts,workspace-data.ts}`; `supabase/migrations/202611110001_title_presets.sql`                                                                                                                                       | Coluna `workspace_settings.title_presets` herda RLS; RPC mantém revisão e preserva omissão de clientes antigos. Lista vazia explícita remove o catálogo. Teste SQL verifica rollback e isolamento.          |
| Cores e cópia            | `components/ui/{statusPresentation.ts,TechnicalStatusBadge.tsx,CopyTicketButton.tsx}`; `activities/ActivityCards.tsx`, `incidents/IncidentPanel.tsx`; CSS em `styles/{activity-and-incident-cards,checklists-and-status}.css` | Status técnico tem cores próprias; não mudar a contagem/status de checklist. Clipboard só confirma após sucesso e não abre o registro. Browser v014 cobre quatro cores, dois temas e falha/espera de cópia. |
| Marca TI Diário          | `components/ui/BrandMark.tsx`, `public/icon.svg`, `app/layout.tsx`, layout/sidebar/footer, auth e rótulos de relatórios                                                                                                       | Ícone vetorial compartilhado, favicon com versão para cache. Downloads usam `ti-diario-`; chaves antigas de storage, URLs e nomes de RPC/bucket permanecem estáveis.                                        |

Aplique somente a migração nova em um banco já configurado. Títulos anteriores são snapshots, sem chave estrangeira que imponha a existência do padrão no catálogo. A busca continua usando `Activity.title` completo. Quando alterar a composição do título, verifique também edição legada, ocorrências criadas junto, busca e exportação. Consulte `docs/RELEASE_0.1.4.md`.
