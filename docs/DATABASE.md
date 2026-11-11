# Banco de dados e Supabase

Em projeto Supabase **novo**, aplique todos os arquivos de `supabase/migrations/` em ordem de nome: schema inicial, proteções de workspace, categoria Celulares, validades e títulos padrão. Em projeto existente, aplique somente as migrações ainda não aplicadas. Não execute novamente sobre schema já migrado: futuras alterações devem ser novas migrações. Não há necessidade de service_role no cliente.

| Entidade              | Tabela / modelagem                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Usuários              | `auth.users`, administrados no painel Supabase                                                                                           |
| Lojas                 | `stores`, sementes 295 e 178                                                                                                             |
| Setores               | `sectors`, referência a loja e proprietário; interface administrativa futura                                                             |
| Categorias            | lista por usuário em `workspace_settings.categories` (JSONB)                                                                             |
| Atividades            | `activities`, ID, owner, DATE, JSONB de campos/revisões e FK de ocorrência                                                               |
| Ocorrências           | `incidents`, ID, owner, data de abertura, payload com estado e histórico                                                                 |
| Atualizações          | `incident_events`, evento individual, FK de ocorrência/atividade, data, instante, status e descrição; projeção transacional do histórico |
| Modelos e agendamento | `checklist_templates`, payload com repetição, dias, início/término, data única e snapshots históricos por vigência                       |
| Execuções             | `checklist_executions`, DATE e chave única owner/modelo/data/loja, status/justificativa/nome histórico no payload                        |
| Evidências            | `evidence`, FK para exatamente uma atividade ou ocorrência do mesmo proprietário; path privado e metadados no payload                    |

O JSONB mantém o contrato tipado versionado da primeira versão. Identidade, vínculos e datas centrais são relacionais; categorias e agendamentos não são tabelas independentes nesta versão. A tabela de eventos é uma projeção consultável para evolução, atualizada na mesma transação que o histórico agregado. A fonte de leitura atual da aplicação é o payload. Ao introduzir escrita incremental, manter uma única fonte de verdade e migrar o adaptador.

`load_workspace()` retorna dados + revisão somente do usuário autenticado. `save_workspace(document, expected_revision)` bloqueia a linha de configuração, verifica revisão e substitui apenas registros pertencentes ao usuário atual numa transação. Falhas revertem integralmente a gravação. A chave da execução impede duplicação no banco, independentemente da interface. Para grandes históricos, substituir a operação completa por comandos incrementais.

RLS em todas as tabelas de dados restringe leitura/escrita a `owner_id = auth.uid()`. Lojas têm leitura autenticada. Chaves estrangeiras compostas com proprietário impedem vínculos cruzados. Funções usam SECURITY INVOKER e `search_path` vazio; execução pública revogada, concedida a authenticated. Usuários diferentes não compartilham dados automaticamente.

Storage: bucket `evidence`, privado, 10 MB, JPG/PNG/WebP/PDF. Policies de select/insert/delete limitam o primeiro segmento do caminho ao UID autenticado. O upload utiliza `uid/uuid.ext` sem reutilizar o nome original no path. Acesso por URL assinada de 60 segundos. Não disponibilizar bucket público.

Configuração de operação:

1. Criar projeto Supabase e aplicar a migração.
2. Criar usuário com senha no painel Authentication (cadastro público pode ficar desabilitado).
3. Preencher URL + chave pública de `.env.example` em `.env.local` ou nas variáveis do ambiente de deploy. A chave pública não é segredo; autorização depende do login e de RLS.
4. Permitir o domínio exato `<referência>.supabase.co` na rede da nuvem, preservando os demais domínios.
5. Reiniciar desenvolvimento ou reconstruir produção (variáveis NEXT_PUBLIC são embutidas no build).
6. Entrar, registrar atividade, recarregar e testar anexos. Confirmar com dois usuários que nenhum vê os dados/arquivos do outro.

Não copiar dados locais de demonstração automaticamente para produção. Ao entrar em uma conta na nuvem ainda sem histórico salvo, a interface oferece importação explícita dos registros deste navegador. A revisão otimista impede sobrescrita se outra sessão gravar antes. A cópia local é preservada. Importação de arquivos JSON continua pendente. Exporte o backup JSON antes de limpar o navegador. Validar backups/restauração operacional e política de retenção antes do uso corporativo.

A segunda migração rejeita snapshots incompletos, tipos inválidos, versão incompatível e revisão ausente antes de alterar qualquer registro. No cliente, Supabase configurado exige sessão e confirmação da revisão remota; falhas não gravam no navegador como substituição silenciosa. As revisões são mantidas separadas por usuário.

## Atualização 0.2.0

Aplique a nova migração `202611070001_add_mobile_category.sql` depois das anteriores. Ela preserva categorias personalizadas, adiciona Celulares somente quando ausente e incrementa a revisão apenas das contas alteradas.

`incidents.payload.deletedAt` registra remoção reversível. A linha continua existindo e as referências por FK permanecem válidas; atividades/evidências/eventos não são apagados. As consultas de indicadores da aplicação excluem ocorrências removidas. Restaurar retira o marcador do payload. Nenhuma alteração nas colunas de tempo: minutos permanecem como fonte de dados.

## Validades — 0.3.0

Aplicar a migração incremental `202611090001_validity_records.sql` após as anteriores, sem reaplicar schema inicial. `validity_records` possui id/owner, payload, work_date DATE, store e updated_at TSTZ. Unicidade por owner/data/loja, contagens inteiras entre0e2147483647, segunda a sexta, políticas RLS do proprietário.

`load_workspace` retorna a nova seção `validityRecords`. `save_workspace` exige um array válido quando a seção está presente. Se um cliente antigo omitir o campo, os registros existentes são preservados. O salvamento permanece atômico e usa a revisão de workspace; não há queda silenciosa para armazenamento local em erro remoto.

Ocorrências removidas continuam guardadas com deletedAt. A partir desta versão, a aplicação também desconsidera as atividades associadas por incidentId em todas as telas/contagens normais. Nenhuma atividade é apagada fisicamente; restaurar a ocorrência restaura a visibilidade.

## Compatibilidade 0.4.0

Atividades aceitam `description?: string` e `deletedAt?: string` no payload JSONB existente. Não exigem migração: a RPC preserva o documento por registro. A descrição nova tem precedência; registros anteriores sem esse campo usam os textos legados para exibição. Edições espalham o payload existente antes dos valores novos, preservando campos anteriores e propriedades desconhecidas.

Remover atividade marca `deletedAt`, sem apagar linha, revisão, ocorrência, evento ou evidência; restaurar remove a marca. As consultas de interface usam `activities/visibility.ts`. No acompanhamento de ocorrência, Resolvido? é derivado do status do evento, sem flag redundante no banco. `tests/database.test.ts` confirma o roundtrip conjunto de novos campos, campos legados e vínculo de ocorrência sob a RPC atual.

## Títulos padrão — 0.1.4

A migração `202611110001_title_presets.sql` adiciona `workspace_settings.title_presets` (JSONB, padrão `[]`) à configuração privada de cada proprietário. O catálogo contém `{id: UUID, name: string}`; a constraint valida tipo, IDs, nomes e duplicação por nome normalizado, incluindo acentos decompostos. As políticas RLS da tabela continuam em vigor.

`load_workspace` retorna `titlePresets`; `save_workspace` só o substitui quando a lista está presente no documento. Omissão preserva dados de clientes antigos, enquanto `[]` remove o catálogo explicitamente. Validades, revisão otimista, transação e autorização permanecem no mesmo contrato. A normalização local preenche ausência com `[]` sem reescrever outras propriedades.

Atividades guardam o título completo e, opcionalmente, `titlePresetId`, `titlePrefix` e `titleDetail` em seu payload existente. O ID do padrão é uma referência histórica sem foreign key: excluir/renomear o padrão não apaga nem renomeia atividade ou ocorrência. A migração não atualiza payloads ou revisões de registros existentes.
