-- Reusable, declarative templates. No executable browser code is stored here.
alter table public.section_templates
  add column if not exists layout_definition jsonb not null default '{"variant":"cards","show_heading":true,"columns":3,"fields":["image","title","description"]}'::jsonb,
  add column if not exists slots jsonb not null default '[{"key":"title","type":"text","required":true}]'::jsonb,
  add column if not exists is_published boolean not null default true;

update public.section_templates set
  layout_definition = case template_key
    when 'project_v1' then '{"variant":"cards","show_heading":true,"columns":3,"fields":["image","category","title","description","tags","link"]}'::jsonb
    when 'experience_v1' then '{"variant":"timeline","show_heading":true,"fields":["date","title","subtitle","description","tags"]}'::jsonb
    when 'blog_v1' then '{"variant":"list","show_heading":true,"fields":["date","category","title","link"]}'::jsonb
    else layout_definition end,
  slots = case template_key
    when 'project_v1' then '[{"key":"title","type":"text","required":true},{"key":"image","type":"image","required":false},{"key":"category","type":"text","required":false},{"key":"description","type":"text","required":false},{"key":"tags","type":"list","required":false},{"key":"link","type":"link","required":false}]'::jsonb
    when 'experience_v1' then '[{"key":"title","type":"text","required":true},{"key":"subtitle","type":"text","required":false},{"key":"date","type":"date","required":false},{"key":"end_date","type":"date","required":false},{"key":"description","type":"text","required":false},{"key":"tags","type":"list","required":false}]'::jsonb
    when 'blog_v1' then '[{"key":"title","type":"text","required":true},{"key":"date","type":"date","required":false},{"key":"category","type":"list","required":false},{"key":"link","type":"link","required":false}]'::jsonb
    else slots end
where is_builtin;

alter table public.section_templates
  add constraint section_templates_layout_valid check (
    jsonb_typeof(layout_definition) = 'object'
    and layout_definition->>'variant' in ('cards','timeline','list')
    and jsonb_typeof(layout_definition->'fields') = 'array'
    and jsonb_typeof(slots) = 'array'
  );

grant select on public.section_templates to anon;
grant insert, update, delete on public.section_templates to authenticated;
create policy section_templates_public_read on public.section_templates
  for select to anon, authenticated using (is_published);
create policy section_templates_owner_insert on public.section_templates
  for insert to authenticated with check ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'portfolio_owner') = 'true');
create policy section_templates_owner_update on public.section_templates
  for update to authenticated using ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'portfolio_owner') = 'true')
  with check ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'portfolio_owner') = 'true');
create policy section_templates_owner_delete on public.section_templates
  for delete to authenticated using ((select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'portfolio_owner') = 'true' and not is_builtin);

-- Bind reusable template slots to each existing section's actual table columns.
update public.settings set setting_object = jsonb_set(
  jsonb_set(
    jsonb_set(setting_object, '{project,field_bindings}',
      '{"title":"project_name","image":"project_image","category":"project_type","description":"project_description","tags":"project_tech_stack","link":{"field":"project_id","prefix":"/project/"}}'::jsonb, true),
    '{experience,field_bindings}',
    '{"title":"work_designation","subtitle":"work_company_name","date":"work_start_date","end_date":"work_end_date","description":"work_short_description","tags":"work_tech_stack"}'::jsonb, true),
  '{blog,field_bindings}',
  '{"title":"title","date":"published_at","category":"tags"}'::jsonb, true), updated_at = now()
where setting_name = 'headings' and schema_version = 2;

-- Newly created section tables are publicly readable only after publication,
-- and only for rows explicitly marked visible. Existing generated tables also get this policy.
do $migration$
declare v record;
begin
  for v in select key, value from public.settings s,
    lateral jsonb_each(s.setting_object)
    where s.setting_name = 'headings' and s.schema_version = 2
      and value->>'table_name' = key
      and key not in ('project','experience','blog')
      and key ~ '^[a-z][a-z0-9_]*$'
  loop
    execute format('grant select on public.%I to anon', v.key);
    execute format('create policy section_public_visible on public.%I for select to anon, authenticated '
      || 'using (is_visible and exists (select 1 from public.settings s where s.setting_name = ''headings'' '
      || 'and s.setting_object->%L->>''enabled'' = ''true''))', v.key, v.key);
  end loop;
end $migration$;

-- Replace the old hardcoded collection keys with ordered, manifest-driven sections.
create or replace function public.get_homepage_sections()
returns jsonb language plpgsql stable security invoker set search_path = '' as $function$
declare
  v_entry record;
  v_template jsonb;
  v_items jsonb;
  v_sections jsonb := '[]'::jsonb;
  v_templates jsonb := '{}'::jsonb;
  v_fields text;
  v_columns text[];
  v_binding jsonb;
  v_column text;
begin
  for v_entry in
    select e.key, e.value as config
    from public.settings s, lateral jsonb_each(s.setting_object) e
    where s.setting_name = 'headings' and s.schema_version = 2
      and e.value->>'enabled' = 'true'
    order by (e.value->>'order')::integer, e.key
  loop
    select to_jsonb(t) - 'display_fields' - 'reference_section_key' - 'created_at' - 'updated_at'
      into v_template from public.section_templates t
      where t.template_key = v_entry.config->>'template_key' and t.is_published;
    if v_template is null then continue; end if;
    v_items := '[]'::jsonb;
    case v_entry.config->>'table_name'
      when 'projects' then
        select coalesce(jsonb_agg(to_jsonb(p) order by p.project_priority), '[]'::jsonb) into v_items
        from (select project_id, project_name, project_image, project_type, project_description,
                     project_tech_stack, project_priority, project_status, project_company_name
              from public.projects where project_priority is not null
              order by project_priority limit 3) p;
      when 'work_experience' then
        select coalesce(jsonb_agg(to_jsonb(w) order by w.work_start_date desc), '[]'::jsonb) into v_items
        from (select work_id, work_designation, work_company_name, work_start_date, work_end_date,
                     work_short_description, work_tech_stack from public.work_experience
              order by work_start_date desc limit 12) w;
      when 'blogs' then
        select coalesce(jsonb_agg(to_jsonb(b) order by b.is_featured desc, b.published_at desc), '[]'::jsonb) into v_items
        from (select id, title, published_at, tags, reading_time_minutes, slug, is_featured
              from public.blogs where status = 'published'
              order by is_featured desc, published_at desc limit 3) b;
      else
        -- Only a table provisioned for this same section can be selected here.
        if v_entry.config->>'table_name' <> v_entry.key or v_entry.key !~ '^[a-z][a-z0-9_]*$'
           or pg_catalog.to_regclass(pg_catalog.format('public.%I', v_entry.key)) is null then
          continue;
        end if;
        v_fields := 'id';
        v_columns := array['id', 'display_order'];
        for v_binding in select value from jsonb_each(v_entry.config->'field_bindings')
        loop
          v_column := case when jsonb_typeof(v_binding) = 'string' then trim(both '"' from v_binding::text)
                           else v_binding->>'field' end;
          if v_column !~ '^[a-z][a-z0-9_]*$' or not exists (
            select 1 from jsonb_array_elements(v_entry.config->'data_schema'->'fields') f
            where f->>'key' = v_column) then
            raise exception 'Invalid section field binding';
          end if;
          if not v_column = any(v_columns) then
            v_fields := v_fields || ', ' || pg_catalog.format('%I', v_column);
            v_columns := array_append(v_columns, v_column);
          end if;
        end loop;
        execute pg_catalog.format(
          'select coalesce(jsonb_agg(to_jsonb(r) order by r.display_order, r.id), ''[]''::jsonb) '
          || 'from (select %s, display_order from public.%I where is_visible = true '
          || 'order by display_order, id limit 12) r', v_fields, v_entry.key)
          into v_items;
    end case;
    v_sections := v_sections || jsonb_build_array(jsonb_build_object(
      'section_key', v_entry.key, 'heading', v_entry.config->'heading',
      'order', v_entry.config->'order', 'template_key', v_entry.config->>'template_key',
      'field_bindings', coalesce(v_entry.config->'field_bindings', '{}'::jsonb),
      'items', v_items));
    v_templates := v_templates || jsonb_build_object(v_entry.config->>'template_key', v_template);
  end loop;
  return jsonb_build_object('sections', v_sections, 'templates', v_templates);
end $function$;

revoke all on function public.get_homepage_sections() from public;
grant execute on function public.get_homepage_sections() to anon, authenticated;

create or replace function public.get_homepage_payload()
returns jsonb language sql stable security invoker set search_path = '' as $function$
  with dynamic_data as (select public.get_homepage_sections() as payload)
  select jsonb_build_object(
    'navbar', coalesce((select jsonb_agg(to_jsonb(n) order by n.navbar_id) from public.navbar n), '[]'::jsonb),
    'home_hero', coalesce((select jsonb_agg(to_jsonb(h)) from (select * from public.home_hero limit 1) h), '[]'::jsonb),
    'settings', coalesce((select jsonb_agg(to_jsonb(s) order by s.setting_name) from public.settings s), '[]'::jsonb),
    'skills', coalesce((select jsonb_agg(to_jsonb(sk) order by sk.skill_id) from public.skills sk), '[]'::jsonb),
    'footer', coalesce((select jsonb_agg(to_jsonb(f)) from (select * from public.footer limit 1) f), '[]'::jsonb),
    'social', coalesce((select jsonb_agg(to_jsonb(so) order by so.social_id) from public.social so), '[]'::jsonb),
    'services', coalesce((select jsonb_agg(to_jsonb(se) order by se.services_id) from public.services se), '[]'::jsonb),
    'mentorship', coalesce((select jsonb_agg(to_jsonb(m)) from (select * from public.mentorship limit 1) m), '[]'::jsonb),
    'dynamic_sections', (select payload from dynamic_data),
    -- Keep these legacy fields for the currently deployed frontend during rollout.
    'projects', coalesce((select section->'items' from dynamic_data d,
      lateral jsonb_array_elements(d.payload->'sections') section where section->>'section_key' = 'project'), '[]'::jsonb),
    'work_experience', coalesce((select section->'items' from dynamic_data d,
      lateral jsonb_array_elements(d.payload->'sections') section where section->>'section_key' = 'experience'), '[]'::jsonb),
    'blogs', coalesce((select section->'items' from dynamic_data d,
      lateral jsonb_array_elements(d.payload->'sections') section where section->>'section_key' = 'blog'), '[]'::jsonb)
  );
$function$;

-- Preserve the owner-only creation flow while permitting published visible rows.
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
     or p_section_key in ('about','contact','footer','hero','navbar','navigation','settings','users','profiles','projects') then
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
  execute pg_catalog.format('grant select on table public.%I to anon', p_section_key);
  execute pg_catalog.format('grant select, insert, update, delete on table public.%I to authenticated', p_section_key);
  execute pg_catalog.format(
    'create policy section_owner on public.%I for all to authenticated '
    || 'using (auth.uid() is not null and (auth.jwt()->''app_metadata''->>''portfolio_owner'') = ''true'') '
    || 'with check (auth.uid() is not null and (auth.jwt()->''app_metadata''->>''portfolio_owner'') = ''true'')',
    p_section_key
  );

  execute pg_catalog.format(
    'create policy section_public_visible on public.%I for select to anon, authenticated '
    || 'using (is_visible and exists (select 1 from public.settings s where s.setting_name = ''headings'' '
    || 'and s.setting_object->%L->>''enabled'' = ''true''))', p_section_key, p_section_key
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
