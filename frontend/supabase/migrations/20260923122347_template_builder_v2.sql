-- Template Editor V2 keeps the existing three templates compatible while
-- allowing each repeated-card property to bind directly to a section schema.
alter table public.section_templates drop constraint section_templates_layout_valid;
alter table public.section_templates add constraint section_templates_layout_valid check (
  jsonb_typeof(layout_definition) = 'object'
  and jsonb_typeof(layout_definition->'fields') = 'array'
  and jsonb_typeof(slots) = 'array'
  and pg_column_size(layout_definition) <= 131072
  and (
    layout_definition->>'variant' in ('cards', 'timeline', 'list')
    or (
      layout_definition->>'variant' = 'puck'
      and layout_definition->>'schema_version' in ('1', '2')
      and jsonb_typeof(layout_definition->'puck_data') = 'object'
      and jsonb_typeof(layout_definition->'puck_data'->'content') = 'array'
      and jsonb_array_length(layout_definition->'puck_data'->'content') between 1 and 120
      and (layout_definition->>'schema_version' = '1' or (
        jsonb_typeof(layout_definition->'dependencies') = 'object'
        and jsonb_typeof(layout_definition->'dependencies'->'fields') = 'array'
        and jsonb_typeof(layout_definition->'collection') = 'object'
      ))
    )
  )
);

-- V2 selects only the manifest-whitelisted columns referenced by the template.
create or replace function public.get_homepage_sections()
returns jsonb language plpgsql stable security invoker set search_path = '' as $function$
declare
  v_entry record;
  v_template jsonb;
  v_layout jsonb;
  v_source_config jsonb;
  v_items jsonb;
  v_sections jsonb := '[]'::jsonb;
  v_templates jsonb := '{}'::jsonb;
  v_fields text;
  v_columns text[];
  v_binding jsonb;
  v_column text;
  v_source_key text;
  v_table_name text;
  v_order_by text;
  v_direction text;
  v_limit integer;
  v_where text;
begin
  for v_entry in
    select e.key, e.value as config
    from public.settings s, lateral jsonb_each(s.setting_object) e
    where s.setting_name = 'headings' and s.schema_version = 2 and e.value->>'enabled' = 'true'
    order by (e.value->>'order')::integer, e.key
  loop
    select to_jsonb(t) - 'display_fields' - 'reference_section_key' - 'created_at' - 'updated_at'
      into v_template from public.section_templates t
      where t.template_key = v_entry.config->>'template_key' and t.is_published;
    if v_template is null then continue; end if;
    v_layout := v_template->'layout_definition';
    v_items := '[]'::jsonb;

    if v_layout->>'variant' = 'puck' and v_layout->>'schema_version' = '2' then
      v_source_key := v_layout->'dependencies'->>'section_key';
      if v_source_key is distinct from v_layout->'collection'->>'source_section' then
        raise exception 'Template source definitions do not match';
      end if;
      v_source_config := null;
      select e.value into v_source_config
      from public.settings s, lateral jsonb_each(s.setting_object) e
      where s.setting_name = 'headings' and s.schema_version = 2 and e.key = v_source_key;
      if v_source_config is null or v_source_key !~ '^[a-z][a-z0-9_]*$' then continue; end if;

      v_table_name := v_source_config->>'table_name';
      if v_table_name !~ '^[a-z][a-z0-9_]*$'
         or pg_catalog.to_regclass(pg_catalog.format('public.%I', v_table_name)) is null
         or not ((v_source_key = 'project' and v_table_name = 'projects')
           or (v_source_key = 'experience' and v_table_name = 'work_experience')
           or (v_source_key = 'blog' and v_table_name = 'blogs')
           or (v_source_key not in ('project', 'experience', 'blog') and v_table_name = v_source_key))
      then continue; end if;

      v_fields := '';
      v_columns := array[]::text[];
      for v_binding in select value from jsonb_array_elements(v_layout->'dependencies'->'fields') loop
        v_column := v_binding->>'field';
        if v_column !~ '^[a-z][a-z0-9_]{0,63}$' or not exists (
          select 1 from jsonb_array_elements(v_source_config->'data_schema'->'fields') f
          where f->>'key' = v_column and f->>'type' = v_binding->>'type'
        ) then raise exception 'Invalid template dependency'; end if;
        if not v_column = any(v_columns) then
          v_fields := v_fields || case when cardinality(v_columns) > 0 then ', ' else '' end || pg_catalog.format('%I', v_column);
          v_columns := array_append(v_columns, v_column);
        end if;
      end loop;

      v_order_by := v_layout->'collection'->>'order_by';
      if cardinality(v_columns) = 0 or not v_order_by = any(v_columns) then
        raise exception 'Template order field must be a declared dependency';
      end if;
      v_direction := lower(v_layout->'collection'->>'order_direction');
      if v_direction not in ('asc', 'desc') then raise exception 'Invalid template order direction'; end if;
      v_limit := least(greatest(coalesce((v_layout->'collection'->>'limit')::integer, 3), 1), 12);
      v_where := case v_table_name when 'projects' then 'project_priority is not null'
        when 'blogs' then 'status = ''published''' when 'work_experience' then 'true' else 'is_visible = true' end;
      execute pg_catalog.format(
        'select coalesce(jsonb_agg(to_jsonb(r) - ''__template_sort'' order by r.__template_sort %s nulls last), ''[]''::jsonb) '
        || 'from (select %s, %I as __template_sort from public.%I where %s order by %I %s nulls last limit %s) r',
        v_direction, v_fields, v_order_by, v_table_name, v_where, v_order_by, v_direction, v_limit
      ) into v_items;
    else
      -- Version-1 templates keep their original behavior until saved in V2.
      case v_entry.config->>'table_name'
        when 'projects' then
          select coalesce(jsonb_agg(to_jsonb(p) order by p.project_priority), '[]'::jsonb) into v_items
          from (select project_id, project_name, project_image, project_type, project_description,
            project_tech_stack, project_priority, project_status, project_company_name
            from public.projects where project_priority is not null order by project_priority limit 3) p;
        when 'work_experience' then
          select coalesce(jsonb_agg(to_jsonb(w) order by w.work_start_date desc), '[]'::jsonb) into v_items
          from (select work_id, work_designation, work_company_name, work_start_date, work_end_date,
            work_short_description, work_tech_stack from public.work_experience order by work_start_date desc limit 12) w;
        when 'blogs' then
          select coalesce(jsonb_agg(to_jsonb(b) order by b.is_featured desc, b.published_at desc), '[]'::jsonb) into v_items
          from (select id, title, published_at, tags, reading_time_minutes, slug, is_featured
            from public.blogs where status = 'published' order by is_featured desc, published_at desc limit 3) b;
        else
          if v_entry.config->>'table_name' <> v_entry.key or v_entry.key !~ '^[a-z][a-z0-9_]*$'
             or pg_catalog.to_regclass(pg_catalog.format('public.%I', v_entry.key)) is null then continue; end if;
          v_fields := 'id';
          v_columns := array['id', 'display_order'];
          for v_binding in select value from jsonb_each(v_entry.config->'field_bindings') loop
            v_column := case when jsonb_typeof(v_binding) = 'string' then trim(both '"' from v_binding::text) else v_binding->>'field' end;
            if v_column !~ '^[a-z][a-z0-9_]*$' or not exists (
              select 1 from jsonb_array_elements(v_entry.config->'data_schema'->'fields') f where f->>'key' = v_column
            ) then raise exception 'Invalid section field binding'; end if;
            if not v_column = any(v_columns) then
              v_fields := v_fields || ', ' || pg_catalog.format('%I', v_column);
              v_columns := array_append(v_columns, v_column);
            end if;
          end loop;
          execute pg_catalog.format(
            'select coalesce(jsonb_agg(to_jsonb(r) order by r.display_order, r.id), ''[]''::jsonb) '
            || 'from (select %s, display_order from public.%I where is_visible = true order by display_order, id limit 12) r',
            v_fields, v_entry.key) into v_items;
      end case;
    end if;

    v_sections := v_sections || jsonb_build_array(jsonb_build_object(
      'section_key', v_entry.key, 'heading', v_entry.config->'heading', 'order', v_entry.config->'order',
      'template_key', v_entry.config->>'template_key',
      'field_bindings', case when v_layout->>'schema_version' = '2' then '{}'::jsonb else coalesce(v_entry.config->'field_bindings', '{}'::jsonb) end,
      'items', v_items));
    v_templates := v_templates || jsonb_build_object(v_entry.config->>'template_key', v_template);
  end loop;
  return jsonb_build_object('sections', v_sections, 'templates', v_templates);
end $function$;

revoke all on function public.get_homepage_sections() from public;
grant execute on function public.get_homepage_sections() to anon, authenticated;
