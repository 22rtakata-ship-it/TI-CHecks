# Validação da primeira versão

Executada em 03/11/2026, checkout `/workspace/TI-CHecks`, Node 24.19.0, npm 11.9.0, Next.js 16.4.4 e Chromium do sistema.

## Resultados

- `npm ci --cache /workspace/.npm-cache --no-audit --no-fund`: passou; instalação reproduzível usando package-lock.json.
- `npm test`: **15 testes passaram**, em 2 arquivos. Inclui cenário sem chamado, edição com revisão, sexta-feira 08/01/2027, domingo, justificativas, não duplicação, programação segunda/quarta, vigência/histórico, resolução entre meses, reabertura, evento anterior à abertura, separação de indicadores e validação de arquivos.
- Teste de banco incluído nos 15: migração aplicada em PostgreSQL embarcado PGlite; gravação e leitura via RPC; conflito de revisão; rollback de execução inválida/duplicada; entidades vinculadas e projeção de eventos; RLS entre dois usuários e política de caminho de arquivos.
- `npm run typecheck`: passou.
- `npm run build`: passou, gerou a rota principal de produção.
- `npm run test:browser`: **2 testes passaram** em Chromium: atividade sem chamado com 10 minutos, edição, recarregamento, checklist com motivo, ocorrência e resolução em outro dia, relatório e download XLSX; navegação em 390 px, ausência de transbordamento horizontal, tema escuro e cadastro de modelo segunda/quarta. O conteúdo da planilha e a renderização de PDF pela mídia de impressão também são verificados pelo teste.
- Requisição HTTP interna ao servidor: respondeu com sucesso; funcionalidades verificadas pelo navegador, além da resposta HTTP.

## Falhas diagnosticadas e corrigidas

O sandbox inicialmente impediu conexões ao proxy e a compilação com subprocessos; instalação e build foram executados com escalada aprovada, mantendo proxy, TLS e verificações. O servidor de desenvolvimento bloqueava a origem 127.0.0.1 usada nos testes; foi adicionada explicitamente em `allowedDevOrigins`, conforme documentação da versão instalada. Campos foram ajustados para associação explícita entre label e input/select. Os testes foram repetidos após as correções.

## Limitações da evidência

Não há URL/chave de projeto Supabase nem usuário real configurados. Autenticação remota, API Storage, URLs assinadas e comportamento no serviço hospedado **não foram executados**. Os esquemas auth/storage do teste embarcado simulam os contratos PostgreSQL necessários para testar políticas; não simulam toda a infraestrutura Supabase. É necessário repetir o fluxo com dois usuários e anexos no projeto real antes de uso corporativo.

O PDF da interface usa impressão/“Salvar como PDF” do navegador; não é PDF produzido no servidor. O teste gera PDF da mesma mídia de impressão pelo Chromium. O relatório não infere serviços nem inventa resultados.

## Ambiente reutilizável

Os campos `install_script` e `start_skill` foram salvos no rascunho de configuração. Incluem diretório correto, instalação com lockfile, testes, build, reinício do processo e verificações internas. O usuário deve revisar/salvar nas configurações e publicar o ambiente para ativar o snapshot. Não foi feita publicação, nem restauração em uma nova tarefa foi validada. Nenhuma alteração de allowlist foi necessária para a demonstração; o domínio específico do projeto Supabase deverá ser adicionado ao configurar esse serviço.

## Preparação da persistência autenticada — 03/11/2026

Após a solicitação de dados na nuvem: `npm test` passou com **21 testes em 3 arquivos**, incluindo `tests/repository.test.ts`; `npm run typecheck` e `npm run build` passaram; os **2 testes de navegador também passaram** contra o build local de produção. O teste de banco aplica as duas migrações e confirma que snapshots incompletos/tipos inválidos/revisões ausentes não apagam dados. O adaptador não recai em localStorage quando existe Supabase configurado sem sessão, não grava localmente em erro remoto e exige confirmação de revisão. A importação local exige ação explícita numa conta remota sem histórico salvo, mantém a cópia local e não sobrescreve uma conta que recebeu gravação concorrente.

A conta Vercel foi consultada: projeto TI Log sem variáveis de banco e sem integrações instaladas. A integração Supabase está disponível no Marketplace, mas não foi instalada/provisionada. Foi solicitado o requisito de acesso de gestão Supabase em `docs/CLOUD_SETUP.md`; nenhum banco real foi criado e nenhuma gravação remota Supabase foi alegada. O site publicado continua na versão anterior de demonstração até a configuração do serviço e um novo deploy.

## Banco Supabase real — 03/11/2026

Organização e projeto gratuitos criados por API de gestão, migrações inicial e de proteção aplicadas. Teste real gravou e confirmou transação, recuperou o mesmo registro em outra conexão PostgreSQL e verificou que outro contexto autenticado não o enxergava. Todos os usuários/dados sintéticos foram removidos. Os contextos foram estabelecidos via API de gestão/role PostgreSQL; isso valida o banco real e RLS, mas não representa login pela API Auth.

Vercel recebeu somente as duas variáveis públicas do cliente. O deploy com autenticação e telas de nova senha/recuperação atingiu READY/PROMOTED. TypeScript e os 21 testes locais passaram após essas alterações. REST Auth e envio do convite estão pendentes da allowlist: a requisição direta ao domínio do projeto recebeu CONNECT 403 neste ambiente. Nenhuma alteração pública de RLS ou desativação de TLS foi usada para contornar a restrição.

## Validação remota completa — 03/11/2026

Após salvar a allowlist: site principal HTTP 200; REST Auth e Data API com contas sintéticas passaram em login, gravação de atividade, leitura em um segundo login e isolamento de outro usuário. Storage: upload privado, URL assinada, bloqueio de outro usuário e de acesso público confirmados. Todos os objetos e usuários sintéticos removidos.

Fluxo real em Chromium contra https://ti-log.vercel.app passou em: ativação/definição de senha, importação explícita da cópia local para conta vazia, preservação da cópia de navegador, criação de atividade remota, upload/remoção de arquivo privado e leitura das duas atividades em novo navegador após login. O teste usou link gerado para conta temporária, sem enviar e-mail de teste nem ler e-mail do proprietário. Um seletor inicial de toast foi corrigido e o fluxo completo foi repetido com sucesso.

Convite de ativação enviado para o endereço autorizado pelo proprietário. A senha será definida pelo usuário no próprio site, sem exposição no chat. A entrega na caixa de entrada não foi lida ou presumida. A publicação do snapshot do ambiente Codex falhou; as configurações de runtime foram aplicadas e o deploy Vercel está funcional, independentemente dessa publicação de snapshot.

## Atualização 0.2.0 — 07/11/2026

- `npm test`: **52 testes passaram**, incluindo formatação de horas, XLSX numérico, corte de checklists futuros, remoção/restauração, busca normalizada e migração idempotente de categorias.
- `npm run typecheck` e `npm run build`: passaram.
- `npm run test:browser`: **8 testes passaram** em Chromium. Cobrem seleção de texto arrastada para fora dos formulários, toque/cancelamento, fechamento intencional e foco, busca por chamado, categoria Celulares, confirmação/cancelamento/restauração de ocorrência, horas no dashboard/relatórios, responsividade, exportação XLSX e PDF nos dois temas.
- PDFs claro e escuro foram gerados e renderizados para inspeção visual. O teste detectou uma borda de página escura no PDF claro com o app em dark mode; o CSS do canvas de impressão foi corrigido e a geração foi repetida. O foco após modal também foi corrigido, mantendo todas as verificações de teste.
- A migração aditiva de Celulares foi aplicada ao banco real. Contagens e fingerprints de payloads de atividades, ocorrências, modelos, execuções e evidências permaneceram iguais antes/depois, sem ler ou exibir conteúdo dos registros.

A validação funcional remota da nova versão utiliza somente usuário temporário isolado e é registrada após o deploy. O deploy não realiza remoções de ocorrências existentes.

Validação da 0.2.0 publicada: Chromium no domínio real confirmou a mesma atividade em nova sessão, remoção/restauração de ocorrência com atividade/anexo preservados, busca normalizada, Celulares, formato de horas, dashboard em 390px, os dois temas de PDF e conteúdo numérico de horas no XLSX. Usuário sintético e arquivos temporários removidos. Deployment confirmado READY/PROMOTED. Conferência final das contagens/fingerprints dos registros preexistentes realizada após a limpeza dos testes.

## Atualização 0.3.0 — 09/11/2026

- `npm test`: **88 testes passaram**, cobrindo NA fora do percentual, barra/distribuição, remoção com ocultação das atividades vinculadas, validades por loja/data e validações SQL/cliente legado. A execução limita workers a2 para evitar concorrência excessiva de instâncias PostgreSQL WASM; o teste de migração com inicialização de banco usa o mesmo prazo de20s dos demais testes SQL, mantendo todas as verificações.
- `npm run typecheck` e `npm run build`: passaram.
- `npm run test:browser`: **12 testes passaram**, incluindo formulário e gráficos de validades, zero/ausência, edição sem duplicar, isolamento de loja, consulta de datas não preenchidas, exemplo8concluídos+1NA=100% e atividades de ocorrências já removidas fora da busca.
- Migração `202611090001_validity_records.sql` aplicada ao Supabase real. Contagens/fingerprints dos cinco conjuntos de registros preexistentes permaneceram iguais antes e depois. Apenas a nova tabela/RPCs foram criadas/atualizadas.

A validação da versão publicada utiliza conta temporária isolada; os resultados remotos são registrados ao final do deploy. Não foram usados registros do proprietário para testar escrita.

Validação remota 0.3.0 concluída no domínio de produção: NA fora do percentual e destacado na barra, consulta de datas pendentes, remoção em cascata de visibilidade por incidentId, preservação de atividade independente com mesmo chamado, validades salvas/editadas sem duplicação, leitura em outra sessão, evolução mensal por loja e compatibilidade de salvamento legado sem apagar validades. Usuário e dados temporários removidos. Deploy READY/PROMOTED; conferência final dos fingerprints dos dados preexistentes realizada após a limpeza. Um seletor do teste remoto foi limitado ao painel de checklists para distinguir seu percentual do percentual das categorias; o fluxo completo foi repetido com sucesso, sem alteração de aplicação.

Conferência de concorrência na publicação 0.3.0: durante a execução foram adicionadas uma atividade e uma execução de checklist, além de alteração de remoção em ocorrência. A comparação integral, portanto, deixou de ser idêntica ao início. A verificação do subconjunto anterior por data e dos históricos de ocorrência, desconsiderando somente marcas de remoção posteriores à referência para comparação, confirmou os payloads anteriores preservados. Nenhum dado foi revertido para forçar igualdade; as novas gravações e remoções foram respeitadas.

## Refatoração e versão 0.4.0 — 10/11/2026

- Antes dos novos recursos, a refatoração passou pelos testes pertinentes e pela suíte existente: **88 testes em 9 arquivos**. Estado/efeitos, normalização e corpos dos serviços extraídos foram comparados com cópias anteriores. A expansão das folhas CSS globais foi confirmada byte a byte igual ao arquivo original.
- Após os recursos solicitados: `npm test` passou com **108 testes em 12 arquivos**. Inclui descrição legada, criação de acompanhamento, remoção/restauração com vínculos preservados, resolução/reabertura, mês por extenso, N/A, corte mensal de ocorrências e conteúdo XLSX. O teste SQL verifica os campos novos e antigos no mesmo payload persistido.
- `npm run typecheck` e `npm run build`: passaram. O primeiro build no sandbox falhou ao ler a saída de um subprocesso TypeScript; repetido com subprocessos permitidos, compilou e gerou a rota de produção. Nenhuma opção de compilação ou segurança foi desabilitada.
- `npm run test:browser`: **16 testes passaram**. Depois dos ajustes finais de compactação de cartões e paginação, os **7 testes de atividades/relatórios relevantes passaram novamente**. Cobrem criação sem chamado, edição preservando legados, confirmação/cancelamento de remoção, recarregamento/restauração, relato obrigatório, resolução/reabertura, técnico com N/A, colunas responsivas, XLSX e PDF claro/escuro.
- Comparação de screenshots e DOM normalizado: **22 de 26 telas idênticas** ao baseline; os quatro relatórios diferem conforme o pedido autorizado (desktop/celular nos dois temas). Nenhum erro de navegador ou transbordamento horizontal. Mais **12 capturas dos novos formulários/relatório** e **2 PDFs** foram inspecionados; título e colunas de ocorrências permanecem juntos quando cabem na página.
- Grafo estático dos **82 arquivos TypeScript**, com **173 dependências de execução**: nenhum ciclo ou import interno não resolvido. Imports exclusivamente de tipos foram desconsiderados nessa análise.
- Prettier passou em `src`, `tests`, mapas, instruções, documentos da alteração e manifests. Não houve instalação de dependência ou migração.

Os testes de comparação visual usam fixtures locais sintéticas. O baseline de Reports foi reconstruído da leitura original e conferido contra um checkpoint, preservando a proteção NA adicionada depois dele; não representa uma captura do histórico corporativo real. A conclusão da publicação e verificação remota é registrada abaixo após sua execução.

Validação remota 0.4.0 concluída em https://ti-log.vercel.app após READY/PROMOTED. Conta sintética isolada confirmou preservação de campos legados/revisões, nenhuma duplicação de eventos ao editar, atividade sem chamado, ocorrência vinculada, resolução/reabertura datada e relato obrigatório. Upload privado, remoção persistida em segunda sessão e restauração preservaram payload e evidência. Conferidos seis campos/N/A, resumo com mês por extenso e linhas, datas/status nas colunas, horas no dashboard, XLSX com horas numéricas e descrição, os dois temas de PDF e responsividade. Wrapper confirmou remoção da conta e dos objetos de teste. Não foi utilizada a conta real do proprietário.

Conferência final após limpeza: contagens e fingerprints de atividades, ocorrências, modelos, execuções e evidências permaneceram iguais à referência anterior à publicação. Nenhum conteúdo corporativo foi exibido nessa conferência. Validades não integravam esse conjunto de fingerprints; o código de sua persistência e as migrações não foram alterados.

## Miniupdate 0.1.4 — TI Diário — 11/11/2026

- `npm test`: **135 testes em 15 arquivos passaram**. Cobertura de títulos compostos, limite, duplicação sem acentos/caixa/espaços, snapshots históricos, edição de legado e persistência SQL/RLS do catálogo.
- `npm run typecheck` e `npm run build`: passaram; pacote final gerado após as correções visuais.
- `npm run test:browser`: **24 testes passaram**. Inclui CRUD de padrões, recarregamento, busca, edição histórica após renomear/remover, quatro cores nos dois temas, cópia com sucesso/falha/espera, marca/favicon, backup e título de 180 caracteres no celular. Os fluxos existentes de checklist, validades, remoção/restauração, PDF e XLSX continuam passando.
- Revisão visual com fixtures locais: cadastro, formulário e cartões legíveis em desktop/celular e nos dois temas. Mais **16 capturas finais de título-limite** sem overflow nem erros de página. Contraste dos badges entre **5,35:1 e 5,90:1** no claro e **7,08:1 e 7,78:1** no escuro. Clipboard local confirmou cópia sem abrir modal.
- Problemas encontrados e corrigidos: o seletor de erro de cópia foi limitado ao componente para distinguir o announcer interno do Next.js; prefixos longos sem espaços passaram a quebrar corretamente na prévia, cartões, cabeçalho/histórico do modal e relatório. O conteúdo completo é preservado.
- Prettier dos arquivos da alteração e `git diff --check`: passaram. Nenhuma dependência nova.

Migração `202611110001_title_presets.sql` aplicada ao Supabase real em transação, sem reescrever payloads anteriores. Comparação de contagens/fingerprints de sete conjuntos detectou uma atualização de ocorrência e incremento de revisão durante o uso. A reconstrução da referência anterior exclusivamente para comparação por digest confirmou os históricos anteriores preservados, com um novo evento e revisão incrementada em 1; nenhum dado foi revertido. Atividades, modelos, execuções, evidências e validades mantiveram os fingerprints. Nenhum conteúdo corporativo foi exibido nessa conferência.

A verificação da aplicação publicada usa conta temporária isolada e é registrada abaixo após execução. Testes e screenshots locais usam somente fixtures sintéticas.

Validação remota 0.1.4 concluída após **READY/PROMOTED** no domínio real. Conta sintética isolada confirmou: CRUD do catálogo; título composto pesquisável; padrão carregado em segunda sessão; títulos/histórico preservados após renomear/remover o padrão e editar outro campo; payloads legados preservados; salvamento de cliente antigo sem apagar catálogo; quatro cores nos cartões; cópia direta e erro de clipboard; marca/favicon; XLSX com nome novo e título original; cartões responsivos. O wrapper confirmou a remoção da conta de teste. Nenhum teste gravou na conta do proprietário.

Conferência após limpeza: os sete conjuntos mantiveram contagens e fingerprints idênticos à referência posterior à migração, incluindo a atualização legítima feita durante o uso. Nenhuma gravação foi revertida para forçar igualdade.
