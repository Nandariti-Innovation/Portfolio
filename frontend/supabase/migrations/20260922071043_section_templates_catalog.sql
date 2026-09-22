-- Catalog of known homepage layouts. Keys refer to React renderers; stored data is
-- descriptive metadata and must never be treated as executable component code.
create table public.section_templates (
  template_key text primary key
    check (length(template_key) <= 64 and template_key ~ '^[a-z][a-z0-9_]*$'),
  display_name text not null
    check (length(btrim(display_name)) between 1 and 120),
  description text not null
    check (length(btrim(description)) between 1 and 500),
  layout_key text not null
    check (length(layout_key) <= 64 and layout_key ~ '^[a-z][a-z0-9_]*$'),
  reference_section_key text
    check (reference_section_key is null or reference_section_key ~ '^[a-z][a-z0-9_]*$'),
  display_fields text[] not null
    check (cardinality(display_fields) between 1 and 40),
  is_builtin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.section_templates enable row level security;
revoke all on table public.section_templates from public, anon, authenticated;
grant select on table public.section_templates to authenticated;

-- The Templates settings panel is visible only to the portfolio owner.
create policy section_templates_owner_read on public.section_templates
for select to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.jwt()->'app_metadata'->>'portfolio_owner') = 'true'
);

-- Field lists describe exactly what the current homepage layouts display.
-- They are not a promise that a different table already matches a renderer.
insert into public.section_templates
  (template_key, display_name, description, layout_key,
   reference_section_key, display_fields, is_builtin)
values
  (
    'project_v1',
    'Project cards',
    'A featured project grid with tall images, project details, technology chips and case study links.',
    'project_grid',
    'project',
    array['project_id','project_image','project_status','project_type',
          'project_company_name','project_name','project_description','project_tech_stack'],
    true
  ),
  (
    'experience_v1',
    'Experience timeline',
    'A vertical timeline with date ranges, roles, companies, descriptions and technology chips.',
    'experience_timeline',
    'experience',
    array['work_id','work_start_date','work_end_date','work_designation',
          'work_company_name','work_short_description','work_tech_stack'],
    true
  ),
  (
    'blog_v1',
    'Blog post list',
    'A compact editorial list showing publication date, topic or reading time, and article title.',
    'blog_list',
    'blog',
    array['id','published_at','tags','reading_time_minutes','title'],
    true
  );
