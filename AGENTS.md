<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TI Log — orientações para futuras tarefas

1. Consulte primeiro `PROJECT_MAP.md`, o mapa canônico na raiz. `docs/FEATURE_MAP.md` é um índice de compatibilidade.
2. Identifique qual módulo será alterado antes de investigar código.
3. Investigue prioritariamente os arquivos desse módulo.
4. Consulte outros módulos somente pelas dependências ou impactos necessários.
5. Evite varreduras gerais sem justificativa.
6. Não refatore áreas não relacionadas à solicitação.
7. Preserve funcionalidades e dados existentes, incluindo histórico e políticas RLS.
8. Execute os testes indicados no mapa e a verificação de tipos. Mudanças em composição, persistência ou contratos comuns exigem verificar impactos, suíte completa, build e fluxos de navegador pertinentes.
9. Atualize `PROJECT_MAP.md` e a documentação de arquitetura quando houver modificações estruturais; não mantenha mapas divergentes.
10. Informe os arquivos alterados ao finalizar.

Use o checkout existente: cada tarefa na nuvem já é isolada. Não crie worktrees sem solicitação explícita. Nunca use a chave service_role no navegador. Nunca trate armazenamento de demonstração como persistência corporativa. A ausência de resposta ao checklist é “A fazer”. Não transforme pendências antigas em atividades novas. Datas de expediente são datas civis de São Paulo; timestamps de auditoria são UTC. Não desabilite TLS, RLS ou validações para fazer testes passarem.

## Como localizar e alterar

Identifique a feature na tabela de `PROJECT_MAP.md`, abra seus arquivos e testes e siga apenas as dependências necessárias. Uma correção simples não justifica reler toda a aplicação. Explique a necessidade de ampliar a investigação quando houver impacto entre módulos. Não refatore áreas vizinhas apenas por preferência.

Mantenha componentes de interface nas features ou no layout, regras nos serviços/workflows/seletores, estado e efeitos nos hooks e acesso a dados em `src/lib`. Não crie abstrações, dependências ou fachadas extras sem necessidade. Tipos não importam componentes; serviços não importam interface. Preserve os caminhos públicos reexportados enquanto houver consumidores.

O layout coordena uma gravação por operação e só atualiza a memória após confirmação. Preserve a revisão por proprietário, a proteção contra salvamentos simultâneos e o encerramento dos formulários ao trocar conta. Nunca use número de chamado para inferir vínculo de ocorrência; use `incidentId`. NA não entra no denominador dos checklists; registro de validade ausente não equivale a zero. Migrações aplicadas são imutáveis.

Em refatorações estruturais, preserve texto, DOM, classes, ordem da cascata CSS, regras e formatos persistidos. Faça extrações incrementais e valide cada responsabilidade movida. Corrija os erros introduzidos antes de considerar a tarefa concluída. Ao finalizar, informe os arquivos alterados, validações executadas e limitações reais.

## Versionamento definido pelo proprietário

Siga o formato **(versão estável).(versão em teste).(miniupdate da versão em teste)**. Esta é a convenção do projeto; não substitua seu significado automaticamente por outra política de versionamento.

- Primeiro número: versão estável. Permanece `0` enquanto a proposta inicial estiver em testes; a primeira versão estável e completa será `1.0.0`.
- Segundo número: versão em teste. Uma nova versão de teste passa, por exemplo, de `0.1.x` para `0.2.0`.
- Terceiro número: miniupdates da mesma versão de teste, por exemplo, `0.1.3` → `0.1.4`.

Ao publicar uma nova versão, mantenha `package.json`, a entrada raiz de `package-lock.json`, a tag Git `vX.Y.Z`, README e notas da versão alinhados. Preserve edições do proprietário e o histórico existente; não mova tags já publicadas. A promoção para `1.0.0` só deve ocorrer quando a versão de teste estiver estável e completa em relação à proposta, sem promovê-la apenas porque os testes automatizados passaram. Uma atualização de instruções, por si só, não publica uma nova versão do aplicativo.
