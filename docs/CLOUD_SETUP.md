# Ativar dados na nuvem

O deploy Vercel atual continua em demonstração. Nenhum projeto Supabase foi configurado ou validado remotamente. O token Vercel existente não concede acesso ao Supabase; a conta Vercel também não possui integrações instaladas nem variáveis de banco no projeto TI Log, conforme consulta realizada.

Foi adicionado ao rascunho do ambiente o segredo HTTP `SUPABASE_ACCESS_TOKEN`, com destino `api.supabase.com`, preservando o segredo Vercel e os domínios existentes. O valor deve ser fornecido pelo proprietário nas configurações do ambiente, nunca no chat, no repositório ou em variável NEXT_PUBLIC. A declaração do requisito não cria o valor nem um banco.

O proprietário pode criar uma conta Supabase e gerar um token pessoal em https://supabase.com/dashboard/account/tokens. Com acesso disponível, as próximas operações são: identificar a organização/projeto autorizado, provisionar um projeto no plano gratuito quando disponível, aplicar as duas migrações em ordem, configurar autenticação e as duas variáveis públicas do projeto na Vercel, realizar novo deploy e testar gravação/leitura em sessões distintas com isolamento entre usuários. Se o plano gratuito não estiver disponível, não contratar plano pago automaticamente.

O token pessoal de gestão é usado somente na API de gestão Supabase. Nunca deve ser enviado à Vercel como variável pública nem ao navegador. A chave pública da aplicação e a URL do projeto são obtidas para o frontend; chaves administrativas ficam restritas ao backend/gestão.

Após ativar o banco, verificar a transição com os dados existentes: o mesmo navegador oferece importação explícita apenas se a conta ainda não possuir histórico salvo. Não apagar o localStorage. Antes da mudança, o usuário pode usar Configurações → Exportar backup JSON. A importação de arquivo JSON não está implementada.

## Estado atual

O projeto `skudiuleejhoaoajzsvf` foi criado na organização TI Log pelo token de gestão, com `plan=free` e região São Paulo (`sa-east-1`). As duas migrações foram aplicadas. A autenticação aceita somente contas administradas por convite; cadastro público está desabilitado. O site `https://ti-log.vercel.app` já foi republicado com as duas variáveis públicas do Supabase.

Para iniciar desenvolvimento deste ambiente com a mesma configuração pública sem gravar valores em arquivo, use `python /workspace/deploy-tools/run-with-cloud-config.py npm run dev`. O helper lê apenas a chave anon para o processo filho por meio da API de gestão e depende do binding `SUPABASE_ACCESS_TOKEN`; não imprime chaves. Use o checkout existente, sem worktrees adicionais.

A atualização de rede solicitada inclui `skudiuleejhoaoajzsvf.supabase.co` e `ti-log.vercel.app`, preservando destinos existentes. Sua aplicação permite validar Auth/Storage e o site diretamente. Envio de ativação e teste da API de login dependem dessa etapa; o teste de durabilidade do banco já foi realizado pela API de gestão.

## Etapas concluídas

A liberação dos domínios foi aplicada ao runtime. Auth/Storage e o site de produção foram validados remotamente, incluindo registros recuperados em outro navegador. O convite inicial foi enviado ao endereço autorizado pelo proprietário, que agora precisa abrir o e-mail e definir a senha. Nenhum teste criou registros na conta do proprietário; contas e arquivos de validação foram removidos. A falha exibida na publicação do snapshot Codex não impediu o deploy funcional na Vercel.
