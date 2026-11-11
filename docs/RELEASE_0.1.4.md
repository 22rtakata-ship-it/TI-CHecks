# TI Diário 0.1.4

Miniupdate da versão de teste 0.1, conforme a convenção do proprietário.

## Títulos padrão

Em **Configurações → Títulos padrão**, cadastre, edite ou remova prefixos. No formulário da atividade, selecione o padrão e escreva o complemento. Exemplo: `Máquina ADM` + `Cartazista fonte queimada` → `Máquina ADM - Cartazista fonte queimada`. A prévia mostra o título final antes de salvar. A opção **Sem título padrão** mantém o preenchimento livre.

O nome do padrão tem até 100 caracteres; o título completo, até 180. Duplicatas ignoram caixa, acentos e espaços repetidos. Exceder o limite mostra erro, sem truncar ou perder o texto digitado.

O catálogo é privado por usuário e compartilhado pelas suas lojas, assim como as categorias. Um título salvo guarda o texto completo e os opcionais `titlePresetId`, `titlePrefix` e `titleDetail`. Renomear/remover o padrão não altera atividades, ocorrências, histórico ou relatórios anteriores. A edição oferece o prefixo original salvo; registros antigos continuam com título livre, sem divisão automática por hífen. Se um cliente antigo alterar o título e deixar metadados desatualizados, o texto completo prevalece.

## Cartões

Atividades e ocorrências têm borda/faixa e status textual nas cores solicitadas: Pendente vermelho; Concluído verde; Em andamento amarelo; Aguardando terceiros azul. As cores têm variantes claras/escuras; o texto continua identificando o status. Checklists mantêm a própria apresentação.

O botão junto do chamado copia seu número sem abrir o registro. **Copiado** só aparece após confirmação do navegador. Falhas apresentam mensagem e permitem tentar novamente; registros sem chamado não mostram o botão.

## Marca

O aplicativo passa a se chamar **TI Diário**, com ícone vetorial de diário técnico na navegação, login e favicon. Relatórios, e-mail e nomes de downloads usam a nova marca. A aplicação continua no mesmo endereço, projeto Vercel e banco Supabase. Chaves de demonstração/tema e identificadores internos existentes foram preservados para manter o acesso aos dados.

## Banco e compatibilidade

Aplique `202611110001_title_presets.sql` **antes** de publicar o cliente 0.1.4. A migração adiciona `workspace_settings.title_presets` com valor inicial vazio, validação e as políticas de acesso existentes. RPCs mantêm revisão otimista, transação e validades. Omitir `titlePresets` em clientes antigos preserva o catálogo; enviar `[]` explicitamente o esvazia. Não há alteração dos payloads anteriores ou reescrita dos títulos existentes.

Em banco novo, aplique todas as migrações por ordem do nome. Em banco já configurado, aplique somente a nova. Nenhuma dependência adicional foi instalada.

Arquivos e testes: [PROJECT_MAP.md](../PROJECT_MAP.md). Configuração: [DATABASE.md](DATABASE.md). Resultados executados e publicação: [VALIDATION.md](VALIDATION.md) e [DEPLOYMENT.md](DEPLOYMENT.md).
