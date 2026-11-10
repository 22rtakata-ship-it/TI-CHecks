# Histórico

## v0.1.3 — primeira versão no GitHub — 10/11/2026

Primeiro snapshot versionado do repositório, reunindo o código atual já validado: diário, atividades, ocorrências, checklists, validades, evidências privadas, dashboard, relatórios, configurações e autenticação. Inclui arquitetura modular, PROJECT_MAP.md, AGENTS.md, migrações e testes. A versão inicial do Git foi definida como 0.1.3 pelo proprietário; as seções abaixo registram etapas de desenvolvimento e publicações anteriores na Vercel, não tags Git preexistentes. Não houve alteração funcional ou migração nesta publicação. Detalhes em `RELEASE_0.1.3.md`.

## 0.4.0 — 10/11/2026

Formulário de atividade simplificado com descrição e botão de acompanhamento; remoção confirmada e restauração, preservando campos legados, vínculos e anexos. Atualização de ocorrência com Status, Resolvido? e relato obrigatório. Técnico com seis campos e N/A, concluídas/pendentes em colunas com datas/status do período. Resumo em linhas e mês por extenso. XLSX mantém detalhes anteriores e acrescenta descrição/classificação/data de resolução. Sem dependências ou migrações novas. Detalhes em `RELEASE_0.4.0.md`.

## Refatoração estrutural — 09/11/2026

Composição e estado do workspace separados; workflow atividade/ocorrência extraído da interface. Dashboard, prévia e exportação divididos por responsabilidade. Validades separadas em calendário, regras, seletores, métricas e componentes. Cartões de atividade compartilhados pelo diário e histórico; normalização e armazenamento local separados das RPCs. CSS global dividido mantendo a cascata original. Fachadas e contratos públicos preservados, sem dependências ou migrações novas. `PROJECT_MAP.md` passa a ser o mapa canônico para manutenção localizada; `AGENTS.md` estabelece o fluxo de trabalho. Verificações em `REFACTORING.md` e `VALIDATION.md`.

## 0.1.0 — 03/11/2026

Primeira versão funcional modular: diário, atividades/editoração com revisão, ocorrências e histórico, checklists recorrentes com vigência, relatórios, indicadores, categorias e demonstração local explícita. Adaptador Supabase, login, RPCs transacionais, RLS e armazenamento privado preparados. Exportação XLSX e PDF via impressão. Testes de domínio, banco/RLS e navegador. Integração remota depende de configuração do projeto Supabase.

## 0.1.1 — preparação da persistência na nuvem — 03/11/2026

Gravação remota exige usuário e confirmação da revisão; cache de revisão separado por conta. Erros de autenticação liberam o formulário para nova tentativa. Nova migração rejeita documentos incompletos antes de alterar registros. Importação explícita dos dados de demonstração do mesmo navegador para uma conta ainda vazia, mantendo a cópia local. Estas alterações aguardam configuração do Supabase e novo deploy para entrar na aplicação publicada.

## 0.1.2 — conexão Supabase — 03/11/2026

Banco real criado e migrado, configuração pública adicionada à Vercel e nova versão publicada com login. Adicionado fluxo de definição de senha por convite, recuperação por e-mail e proteção da tela de senha por sessão válida. Validação de durabilidade e isolamento no banco real concluída; convite e teste Auth direto aguardam atualização de rede do ambiente.

Validação final da versão 0.1.2: Auth, armazenamento privado, persistência em segunda sessão e fluxo Chromium de produção passaram. Convite inicial enviado. O site publicado exige login e salva os registros no Supabase; a definição da senha inicial cabe ao proprietário via e-mail.

## 0.2.0 — 07/11/2026

Tempo em horas/minutos na interface e nos relatórios; XLSX em horas numéricas. Remoção reversível de ocorrências com preservação de vínculos. Corrigido fechamento acidental de formulários ao arrastar seleção para fora do modal. PDF com escolha claro/escuro. Categoria Celulares com migração incremental e busca de chamados normalizada. Dashboard reorganizado com filtro mensal e separação das previsões futuras. Consulte `RELEASE_0.2.0.md` para os módulos e contratos alterados.

## 0.3.0 — 09/11/2026

NA fora do percentual de execução, barra de distribuição colorida e consulta de datas não preenchidas. Atividades de ocorrências removidas saem do diário/histórico/indicadores, com restauração reversível. Novo registro de validades em dias úteis, três contagens, gráficos e histórico mensal por loja. Migração com RLS/unicidade e compatibilidade com clientes antigos. Detalhes em `RELEASE_0.3.0.md`.
