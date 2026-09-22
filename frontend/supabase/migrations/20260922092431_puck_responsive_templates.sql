-- Allow JSON layouts from the visual editor alongside the existing production templates.
-- Existing rows are left intact until their owners publish a revised design.
alter table public.section_templates drop constraint section_templates_layout_valid;
alter table public.section_templates add constraint section_templates_layout_valid check (
  jsonb_typeof(layout_definition) = 'object'
  and jsonb_typeof(layout_definition->'fields') = 'array'
  and jsonb_typeof(slots) = 'array'
  and pg_column_size(layout_definition) <= 65536
  and (
    layout_definition->>'variant' in ('cards', 'timeline', 'list')
    or (
      layout_definition->>'variant' = 'puck'
      and layout_definition->>'schema_version' = '1'
      and jsonb_typeof(layout_definition->'puck_data') = 'object'
      and jsonb_typeof(layout_definition->'puck_data'->'content') = 'array'
      and jsonb_array_length(layout_definition->'puck_data'->'content') between 1 and 40
    )
  )
);
