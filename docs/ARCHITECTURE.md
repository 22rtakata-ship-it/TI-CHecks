# Arquitetura

Next.js App Router + React + TypeScript. CSS com variáveis semânticas foi utilizado em lugar de Tailwind para manter esta primeira interface sem dependências de utilitários. Lucide fornece os ícones, ExcelJS gera XLSX sob demanda. Componentes são organizados por funcionalidade; não há arquivo HTML/JS único com a aplicação.

O ponto de entrada para manutenção é [PROJECT_MAP.md](../PROJECT_MAP.md). A organização segue responsabilidades dentro de cada feature, sem criar camadas globais de serviços ou estado de domínio.

`Workspace.tsx` preserva as barreiras de autenticação/carregamento e compõe sidebar, cabeçalho, avisos, páginas e formulário. `useWorkspaceController.ts` mantém sessão, seleção de loja/data, navegação por fragmento, estados de formulário e coordenação de gravação. `navigation.ts` é a única definição dos itens do menu. `WorkspacePages.tsx` conecta as features por props e callbacks, sem regras de domínio.

Os serviços puros são responsáveis por recorrência, justificativas, atualizações datadas, validação de atividade e agregação mensal. `activities/workflow.ts` prepara o snapshot que reúne atividade e ocorrência; o controlador persiste esse snapshot uma única vez. As views recebem contratos tipados. Não há acesso direto ao estado de outra feature.

`lib/repository.ts` coordena RPCs e revisões por proprietário. `lib/workspace-data.ts` valida e normaliza o contrato, preservando propriedades desconhecidas e compatibilidade de validades ausentes. `lib/local-demo.ts` concentra a leitura/gravação da chave local existente. O repositório escolhe explicitamente entre `localStorage` de demonstração e Supabase autenticado; falhas remotas geram erro, sem troca silenciosa para dados temporários.

Dashboard e relatórios têm componentes locais de apresentação em `reports/dashboard/` e `reports/report/`. Agregação, resumo, geração de planilha e download ficam em arquivos próprios. Os hooks do relatório isolam tema de impressão e efeitos de exportação. A importação de ExcelJS continua sob demanda. Em `validity/`, calendário, validação/gravação, seletores e métricas são separados dos gráficos e histórico. As fachadas `service.ts` desses módulos preservam as exportações anteriores.

`styles/globals.css` compõe folhas por responsabilidade na ordem original. Variáveis, base, layout, áreas funcionais, responsividade e impressão permanecem na mesma cascata. CSS específico de relatórios e validades permanece junto à feature. A extração não introduz wrappers de interface nem modifica seletores.

`AppData` é a unidade de trabalho inicial. Cada salvamento remoto envia um documento completo à RPC; a função aplica todas as entidades numa transação sob RLS, com revisão otimista e bloqueio de linha. Se outra aba salvou antes, a operação falha e pede recarregamento. A memória é atualizada apenas após confirmação da persistência. A demonstração não tem controle de concorrência entre abas e não se destina a produção.

Datas de expediente são strings ISO `YYYY-MM-DD` e colunas PostgreSQL DATE. O dia atual é obtido em `America/Sao_Paulo`; timestamps de auditoria são instantes UTC e exibidos em São Paulo. Cálculo de dia da semana usa meio-dia UTC para não deslocar datas. O relatório considera eventos até o fim do mês: uma ocorrência ainda aberta no período não vira resolvida por um evento posterior.

Cada execução de checklist tem identidade modelo/data/loja. Abrir uma data calcula previsões, sem criar registros. A resposta faz upsert lógico e o banco reforça a unicidade. “A fazer” é ausência de resposta; “Não concluído” e “Não se aplica” exigem motivo. Cada edição de programação armazena snapshot e vigência, mantendo a programação anterior para datas anteriores. Execuções já respondidas prevalecem sobre o modelo, inclusive nome e status.

Concluir uma atividade vinculada não conclui a ocorrência. Mudanças de status da ocorrência são eventos próprios, com data e instante. Apenas atividades contam como atividades; atualizações de acompanhamento não aumentam produtividade automaticamente.

Armazenamento privado só no Supabase. A aplicação não armazena binários no documento nem no localStorage. Anexos são limitados a 10 MB e tipos permitidos tanto no cliente quanto no bucket. Links assinados duram 60 segundos. Ainda é necessário validar MIME por conteúdo/antivírus no servidor antes de ampliar o uso a uploads de usuários não confiáveis. Metadados e objetos de storage não compartilham transação: falhas parciais de remoção podem exigir reconciliação administrativa. Não há promessa de atomicidade entre esses dois serviços.

Evolução prevista: endpoints incrementais por entidade, paginação, políticas por equipe/loja, migrações de versão do payload e testes reais do serviço Supabase. Preserve contratos de dados e autorização ao expandir; não refatore funcionalidades sem relação com a tarefa.
