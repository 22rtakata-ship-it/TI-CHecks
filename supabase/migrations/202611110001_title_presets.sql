-- Catálogo de títulos padrão por proprietário. Não modifica registros anteriores.
-- A coluna herda as políticas RLS e os privilégios de workspace_settings.
create function public.valid_title_presets(presets jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare
 item jsonb;
 item_id text;
 item_name text;
 name_key text;
 seen_ids text[] := array[]::text[];
 seen_names text[] := array[]::text[];
begin
 if jsonb_typeof(presets) is distinct from 'array' then return false; end if;
 for item in select value from jsonb_array_elements(presets) loop
  if jsonb_typeof(item) is distinct from 'object'
   or jsonb_typeof(item->'id') is distinct from 'string'
   or jsonb_typeof(item->'name') is distinct from 'string'
  then return false; end if;
  item_id := lower(item->>'id');
  if item_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then return false; end if;
  item_name := regexp_replace(item->>'name', '^[[:space:]]+|[[:space:]]+$', '', 'g');
  item_name := regexp_replace(item_name, '[[:space:]]+', ' ', 'g');
  if length(item_name) < 1 or length(item_name) > 100 then return false; end if;
  name_key := regexp_replace(normalize(lower(item_name), NFD), U&'[\0300-\036f]', '', 'g');
  if item_id = any(seen_ids) or name_key = any(seen_names) then return false; end if;
  seen_ids := array_append(seen_ids, item_id);
  seen_names := array_append(seen_names, name_key);
 end loop;
 return true;
end $$;
revoke all on function public.valid_title_presets(jsonb) from public;
grant execute on function public.valid_title_presets(jsonb) to authenticated;

alter table public.workspace_settings
 add column title_presets jsonb not null default '[]'::jsonb,
 add constraint workspace_title_presets_valid check (public.valid_title_presets(title_presets));

create or replace function public.load_workspace() returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb; begin
 if auth.uid() is null then raise exception 'Autenticação obrigatória'; end if;
 select jsonb_build_object('revision',s.revision,'data',jsonb_build_object('version',1,'categories',s.categories,'titlePresets',s.title_presets,
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
 if document ? 'titlePresets' and not public.valid_title_presets(document->'titlePresets') then
  raise exception using errcode='22023', message='Documento de dados inválido: títulos padrão inválidos.';
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
 update public.workspace_settings set categories=document->'categories',
 title_presets=case when document ? 'titlePresets' then document->'titlePresets' else title_presets end,
 revision=current_revision+1,updated_at=now() where owner_id=auth.uid() returning revision into next_revision;
 return next_revision;
end $$;
revoke all on function public.load_workspace() from public;
revoke all on function public.save_workspace(jsonb,bigint) from public;
grant execute on function public.load_workspace() to authenticated;
grant execute on function public.save_workspace(jsonb,bigint) to authenticated;
