# v0.1.3 — primeira versão no GitHub

Este é o primeiro snapshot do código no repositório [22rtakata-ship-it/TI-CHecks](https://github.com/22rtakata-ship-it/TI-CHecks), com tag `v0.1.3` e versão 0.1.3 nos manifests npm.

A pedido do proprietário, a primeira publicação Git usa 0.1.3 e contém o estado atual completo da aplicação. Os registros anteriores 0.2.0, 0.3.0 e 0.4.0 documentam etapas de desenvolvimento e publicações na Vercel antes da criação deste histórico Git; seus arquivos foram preservados como documentação. Não representam branches, commits ou tags anteriores deste repositório.

## Conteúdo

- Diário por data/loja; atividades com descrição, edição e remoção/restauração.
- Ocorrências com histórico, resolução/reabertura e intervenções vinculadas.
- Checklists recorrentes, justificativas e percentual sem não aplicáveis.
- Registro diário de validades e evolução mensal por loja.
- Evidências privadas, autenticação e persistência Supabase com RLS/revisões.
- Dashboard, relatórios técnico/gerencial, PDF claro/escuro e XLSX.
- Estrutura modular, mapa de responsabilidades e instruções de manutenção.
- Migrações SQL, testes de domínio/banco e fluxos de navegador.

Esta publicação altera somente a identificação da versão e a documentação. Não modifica o comportamento, os dados de produção ou o deployment Vercel.

Validação desta identificação: `npm test` passou com 108 testes em 12 arquivos; `npm run typecheck`, Prettier dos arquivos alterados e `git diff --cached --check` passaram. O mesmo código funcional já havia passado por build, 16 testes de navegador e validação no site real, conforme `VALIDATION.md`.

## Configuração e manutenção

Instalação e execução: [README.md](../README.md). Banco novo: aplicar as migrações em ordem conforme [DATABASE.md](DATABASE.md). `.env.example` contém apenas campos vazios; credenciais devem ser configuradas fora do Git.

Localização dos módulos e testes: [PROJECT_MAP.md](../PROJECT_MAP.md). Fluxo para futuras tarefas: [AGENTS.md](../AGENTS.md). Validações do código completo e da aplicação publicada: [VALIDATION.md](VALIDATION.md).
