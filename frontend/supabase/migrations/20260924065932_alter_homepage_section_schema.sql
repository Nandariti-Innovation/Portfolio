create or replace function public.alter_homepage_section_schema(
  p_section_key text,
  p_fields jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_manifest jsonb;
  v_section jsonb;
  v_old_fields jsonb;
  v_system_fields jsonb;
  v_next_fields jsonb;
  v_field jsonb;
  v_old_field jsonb;
  v_next_field jsonb;
  v_original_key text;
  v_key text;
  v_type text;
  v_old_type text;
  v_sql_type text;
  v_table_name text;
  v_template_name text;
  v_has_rows boolean;
  v_has_nulls boolean;
  v_schema_version integer;
  v_seen_keys text[] := array[]::text[];
  v_seen_originals text[] := array[]::text[];
  v_reserved_columns constant text[] := array['id', 'display_order', 'is_visible', 'created_at', 'updated_at'];
begin
  if auth.uid() is null
     or coalesce(auth.jwt()->'app_metadata'->>'portfolio_owner', 'false') <> 'true' then
    raise exception 'Only the portfolio owner can alter sections' using errcode = '42501';
  end if;

  if p_section_key is null or length(p_section_key) > 40
     or p_section_key !~ '^[a-z][a-z0-9_]*$' then
    raise exception 'Invalid section key';
  end if;
  if p_section_key = any(array['project', 'experience', 'blog']) then
    raise exception 'Built-in section schemas cannot be altered';
  end if;
  if jsonb_typeof(p_fields) <> 'array' or jsonb_array_length(p_fields) not between 1 and 20 then
    raise exception 'Provide between 1 and 20 custom data fields';
  end if;

  select setting_object into v_manifest
  from public.settings
  where setting_name = 'headings' and schema_version = 2
  for update;

  if not found or jsonb_typeof(v_manifest) <> 'object' then
    raise exception 'Headings schema version 2 is required';
  end if;
  v_section := v_manifest->p_section_key;
  if jsonb_typeof(v_section) <> 'object' then
    raise exception 'Section does not exist';
  end if;
  v_table_name := v_section->>'table_name';
  if v_table_name is distinct from p_section_key then
    raise exception 'Only custom section tables can be altered';
  end if;
  if pg_catalog.to_regclass(pg_catalog.format('public.%I', v_table_name)) is null then
    raise exception 'The section table does not exist';
  end if;

  v_old_fields := v_section->'data_schema'->'fields';
  if jsonb_typeof(v_old_fields) <> 'array' then
    raise exception 'The stored section schema is invalid';
  end if;

  for v_field in select value from jsonb_array_elements(p_fields)
  loop
    if jsonb_typeof(v_field) <> 'object' then
      raise exception 'Invalid data field';
    end if;
    v_original_key := nullif(v_field->>'original_key', '');
    v_key := v_field->>'key';
    v_type := v_field->>'type';

    if v_key is null or length(v_key) > 40 or v_key !~ '^[a-z][a-z0-9_]*$'
       or v_key = any(v_reserved_columns)
       or v_key = any(v_seen_keys)
       or jsonb_typeof(v_field->'label') <> 'string'
       or length(btrim(v_field->>'label')) not between 1 and 80
       or jsonb_typeof(v_field->'required') <> 'boolean'
       or v_type not in ('string','text','integer','number','boolean','url','date','datetime','image','string_array') then
      raise exception 'Invalid or duplicate data field';
    end if;
    v_seen_keys := array_append(v_seen_keys, v_key);

    if v_original_key is not null then
      if v_original_key = any(v_reserved_columns)
         or v_original_key !~ '^[a-z][a-z0-9_]*$'
         or v_original_key = any(v_seen_originals)
         or not exists (
           select 1 from jsonb_array_elements(v_old_fields) old_item
           where old_item->>'key' = v_original_key
             and not coalesce((old_item->>'generated')::boolean, false)
             and old_item->>'key' <> all(v_reserved_columns)
         ) then
        raise exception 'Invalid or duplicate original column';
      end if;
      v_seen_originals := array_append(v_seen_originals, v_original_key);
      if v_key <> v_original_key and exists (
        select 1 from jsonb_array_elements(v_old_fields) old_item
        where old_item->>'key' = v_key
      ) then
        raise exception 'A column named % already exists', v_key;
      end if;
    elsif exists (
      select 1 from jsonb_array_elements(v_old_fields) old_item
      where old_item->>'key' = v_key
    ) then
      raise exception 'A column named % already exists', v_key;
    end if;
  end loop;

  execute pg_catalog.format(
    'select exists (select 1 from public.%I limit 1)', v_table_name
  ) into v_has_rows;

  for v_old_field in
    select value from jsonb_array_elements(v_old_fields)
    where value->>'key' <> all(v_reserved_columns)
      and not coalesce((value->>'generated')::boolean, false)
  loop
    v_original_key := v_old_field->>'key';
    select value into v_next_field
    from jsonb_array_elements(p_fields)
    where value->>'original_key' = v_original_key;

    if v_next_field is null
       or v_next_field->>'key' <> v_original_key
       or v_next_field->>'type' <> v_old_field->>'type' then
      select t.display_name into v_template_name
      from public.section_templates t
      where (
        t.layout_definition->'dependencies'->>'section_key' = p_section_key
        and exists (
          select 1
          from jsonb_array_elements(coalesce(t.layout_definition->'dependencies'->'fields', '[]'::jsonb)) dependency
          where dependency->>'field' = v_original_key
        )
      ) or (
        t.reference_section_key = p_section_key
        and v_original_key = any(coalesce(t.display_fields, array[]::text[]))
      )
      limit 1;

      if v_template_name is not null then
        raise exception 'Column "%" is used by template "%". Rebind that template before renaming, changing its type, or removing it.', v_original_key, v_template_name;
      end if;
    end if;
  end loop;

  -- Rename existing columns before applying other changes. Targets that collide
  -- with another stored column were rejected during validation.
  for v_field in select value from jsonb_array_elements(p_fields)
  loop
    v_original_key := nullif(v_field->>'original_key', '');
    v_key := v_field->>'key';
    if v_original_key is not null and v_original_key <> v_key then
      execute pg_catalog.format(
        'alter table public.%I rename column %I to %I',
        v_table_name, v_original_key, v_key
      );
    end if;
  end loop;

  -- Change types only when the conversion is lossless for populated tables.
  -- Empty tables can safely adopt any supported type.
  for v_field in select value from jsonb_array_elements(p_fields)
  loop
    v_original_key := nullif(v_field->>'original_key', '');
    if v_original_key is null then continue; end if;
    select value into v_old_field
    from jsonb_array_elements(v_old_fields)
    where value->>'key' = v_original_key;
    v_old_type := v_old_field->>'type';
    v_type := v_field->>'type';
    v_key := v_field->>'key';
    if v_type = v_old_type then continue; end if;

    v_sql_type := case v_type
      when 'string' then 'text' when 'text' then 'text' when 'integer' then 'integer'
      when 'number' then 'numeric' when 'boolean' then 'boolean' when 'url' then 'text'
      when 'date' then 'date' when 'datetime' then 'timestamptz'
      when 'image' then 'text' when 'string_array' then 'text[]'
    end;

    if v_has_rows and not (
      (v_old_type in ('string','text','url','image') and v_type in ('string','text','url','image'))
      or (v_old_type = 'integer' and v_type = 'number')
      or (v_old_type = 'date' and v_type = 'datetime')
    ) then
      raise exception 'Changing % from % to % could lose existing data. Add a new field and migrate the values instead.', v_key, v_old_type, v_type;
    end if;

    if not v_has_rows then
      execute pg_catalog.format(
        'alter table public.%I alter column %I type %s using null::%s',
        v_table_name, v_key, v_sql_type, v_sql_type
      );
    elsif v_old_type = 'integer' and v_type = 'number' then
      execute pg_catalog.format(
        'alter table public.%I alter column %I type numeric using %I::numeric',
        v_table_name, v_key, v_key
      );
    elsif v_old_type = 'date' and v_type = 'datetime' then
      execute pg_catalog.format(
        'alter table public.%I alter column %I type timestamptz using (%I::timestamp at time zone ''UTC'')',
        v_table_name, v_key, v_key
      );
    end if;
  end loop;

  -- Drop removed columns only after all validation and dependency checks pass.
  for v_old_field in
    select value from jsonb_array_elements(v_old_fields)
    where value->>'key' <> all(v_reserved_columns)
      and not coalesce((value->>'generated')::boolean, false)
  loop
    v_original_key := v_old_field->>'key';
    if not exists (
      select 1 from jsonb_array_elements(p_fields)
      where value->>'original_key' = v_original_key
    ) then
      execute pg_catalog.format(
        'alter table public.%I drop column %I', v_table_name, v_original_key
      );
    end if;
  end loop;

  -- Add new columns. A required column cannot be added to a populated table
  -- without first providing values, so users add it as optional and tighten it later.
  for v_field in select value from jsonb_array_elements(p_fields)
  loop
    if nullif(v_field->>'original_key', '') is not null then continue; end if;
    v_key := v_field->>'key';
    v_type := v_field->>'type';
    if v_has_rows and (v_field->>'required')::boolean then
      raise exception 'New field "%" must be optional because the table already contains rows. Add values first, then mark it required.', v_key;
    end if;
    v_sql_type := case v_type
      when 'string' then 'text' when 'text' then 'text' when 'integer' then 'integer'
      when 'number' then 'numeric' when 'boolean' then 'boolean' when 'url' then 'text'
      when 'date' then 'date' when 'datetime' then 'timestamptz'
      when 'image' then 'text' when 'string_array' then 'text[]'
    end;
    execute pg_catalog.format(
      'alter table public.%I add column %I %s %s',
      v_table_name, v_key, v_sql_type,
      case when (v_field->>'required')::boolean then 'not null' else '' end
    );
  end loop;

  -- Apply nullable/required changes after columns and types are settled.
  for v_field in select value from jsonb_array_elements(p_fields)
  loop
    v_key := v_field->>'key';
    if (v_field->>'required')::boolean then
      execute pg_catalog.format(
        'select exists (select 1 from public.%I where %I is null limit 1)',
        v_table_name, v_key
      ) into v_has_nulls;
      if v_has_nulls then
        raise exception 'Field "%" still contains empty values and cannot be required yet.', v_key;
      end if;
      execute pg_catalog.format(
        'alter table public.%I alter column %I set not null', v_table_name, v_key
      );
    else
      execute pg_catalog.format(
        'alter table public.%I alter column %I drop not null', v_table_name, v_key
      );
    end if;
  end loop;

  select coalesce(jsonb_agg(value order by ordinality), '[]'::jsonb)
  into v_system_fields
  from jsonb_array_elements(v_old_fields) with ordinality
  where value->>'key' = any(v_reserved_columns);

  select coalesce(jsonb_agg((value - 'original_key') order by ordinality), '[]'::jsonb)
  into v_next_fields
  from jsonb_array_elements(p_fields) with ordinality;

  v_schema_version := coalesce((v_section->'data_schema'->>'version')::integer, 1) + 1;
  v_section := jsonb_set(
    v_section,
    '{data_schema}',
    jsonb_build_object('version', v_schema_version, 'fields', v_system_fields || v_next_fields),
    false
  );
  v_manifest := jsonb_set(v_manifest, array[p_section_key], v_section, false);

  update public.settings
  set setting_object = v_manifest, updated_at = now()
  where setting_name = 'headings' and schema_version = 2;

  perform pg_notify('pgrst', 'reload schema');
  return v_section;
end;
$function$;

revoke all on function public.alter_homepage_section_schema(text,jsonb) from public, anon;
grant execute on function public.alter_homepage_section_schema(text,jsonb) to authenticated;
