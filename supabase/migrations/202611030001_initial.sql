-- TI Log v1. Execute no SQL Editor de um projeto Supabase novo.
-- Todas as datas de trabalho são DATE; auditoria usa timestamptz.
create table public.workspace_settings (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 categories jsonb not null default '[]', revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
create table public.stores (id text primary key, name text not null);
insert into public.stores values ('295','Itatiba'),('178','Indaiatuba');
create table public.sectors (id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id), store_id text not null references public.stores(id), name text not null);
create table public.incidents (
 id uuid not null, owner_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null, opened_on date not null,
 primary key(owner_id,id),
 check (payload->>'id'=id::text),
 check (payload->>'status' in ('Concluído','Em andamento','Aguardando terceiros','Pendente'))
);
create table public.activities (
 id uuid not null, owner_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null, work_date date not null,
 incident_id uuid generated always as (nullif(payload->>'incidentId','')::uuid) stored,
 primary key(owner_id,id),
 foreign key(owner_id,incident_id) references public.incidents(owner_id,id),
 check (payload->>'id'=id::text),
 check (length(trim(payload->>'title'))>0),
 check (payload->>'status' in ('Concluído','Em andamento','Aguardando terceiros','Pendente')),
 check ((payload->>'minutes') is null or (payload->>'minutes')::numeric>=0)
);
create table public.checklist_templates (
 id uuid not null, owner_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null, primary key(owner_id,id), check (payload->>'id'=id::text)
);
create table public.checklist_executions (
 id uuid not null, owner_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null,
 template_id uuid generated always as ((payload->>'templateId')::uuid) stored,
 work_date date not null,
 store text generated always as (payload->>'store') stored,
 primary key(owner_id,id), unique(owner_id,template_id,work_date,store),
 foreign key(owner_id,template_id) references public.checklist_templates(owner_id,id),
 check (payload->>'id'=id::text),
 check (payload->>'status' in ('Concluído','Não concluído','Não se aplica')),
 check (payload->>'status'='Concluído' or length(trim(payload->>'reason'))>0)
);
create table public.evidence (
 id uuid not null, owner_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null,
 activity_id uuid generated always as (nullif(payload->>'activityId','')::uuid) stored,
 incident_id uuid generated always as (nullif(payload->>'incidentId','')::uuid) stored,
 primary key(owner_id,id),
 foreign key(owner_id,activity_id) references public.activities(owner_id,id),
 foreign key(owner_id,incident_id) references public.incidents(owner_id,id),
 check (payload->>'id'=id::text),
 check (num_nonnulls(activity_id,incident_id)=1),
 check (split_part(payload->>'path','/',1)=owner_id::text)
);
create table public.incident_events (
 id uuid not null, owner_id uuid not null references auth.users(id) on delete cascade,
 incident_id uuid not null, work_date date not null, recorded_at timestamptz not null,
 activity_id uuid, status text not null, description text not null,
 primary key(owner_id,id),
 foreign key(owner_id,incident_id) references public.incidents(owner_id,id),
 foreign key(owner_id,activity_id) references public.activities(owner_id,id),
 check (status in ('Concluído','Em andamento','Aguardando terceiros','Pendente'))
);
alter table public.incident_events enable row level security;
create policy own_records on public.incident_events for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
grant select,insert,update,delete on public.incident_events to authenticated;
-- Histórico datado permanece no payload de cada ocorrência; revisões no payload de atividade.
-- A API usa transações atômicas e revisão otimista para evitar sobrescritas entre abas.
alter table public.workspace_settings enable row level security;
create policy own_records on public.workspace_settings for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
grant select,insert,update,delete on public.workspace_settings to authenticated;
alter table public.sectors enable row level security;
create policy own_records on public.sectors for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
grant select,insert,update,delete on public.sectors to authenticated;
alter table public.incidents enable row level security;
create policy own_records on public.incidents for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
grant select,insert,update,delete on public.incidents to authenticated;
alter table public.activities enable row level security;
create policy own_records on public.activities for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
grant select,insert,update,delete on public.activities to authenticated;
alter table public.checklist_templates enable row level security;
create policy own_records on public.checklist_templates for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
grant select,insert,update,delete on public.checklist_templates to authenticated;
alter table public.checklist_executions enable row level security;
create policy own_records on public.checklist_executions for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
grant select,insert,update,delete on public.checklist_executions to authenticated;
alter table public.evidence enable row level security;
create policy own_records on public.evidence for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
grant select,insert,update,delete on public.evidence to authenticated;
alter table public.stores enable row level security;
create policy read_stores on public.stores for select to authenticated using (true);
grant select on public.stores to authenticated;
create function public.load_workspace() returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb; begin
 if auth.uid() is null then raise exception 'Autenticação obrigatória'; end if;
 select jsonb_build_object('revision',s.revision,'data',jsonb_build_object('version',1,'categories',s.categories,
 'activities',coalesce((select jsonb_agg(payload) from public.activities where owner_id=auth.uid()),'[]'),
 'incidents',coalesce((select jsonb_agg(payload) from public.incidents where owner_id=auth.uid()),'[]'),
 'templates',coalesce((select jsonb_agg(payload) from public.checklist_templates where owner_id=auth.uid()),'[]'),
 'executions',coalesce((select jsonb_agg(payload) from public.checklist_executions where owner_id=auth.uid()),'[]'),
 'evidence',coalesce((select jsonb_agg(payload) from public.evidence where owner_id=auth.uid()),'[]')))
 into result from public.workspace_settings s where s.owner_id=auth.uid();
 return result;
end $$;
create function public.save_workspace(document jsonb, expected_revision bigint) returns bigint language plpgsql security invoker set search_path='' as $$
declare current_revision bigint; next_revision bigint; begin
 if auth.uid() is null then raise exception 'Autenticação obrigatória'; end if;
 if document->>'version' <> '1' then raise exception 'Versão incompatível'; end if;
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
revoke all on function public.load_workspace() from public;
revoke all on function public.save_workspace(jsonb,bigint) from public;
grant execute on function public.load_workspace() to authenticated;
grant execute on function public.save_workspace(jsonb,bigint) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('evidence','evidence',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']);
create policy private_evidence_read on storage.objects for select to authenticated using(bucket_id='evidence' and (storage.foldername(name))[1]=auth.uid()::text);
create policy private_evidence_upload on storage.objects for insert to authenticated with check(bucket_id='evidence' and (storage.foldername(name))[1]=auth.uid()::text);
create policy private_evidence_delete on storage.objects for delete to authenticated using(bucket_id='evidence' and (storage.foldername(name))[1]=auth.uid()::text);
