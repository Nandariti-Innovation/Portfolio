-- Provision a section's table and inactive manifest entry in the same transaction.
-- Set portfolio_owner=true in the dashboard user's Auth app_metadata (server-side).
-- The client must never receive a service-role key or arbitrary DDL permissions.
create or replace function public.create_homepage_section(
  p_section_key text,
  p_heading jsonb,
  p_fields jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_manifest jsonb;
  v_field jsonb;
  v_key text;
  v_type text;
  v_sql_type text;
  v_columns text[] := array['id', 'display_order', 'is_visible', 'created_at', 'updated_at'];
  v_order integer;
  v_schema_fields jsonb := jsonb_build_array(
    jsonb_build_object('key','id','label','ID','type','integer','required',true,'editable',false,'generated',true),
    jsonb_build_object('key','display_order','label','Display order','type','integer','required',true),
    jsonb_build_object('key','is_visible','label','Visible','type','boolean','required',true),
    jsonb_build_object('key','created_at','label','Created at','type','datetime','required',true,'editable',false,'generated',true),
    jsonb_build_object('key','updated_at','label','Updated at','type','datetime','required',true,'editable',false,'generated',true)
  );
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'portfolio_owner', 'false') <> 'true' then
    raise exception 'Only the portfolio owner can create sections' using errcode = '42501';
  end if;

  if p_section_key is null or length(p_section_key) > 40
     or p_section_key !~ '^[a-z][a-z0-9_]*$'
     or p_section_key in ('about','footer','hero','settings','users','profiles') then
    raise exception 'Invalid section key';
  end if;
  if jsonb_typeof(p_heading) <> 'object'
     or jsonb_typeof(p_heading->'index') <> 'string'
     or jsonb_typeof(p_heading->'eyebrow') <> 'string'
     or jsonb_typeof(p_heading->'title') <> 'string'
     or length(btrim(p_heading->>'index')) not between 1 and 3
     or length(btrim(p_heading->>'eyebrow')) not between 1 and 40
     or length(btrim(p_heading->>'title')) not between 1 and 160 then
    raise exception 'Invalid heading';
  end if;
  if jsonb_typeof(p_fields) <> 'array' or jsonb_array_length(p_fields) not between 1 and 20 then
    raise exception 'Provide between 1 and 20 data fields';
  end if;

  select setting_object into v_manifest
  from public.settings where setting_name = 'headings' and schema_version = 2
  for update;
  if not found or jsonb_typeof(v_manifest) <> 'object' then
    raise exception 'Headings schema version 2 is required';
  end if;
  if v_manifest ? p_section_key then
    raise exception 'Section key already exists';
  end if;
  if pg_catalog.to_regclass(pg_catalog.format('public.%I', p_section_key)) is not null then
    raise exception 'A table with this name already exists';
  end if;

  for v_field in select value from jsonb_array_elements(p_fields)
  loop
    if jsonb_typeof(v_field) <> 'object' then
      raise exception 'Invalid data field';
    end if;
    v_key := v_field->>'key';
    v_type := v_field->>'type';
    if v_key is null or length(v_key) > 40 or v_key !~ '^[a-z][a-z0-9_]*$'
       or v_key = any(v_columns)
       or jsonb_typeof(v_field->'label') <> 'string'
       or length(btrim(v_field->>'label')) not between 1 and 80
       or jsonb_typeof(v_field->'required') <> 'boolean' then
      raise exception 'Invalid or duplicate data field';
    end if;
    v_sql_type := case v_type
      when 'string' then 'text'
      when 'text' then 'text'
      when 'integer' then 'integer'
      when 'number' then 'numeric'
      when 'boolean' then 'boolean'
      when 'url' then 'text'
      when 'date' then 'date'
      when 'datetime' then 'timestamptz'
      when 'image' then 'text'
      when 'string_array' then 'text[]'
      else null
    end;
    if v_sql_type is null then
      raise exception 'Unsupported data field type';
    end if;
    v_columns := array_append(v_columns, v_key);
    v_schema_fields := v_schema_fields || jsonb_build_array(jsonb_build_object(
      'key', v_key, 'label', btrim(v_field->>'label'), 'type', v_type,
      'required', (v_field->>'required')::boolean
    ));
  end loop;

  -- Identifiers are format-quoted and all SQL types are selected from a fixed list.
  execute pg_catalog.format(
    'create table public.%I (id bigint generated always as identity primary key, '
    || 'display_order integer not null default 0 check (display_order >= 0), '
    || 'is_visible boolean not null default false, '
    || 'created_at timestamptz not null default now(), '
    || 'updated_at timestamptz not null default now())', p_section_key
  );
  for v_field in select value from jsonb_array_elements(p_fields)
  loop
    v_sql_type := case v_field->>'type'
      when 'string' then 'text' when 'text' then 'text' when 'integer' then 'integer'
      when 'number' then 'numeric' when 'boolean' then 'boolean' when 'url' then 'text'
      when 'date' then 'date' when 'datetime' then 'timestamptz'
      when 'image' then 'text' when 'string_array' then 'text[]'
    end;
    execute pg_catalog.format('alter table public.%I add column %I %s %s',
      p_section_key, v_field->>'key', v_sql_type,
      case when (v_field->>'required')::boolean then 'not null' else '' end);
  end loop;

  execute pg_catalog.format('alter table public.%I enable row level security', p_section_key);
  execute pg_catalog.format('revoke all on table public.%I from public, anon, authenticated', p_section_key);
  execute pg_catalog.format('grant select, insert, update, delete on table public.%I to authenticated', p_section_key);
  execute pg_catalog.format(
    'create policy section_owner on public.%I for all to authenticated '
    || 'using (auth.uid() is not null and (auth.jwt()->''app_metadata''->>''portfolio_owner'') = ''true'') '
    || 'with check (auth.uid() is not null and (auth.jwt()->''app_metadata''->>''portfolio_owner'') = ''true'')',
    p_section_key
  );

  select coalesce(max((value->>'order')::integer), 0) + 1 into v_order
  from jsonb_each(v_manifest);
  update public.settings
  set setting_object = v_manifest || jsonb_build_object(p_section_key, jsonb_build_object(
    'section_key', p_section_key, 'enabled', false, 'order', v_order,
    'heading', jsonb_build_object('index', btrim(p_heading->>'index'),
      'eyebrow', btrim(p_heading->>'eyebrow'), 'title', btrim(p_heading->>'title')),
    'template_key', null, 'table_name', p_section_key,
    'data_schema', jsonb_build_object('version', 1, 'fields', v_schema_fields)
  )), updated_at = now()
  where setting_name = 'headings' and schema_version = 2;
end;
$function$;

revoke all on function public.create_homepage_section(text,jsonb,jsonb) from public, anon;
grant execute on function public.create_homepage_section(text,jsonb,jsonb) to authenticated;
