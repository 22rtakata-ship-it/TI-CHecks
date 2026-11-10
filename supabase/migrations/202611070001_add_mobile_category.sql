-- Acrescentar a nova categoria sem substituir categorias personalizadas.
-- A revisão só muda nas contas alteradas: abas antigas deverão recarregar
-- antes de salvar seu snapshot, preservando a categoria incluída pela migração.
update public.workspace_settings as settings
set categories = settings.categories || '["Celulares"]'::jsonb,
    revision = settings.revision + 1,
    updated_at = now()
where not exists (
  select 1
  from jsonb_array_elements_text(settings.categories) as category(name)
  where lower(btrim(category.name)) = 'celulares'
);
