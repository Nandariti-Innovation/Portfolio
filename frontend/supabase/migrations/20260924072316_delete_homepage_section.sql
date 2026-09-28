-- Custom-section deletion is intentionally atomic and restricted to portfolio owners.
create or replace function public.get_homepage_section_deletion_impact(
  p_section_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_manifest jsonb;
  v_section jsonb;
  v_table_name text;
  v_row_count bigint;
  v_templates jsonb;
  v_template_keys text[];
  v_blocked_sections jsonb;
  v_has_builtin boolean;
begin
  if auth.uid() is null
     or coalesce(auth.jwt()->'app_metadata'->>'portfolio_owner', 'false') <> 'true' then
    raise exception 'Only the portfolio owner can inspect section deletion' using errcode = '42501';
  end if;
  if p_section_key is null or p_section_key !~ '^[a-z][a-z0-9_]{0,39}$'
     or p_section_key = any(array['project', 'experience', 'blog']) then
    raise exception 'Only custom sections can be deleted';
  end if;

  select setting_object into v_manifest
  from public.settings
  where setting_name = 'headings' and schema_version = 2;
  v_section := v_manifest->p_section_key;
  if jsonb_typeof(v_section) <> 'object' then raise exception 'Section does not exist'; end if;
  v_table_name := v_section->>'table_name';
  if v_table_name is distinct from p_section_key
     or pg_catalog.to_regclass(pg_catalog.format('public.%I', v_table_name)) is null then
    raise exception 'The custom section table does not exist';
  end if;

  execute pg_catalog.format('select count(*) from public.%I', v_table_name) into v_row_count;

  select
    coalesce(jsonb_agg(jsonb_build_object(
      'template_key', template_key,
      'display_name', display_name,
      'is_builtin', is_builtin
    ) order by template_key), '[]'::jsonb),
    coalesce(array_agg(template_key order by template_key), array[]::text[]),
    coalesce(bool_or(is_builtin), false)
  into v_templates, v_template_keys, v_has_builtin
  from public.section_templates
  where reference_section_key = p_section_key
     or layout_definition->'dependencies'->>'section_key' = p_section_key;

  select coalesce(jsonb_agg(section_name order by section_name), '[]'::jsonb)
  into v_blocked_sections
  from (
    select key as section_name
    from jsonb_each(v_manifest)
    where key <> p_section_key
      and value->>'template_key' = any(v_template_keys)
  ) connected_sections;

  return jsonb_build_object(
    'section_key', p_section_key,
    'table_name', v_table_name,
    'row_count', v_row_count,
    'templates', v_templates,
    'blocked_by_sections', v_blocked_sections,
    'has_builtin_template', v_has_builtin,
    'can_delete', not v_has_builtin and jsonb_array_length(v_blocked_sections) = 0
  );
end;
$function$;

create or replace function public.delete_homepage_section(
  p_section_key text,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_manifest jsonb;
  v_section jsonb;
  v_table_name text;
  v_row_count bigint;
  v_deleted_templates text[];
  v_blocked_section text;
begin
  if auth.uid() is null
     or coalesce(auth.jwt()->'app_metadata'->>'portfolio_owner', 'false') <> 'true' then
    raise exception 'Only the portfolio owner can delete sections' using errcode = '42501';
  end if;
  if p_section_key is null or p_section_key !~ '^[a-z][a-z0-9_]{0,39}$'
     or p_section_key = any(array['project', 'experience', 'blog']) then
    raise exception 'Only custom sections can be deleted';
  end if;
  if p_confirmation is distinct from p_section_key then
    raise exception 'Type the exact section key to confirm deletion';
  end if;

  select setting_object into v_manifest
  from public.settings
  where setting_name = 'headings' and schema_version = 2
  for update;
  v_section := v_manifest->p_section_key;
  if jsonb_typeof(v_section) <> 'object' then raise exception 'Section does not exist'; end if;
  v_table_name := v_section->>'table_name';
  if v_table_name is distinct from p_section_key
     or pg_catalog.to_regclass(pg_catalog.format('public.%I', v_table_name)) is null then
    raise exception 'The custom section table does not exist';
  end if;

  if exists (
    select 1 from public.section_templates
    where is_builtin and (
      reference_section_key = p_section_key
      or layout_definition->'dependencies'->>'section_key' = p_section_key
    )
  ) then
    raise exception 'A built-in template depends on this section and cannot be deleted';
  end if;

  select key into v_blocked_section
  from jsonb_each(v_manifest)
  where key <> p_section_key
    and value->>'template_key' in (
      select template_key from public.section_templates
      where reference_section_key = p_section_key
         or layout_definition->'dependencies'->>'section_key' = p_section_key
    )
  limit 1;
  if v_blocked_section is not null then
    raise exception 'Template is still assigned to section "%"', v_blocked_section;
  end if;

  execute pg_catalog.format('select count(*) from public.%I', v_table_name) into v_row_count;

  with deleted as (
    delete from public.section_templates
    where not is_builtin and (
      reference_section_key = p_section_key
      or layout_definition->'dependencies'->>'section_key' = p_section_key
    )
    returning template_key
  )
  select coalesce(array_agg(template_key order by template_key), array[]::text[])
  into v_deleted_templates from deleted;

  update public.settings
  set setting_object = v_manifest - p_section_key, updated_at = now()
  where setting_name = 'headings' and schema_version = 2;

  -- RESTRICT is PostgreSQL's default. Unexpected database dependencies abort
  -- and roll back template, manifest, and table deletion together.
  execute pg_catalog.format('drop table public.%I', v_table_name);
  perform pg_notify('pgrst', 'reload schema');

  return jsonb_build_object(
    'section_key', p_section_key,
    'table_name', v_table_name,
    'deleted_rows', v_row_count,
    'deleted_templates', to_jsonb(v_deleted_templates)
  );
end;
$function$;

revoke all on function public.get_homepage_section_deletion_impact(text) from public, anon;
revoke all on function public.delete_homepage_section(text,text) from public, anon;
grant execute on function public.get_homepage_section_deletion_impact(text) to authenticated;
grant execute on function public.delete_homepage_section(text,text) to authenticated;
