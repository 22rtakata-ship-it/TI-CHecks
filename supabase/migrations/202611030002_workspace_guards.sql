-- Validar snapshots completos e revisão otimista antes de substituir registros.
-- Aplicar depois de 202611030001_initial.sql, inclusive em projetos já criados.
create or replace function public.save_workspace(document jsonb, expected_revision bigint) returns bigint language plpgsql security invoker set search_path='' as $$
declare current_revision bigint; next_revision bigint; section_name text; begin
 if auth.uid() is null then raise exception 'Autenticação obrigatória'; end if;
 -- Validar o documento completo antes de qualquer alteração. A RPC recebe um
 -- snapshot; uma seção ausente não representa uma intenção de excluir dados.
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
 update public.workspace_settings set categories=document->'categories',revision=current_revision+1,updated_at=now() where owner_id=auth.uid() returning revision into next_revision;
 return next_revision;
end $$;
revoke all on function public.save_workspace(jsonb,bigint) from public;
grant execute on function public.save_workspace(jsonb,bigint) to authenticated;
