-- Validades diárias por loja. Migração incremental; não altera históricos existentes.
create table public.validity_records (
 id uuid not null,
 owner_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null,
 work_date date not null,
 store text generated always as (payload->>'store') stored,
 updated_at timestamptz not null,
 primary key(owner_id,id),
 unique(owner_id,work_date,store),
 constraint validity_payload_object check (jsonb_typeof(payload) = 'object'),
 constraint validity_required_fields check (
  payload ?& array['id','date','store','expired','atRisk','unlinked','updatedAt']
 ),
 constraint validity_identity check (
  jsonb_typeof(payload->'id') = 'string' and payload->>'id' = id::text
 ),
 constraint validity_date check (
  jsonb_typeof(payload->'date') = 'string'
  and payload->>'date' = to_char(work_date,'YYYY-MM-DD')
  and extract(isodow from work_date) between 1 and 5
 ),
 constraint validity_store check (
  jsonb_typeof(payload->'store') = 'string' and length(btrim(store)) > 0
 ),
 constraint validity_expired check (
  jsonb_typeof(payload->'expired') = 'number'
  and (payload->>'expired')::numeric between 0 and 2147483647
  and trunc((payload->>'expired')::numeric) = (payload->>'expired')::numeric
 ),
 constraint validity_at_risk check (
  jsonb_typeof(payload->'atRisk') = 'number'
  and (payload->>'atRisk')::numeric between 0 and 2147483647
  and trunc((payload->>'atRisk')::numeric) = (payload->>'atRisk')::numeric
 ),
 constraint validity_unlinked check (
  jsonb_typeof(payload->'unlinked') = 'number'
  and (payload->>'unlinked')::numeric between 0 and 2147483647
  and trunc((payload->>'unlinked')::numeric) = (payload->>'unlinked')::numeric
 ),
 constraint validity_updated_at check (
  jsonb_typeof(payload->'updatedAt') = 'string'
  and payload->>'updatedAt' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})$'
  and (payload->>'updatedAt')::timestamptz = updated_at
 )
);
alter table public.validity_records enable row level security;
create policy own_records on public.validity_records for all to authenticated
 using(owner_id=auth.uid()) with check(owner_id=auth.uid());
grant select,insert,update,delete on public.validity_records to authenticated;

create or replace function public.load_workspace() returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb; begin
 if auth.uid() is null then raise exception 'Autenticação obrigatória'; end if;
 select jsonb_build_object('revision',s.revision,'data',jsonb_build_object('version',1,'categories',s.categories,
 'activities',coalesce((select jsonb_agg(payload) from public.activities where owner_id=auth.uid()),'[]'),
 'incidents',coalesce((select jsonb_agg(payload) from public.incidents where owner_id=auth.uid()),'[]'),
 'templates',coalesce((select jsonb_agg(payload) from public.checklist_templates where owner_id=auth.uid()),'[]'),
 'executions',coalesce((select jsonb_agg(payload) from public.checklist_executions where owner_id=auth.uid()),'[]'),
 'evidence',coalesce((select jsonb_agg(payload) from public.evidence where owner_id=auth.uid()),'[]'),
 'validityRecords',coalesce((select jsonb_agg(payload order by work_date,store,id) from public.validity_records where owner_id=auth.uid()),'[]')))
 into result from public.workspace_settings s where s.owner_id=auth.uid();
 return result;
end $$;

create or replace function public.save_workspace(document jsonb, expected_revision bigint) returns bigint
language plpgsql security invoker set search_path='' as $$
declare current_revision bigint; next_revision bigint; section_name text; begin
 if auth.uid() is null then raise exception 'Autenticação obrigatória'; end if;
 -- As seis seções originais continuam obrigatórias. Documento incompleto não
 -- representa uma intenção de excluir históricos existentes.
 if jsonb_typeof(document) is distinct from 'object' then
  raise exception using errcode='22023', message='Documento de dados inválido: objeto obrigatório.';
 end if;
 if document->'version' is distinct from '1'::jsonb then
  raise exception using errcode='22023', message='Documento de dados inválido: versão incompatível.';
 end if;
 if expected_revision is null or expected_revision < 0 then
  raise exception using errcode='22023', message='Revisão esperada inválida.';
 end if;
 foreach section_name in array array['activities','incidents','templates','executions','evidence','categories'] loop
  if jsonb_typeof(document->section_name) is distinct from 'array' then
   raise exception using errcode='22023', message='Documento de dados inválido: lista obrigatória ' || section_name || '.';
  end if;
  if section_name <> 'categories' and exists (
   select 1 from jsonb_array_elements(document->section_name) as elements(value)
   where jsonb_typeof(value) is distinct from 'object'
  ) then
   raise exception using errcode='22023', message='Documento de dados inválido: registro inválido em ' || section_name || '.';
  end if;
 end loop;
 if exists (
  select 1 from jsonb_array_elements(document->'categories') as elements(value)
  where jsonb_typeof(value) is distinct from 'string'
 ) then
  raise exception using errcode='22023', message='Documento de dados inválido: categoria inválida.';
 end if;
 -- Compatibilidade: clientes publicados antes de validades não enviam este
 -- campo. Sua omissão preserva a tabela; somente uma lista explícita a substitui.
 if document ? 'validityRecords' then
  if jsonb_typeof(document->'validityRecords') is distinct from 'array' then
   raise exception using errcode='22023', message='Documento de dados inválido: lista obrigatória validityRecords.';
  end if;
  if exists (
   select 1 from jsonb_array_elements(document->'validityRecords') as elements(value)
   where jsonb_typeof(value) is distinct from 'object'
  ) then
   raise exception using errcode='22023', message='Documento de dados inválido: registro inválido em validityRecords.';
  end if;
 end if;
 insert into public.workspace_settings(owner_id) values(auth.uid()) on conflict do nothing;
 select revision into current_revision from public.workspace_settings where owner_id=auth.uid() for update;
 if current_revision <> expected_revision then raise exception 'Os dados foram atualizados em outra sessão. Recarregue a página antes de salvar.'; end if;
 delete from public.incident_events where owner_id=auth.uid();
 delete from public.evidence where owner_id=auth.uid();
 delete from public.checklist_executions where owner_id=auth.uid();
 delete from public.activities where owner_id=auth.uid();
 delete from public.incidents where owner_id=auth.uid();
 delete from public.checklist_templates where owner_id=auth.uid();
 insert into public.incidents(id,owner_id,payload,opened_on) select (item->>'id')::uuid,auth.uid(),item,(item->>'openedOn')::date from jsonb_array_elements(document->'incidents') item;
 insert into public.activities(id,owner_id,payload,work_date) select (item->>'id')::uuid,auth.uid(),item,(item->>'date')::date from jsonb_array_elements(document->'activities') item;
 insert into public.checklist_templates(id,owner_id,payload) select (item->>'id')::uuid,auth.uid(),item from jsonb_array_elements(document->'templates') item;
 insert into public.checklist_executions(id,owner_id,payload,work_date) select (item->>'id')::uuid,auth.uid(),item,(item->>'date')::date from jsonb_array_elements(document->'executions') item;
 insert into public.evidence(id,owner_id,payload) select (item->>'id')::uuid,auth.uid(),item from jsonb_array_elements(document->'evidence') item;
 insert into public.incident_events(id,owner_id,incident_id,work_date,recorded_at,activity_id,status,description)
 select (event->>'id')::uuid,auth.uid(),(item->>'id')::uuid,(event->>'date')::date,(event->>'at')::timestamptz,nullif(event->>'activityId','')::uuid,event->>'status',event->>'text'
 from jsonb_array_elements(document->'incidents') item cross join lateral jsonb_array_elements(item->'events') event;
 if document ? 'validityRecords' then
  delete from public.validity_records where owner_id=auth.uid();
  insert into public.validity_records(id,owner_id,payload,work_date,updated_at)
  select (item->>'id')::uuid,auth.uid(),item,(item->>'date')::date,(item->>'updatedAt')::timestamptz
  from jsonb_array_elements(document->'validityRecords') item;
 end if;
 update public.workspace_settings set categories=document->'categories',revision=current_revision+1,updated_at=now() where owner_id=auth.uid() returning revision into next_revision;
 return next_revision;
end $$;
revoke all on function public.load_workspace() from public;
revoke all on function public.save_workspace(jsonb,bigint) from public;
grant execute on function public.load_workspace() to authenticated;
grant execute on function public.save_workspace(jsonb,bigint) to authenticated;
