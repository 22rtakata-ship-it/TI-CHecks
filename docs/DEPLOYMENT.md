# Publicação na Vercel

Publicação de produção concluída em 03/11/2026. A API da Vercel confirmou `READY`, `PROMOTED` e aliases atribuídos para o deployment `dpl_Bg5PBynjzGpKaQsJcWiFQHWW3V1e`.

- Projeto: `ti-log`, conta/equipe `takas3`.
- Endereços de produção: https://ti-log.vercel.app e https://ti-log-takas3.vercel.app.
- Painel: https://vercel.com/takas3/ti-log.
- Framework Next.js, Node 24.x, instalação `npm ci`, build `npm run build`.
- Publicação realizada por envio de fonte à API oficial, sem integração Git automática. Apenas `src/`, `public/`, manifests, lockfile e configurações de compilação foram enviados (36 arquivos). Credenciais, `.env`, dados locais, caches e node_modules não foram enviados.

A publicação está em **modo demonstração**: não há variáveis de projeto Supabase configuradas no build. Registros ficam no navegador do visitante. Autenticação e armazenamento privado de evidências dependem da configuração descrita em `DATABASE.md` e de novo deploy.

Para atualizar, use o código deste checkout, faça os testes pertinentes e publique uma nova versão no mesmo projeto Vercel, ou conecte o repositório depois de enviar o código ao GitHub. A primeira publicação não fez push nem criou integração com o GitHub.

O token de publicação fica nos segredos HTTP do ambiente, restrito a `api.vercel.com`. A CLI instalada rejeita o marcador protegido pelo proxy; a API HTTPS oficial foi usada diretamente com o binding injetado, sem revelar ou extrair o token.

Validação: estado final e domínios confirmados via API oficial. Regras, build e fluxos funcionais haviam passado localmente conforme `VALIDATION.md`. A tentativa de requisição HTTP ao domínio público foi bloqueada pela allowlist deste ambiente (HTTP CONNECT 403); não foi alegada validação funcional remota pelo navegador. Para executar testes remotos daqui, o domínio da aplicação precisa ser autorizado na rede.

## Atualização com Supabase — 03/11/2026

Deploy `dpl_9Kma4fwbRvMKYGaLQgRFhagmJrVT` confirmado em `READY`/`PROMOTED`, com os mesmos aliases de produção. O projeto Vercel agora possui `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`, configuradas sem enviar chaves administrativas ao frontend. Projeto Supabase `skudiuleejhoaoajzsvf`, plano gratuito solicitado, região `sa-east-1` (São Paulo). Ambas as migrações foram aplicadas. Cadastro público está desabilitado, acesso por convite, definição/recuperação de senha com retorno `/?setup=1`.

O banco real confirmou gravação durável, leitura em outra conexão e RLS entre dois contextos de usuário; registros sintéticos foram removidos. O envio do convite do proprietário e o teste direto da API de autenticação aguardam a aplicação da nova allowlist do ambiente (domínio do projeto e do site); não foram alegados como concluídos. O site publicado já exige autenticação.

## Conclusão da ativação — 03/11/2026

Allowlist aplicada no runtime apesar da falha de publicação do snapshot do ambiente Codex. O domínio principal respondeu HTTP 200. Verificação real de Auth passou: login por senha, gravação com JWT de usuário, leitura em novo login e isolamento de um segundo usuário. Storage validou upload privado, assinatura de acesso, bloqueio público e bloqueio de outro usuário. Testes removeram usuários e dados temporários.

Chromium no site de produção validou definição de senha por recovery/ativação, importação explícita do histórico local com cópia preservada, nova atividade na nuvem, upload/remoção de evidência e recuperação dos mesmos registros em outro contexto de navegador. O primeiro teste teve um seletor de toast muito estrito; o seletor foi corrigido e o fluxo completo passou sem alteração de aplicação. Convite do proprietário enviado com sucesso; definir a senha depende da abertura do e-mail pelo próprio usuário.

A publicação do ambiente de desenvolvimento permanece separada do deploy de produção, que está READY/PROMOTED. A falha de snapshot do Codex não afetou a confirmação funcional do site nem a persistência no Supabase.

## Versão 0.2.0 — 07/11/2026

Deployment `dpl_FzVi8mRrLVhpcJSU6Eu4CeKJb2Uy` atingiu `READY`/`PROMOTED`, mantendo https://ti-log.vercel.app e o mesmo projeto/banco. Nova migração `202611070001_add_mobile_category.sql` aplicada somente para acrescentar Celulares quando ausente. Os fingerprints de atividades, ocorrências, modelos, execuções e evidências permaneceram iguais antes e depois da migração.

Teste real de produção em Chromium, com conta temporária isolada, passou em: criação de atividade Celulares com 672 minutos exibidos em horas; arraste de seleção sem fechar modal; dashboard desktop/mobile; pesquisa de chamado formatado; upload de evidência vinculada à ocorrência; remoção persistida em outro navegador; restauração da mesma ocorrência; atividade e evidência preservadas; PDFs claro/escuro e XLSX em horas numéricas. A conta e os arquivos temporários foram removidos. Nenhum teste usou a conta do proprietário.

Ao abrir a versão atualizada, recarregue a página. Abas que mantenham uma revisão anterior à migração devem recarregar antes de salvar; o controle de concorrência evita sobrescrita com configurações antigas.

## Versão 0.3.0 — 09/11/2026

Deployment `dpl_HDp82UopBaeK2Fw1ECCQ68sVD3sc` confirmado `READY`/`PROMOTED`, mantendo https://ti-log.vercel.app. Migração `202611090001_validity_records.sql` aplicada antes do deploy, sem alterar os cinco conjuntos de dados preexistentes.

Chromium no site real, com conta temporária isolada, confirmou: 8concluídos+1NA=100% dos aplicáveis e segmento NA colorido; consulta da data de um checklist não preenchido e navegação para o diário; atividades de ocorrência já removida ocultas enquanto atividade independente com mesmo chamado permanece; criação/edição de validades sem duplicar; leitura em novo navegador; gráfico mensal sem soma indevida dos snapshots; loja sem registros sem herdar valores de outra; layout móvel. Um salvamento via formato legado sem validityRecords preservou as validades existentes. Conta e dados de teste foram removidos.

Não há necessidade de nova conta, nova senha ou alteração de token. Recarregar a página carrega a versão atualizada. O módulo permanece em `src/features/validity`, com persistência privada por proprietário e datas civis da loja.

## Versão 0.4.0 e refatoração — 10/11/2026

Deployment `dpl_CJDNUDE9yiZ1JzZtXLRajZngt8HL` confirmado **READY/PROMOTED**, com aliases https://ti-log.vercel.app e https://ti-log-takas3.vercel.app. Mesmo projeto/banco, sem migração ou nova configuração de credenciais. Foram enviados104arquivos de fonte/build, sem .env, credenciais, dados do navegador ou arquivos de teste.

Chromium no domínio de produção, usando conta temporária isolada, confirmou: edição mantendo todos os campos legados/revisões, descrição nova sem duplicar eventos; criação sem chamado com ocorrência vinculada; resolução/reabertura com datas reais; upload privado; remoção persistida em nova sessão; restauração preservando atividade/ocorrência/anexo; seis campos técnicos e N/A; resumo com mês por extenso e seis linhas; concluídas/pendentes em colunas; horas numéricas e descrição no XLSX; PDF claro/escuro e layout móvel. Conta temporária e arquivo de teste removidos ao final. Nenhum teste gravou na conta do proprietário.

Recarregue o site para receber a atualização. A nova organização do código e os arquivos responsáveis estão em `PROJECT_MAP.md`; comportamento e compatibilidade, em `RELEASE_0.4.0.md`. A aplicação publicada mantém o acesso e a persistência existentes.

## TI Diário 0.1.4 — 11/11/2026

Deployment `dpl_266q1niCLJETGppWvBXobT58L4Cj` confirmado **READY/PROMOTED**, nos mesmos aliases https://ti-log.vercel.app e https://ti-log-takas3.vercel.app. O nome do aplicativo agora é TI Diário; URLs, conta, banco e chaves de acesso existentes foram preservados. Foram enviados 115 arquivos de fonte/build, sem credenciais, cópias de dados ou arquivos de teste.

Migração aditiva `202611110001_title_presets.sql` aplicada antes da publicação. O catálogo de títulos fica privado por proprietário e respeita clientes antigos que omitem a nova seção. Não houve reescrita de títulos ou payloads antigos.

Chromium no domínio real, com conta temporária isolada, confirmou catálogo CRUD, título composto pesquisável, leitura em segunda sessão, histórico preservado após renomear/remover padrão, gravação legada sem apagar catálogo, cores dos cartões, cópia direta com retorno de erro, marca/favicon, XLSX com título original e layout móvel. Conta temporária e dados de teste removidos ao final. Nenhum teste utilizou a conta do proprietário.

Recarregue o site para receber a nova marca e o favicon. Cadastre os prefixos em Configurações → Títulos padrão; o formulário mantém a opção de título livre. Notas: `RELEASE_0.1.4.md`.
