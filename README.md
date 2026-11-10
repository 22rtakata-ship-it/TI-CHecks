# TI Log

Diário técnico de atividades de TI, com interface em português, arquitetura por funcionalidade, tema claro/escuro e layout responsivo.

**Primeira versão no GitHub: `v0.1.3`.** Este snapshot reúne o código atual, incluindo a reorganização modular e os recursos entregues até agora. Os números 0.2.0, 0.3.0 e 0.4.0 nas anotações anteriores identificam etapas de desenvolvimento/publicações na Vercel, anteriores ao primeiro commit. A numeração inicial deste repositório foi definida como 0.1.3 pelo proprietário. Consulte [RELEASE_0.1.3.md](docs/RELEASE_0.1.3.md).

## Executar

Requer Node.js 22 ou superior (validado com Node 24) e npm.

```bash
npm ci
npm run dev
```

No ambiente de onboarding o servidor usa a porta 3000. Não é necessário banco para experimentar a demonstração. Para produção: `npm run build` e `npm start`.

## Persistência e acesso

**Sem configuração:** demonstração identificada na interface. Usa `localStorage` deste navegador, sem autenticação, backup automático ou sincronização. Limpar dados do navegador apaga os registros. Não utilize dados corporativos reais. Não há dados de atividades fictícios pré-carregados. Os modelos iniciais de checklist são fornecidos automaticamente.

**Com Supabase:** copie `.env.example` para `.env.local`, informe a URL do seu projeto e a chave pública anon/publishable em `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Nunca use service_role. Execute os arquivos SQL de `supabase/migrations/` em ordem de nome no SQL Editor de um projeto novo; crie o usuário em Authentication no painel Supabase e reinicie o aplicativo. O acesso usa e-mail/senha, sem cadastro público. O bucket privado é criado pela migração. Na nuvem, permita também o hostname exato do seu projeto Supabase na configuração de rede.

A ausência de credenciais impede a validação remota: autenticação real e upload/download devem ser verificados no projeto configurado. Os testes locais exercitam SQL, RPCs e RLS em PostgreSQL embarcado com esquemas de autenticação/storage simulados. Não substituem um teste no serviço Supabase real.

## Versão funcional entregue

- Diário por data e loja, navegação de dias e calendário; atividades sem chamado obrigatório, edição e histórico.
- Ocorrências com intervenções vinculadas, atualizações datadas, resolução/reabertura e acompanhamento separado da produtividade.
- Modelos semanais ou únicos, vigência das alterações, execução com justificativa obrigatória para “Não”/“Não se aplica”, histórico e prevenção de duplicação.
- Categorias configuráveis e backup JSON para download.
- Dashboard com métricas reais, gráficos por categoria, totais por loja e indicadores separados.
- Relatórios gerencial/técnico com filtros, resumo editável, prévia, XLSX real, texto para e-mail e PDF pela impressão do navegador.
- Adaptador Supabase, login, persistência transacional com controle de concorrência e RLS por proprietário.
- Evidências privadas, vínculo a atividade/ocorrência, antes/depois, prévia, acesso temporário, remoção confirmada e limites de formato/tamanho. Disponíveis apenas no modo Supabase.

## Limites e próximos passos

Esta é uma primeira versão. Administração de usuários/lojas/setores, compartilhamento entre usuários, recuperação de senha na interface, importação de backup, análise automática de recorrência e entrega automática por e-mail estão pendentes. PDF usa o diálogo “Salvar como PDF”; não há gerador de PDF em servidor. Edições do resumo valem para a prévia atual, impressão e cópia; não são arquivadas. XLSX exporta os registros estruturados, não o resumo editável. Checklists não possuem subetapas, por decisão de escopo. O formulário de anexos fica no módulo Evidências após salvar o registro.

O banco usa tabelas por entidade com payload JSONB tipado e colunas relacionais/constraints para identidade, datas e vínculos. A gravação transacional substitui os registros **do usuário atual** com revisão otimista; é adequada ao uso individual inicial. Para alto volume, implementar operações incrementais/paginação. Ocorrências têm remoção reversível; suas atividades vinculadas são ocultadas e voltam com a restauração. Modelos com execuções podem ser desativados, mas não excluídos. Programações são globais por usuário e se aplicam a ambas as lojas; cada execução tem contexto de loja próprio.

## Testes

```bash
npm test
npm run typecheck
npm run build
# Com npm run dev em outro terminal:
npm run test:browser
```

Os testes de navegador usam `/usr/bin/chromium` quando presente; em outra máquina execute `npx playwright install chromium`. Veja `docs/VALIDATION.md` para evidências e limitações da validação realizada.

## Estrutura

```text
src/app/                    entrada Next.js e layout raiz
src/components/layout/      composição, navegação, sessão e coordenação de estado
src/components/ui/          componentes compartilhados
src/features/activities/    formulário, tipos e regras de atividades
src/features/daily-log/     composição do diário por data
src/features/incidents/     acompanhamento e transições
src/features/checklists/    modelos, vigência, execução e recorrência
src/features/evidence/      arquivos privados
src/features/reports/       seletores, resumo, planilha e exportação
src/features/reports/dashboard/ seções de indicadores e consulta de datas
src/features/reports/report/ filtros, prévia e hooks de exportação
src/features/validity/      registro, calendário, métricas e seletores
src/features/validity/components/ gráficos, resumo e histórico
src/features/settings/      categorias e backup
src/features/auth/          login
src/lib/                    datas, repositório, normalização, modo local e Supabase
src/types/                  contrato de composição e tipos compartilhados
src/styles/                 folhas por área, tema, responsividade e impressão
supabase/migrations/        schema, RPCs, RLS e bucket privado
tests/                      regras, SQL/RLS e testes de navegador
docs/                       arquitetura, mapa, banco e validação
```

Para futuras alterações com Codex, leia [AGENTS.md](AGENTS.md) e [PROJECT_MAP.md](PROJECT_MAP.md). O mapa indica arquivos, serviços, dependências e testes de cada funcionalidade; abra apenas o contexto necessário. [docs/FEATURE_MAP.md](docs/FEATURE_MAP.md) aponta para o mesmo mapa. A reorganização e suas verificações estão em [docs/REFACTORING.md](docs/REFACTORING.md).

## Aplicação publicada

Acesse https://ti-log.vercel.app. A publicação atual está conectada ao Supabase e exige login. O primeiro acesso usa um convite para definir senha. A cópia de demonstração do mesmo navegador pode ser importada explicitamente em uma conta ainda sem histórico. Detalhes de publicação e futuras atualizações: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Atualização 0.1.1

Horas e minutos no diário/dashboard/relatórios, PDF claro ou escuro, remoção/restauração de ocorrências, categoria Celulares e busca de chamado normalizada. A duração continua sendo informada em minutos no formulário. Detalhes: [docs/RELEASE_0.2.0.md](docs/RELEASE_0.2.0.md).

## Atualização 0.1.2

Não aplicáveis fora da porcentagem de checklist e em cor própria na barra. Consulta das datas não preenchidas. Remover ocorrência também oculta suas atividades vinculadas, mantendo restauração. Nova box Validades no diário de segunda a sexta e aba mensal com barras, histórico e comparação por loja. [Detalhes e arquivos](docs/RELEASE_0.3.0.md).

## Atualização 0.1.3

Atividades com formulário simplificado, descrição, abertura de ocorrência e remoção/restauração. Acompanhamento com Status, Resolvido? e relato. Técnico com campos objetivos e N/A, ocorrências concluídas/pendentes em colunas e resumo com mês por extenso e linhas separadas. Dados anteriores preservados. [Detalhes e compatibilidade](docs/RELEASE_0.4.0.md). Estrutura reorganizada conforme [PROJECT_MAP.md](PROJECT_MAP.md) e [REFACTORING.md](docs/REFACTORING.md).
