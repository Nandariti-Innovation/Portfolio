-- Declarative page layouts; only the application contains executable components.
create table public.case_study_templates (
  template_key text primary key check (template_key ~ '^[a-z][a-z0-9_]{0,63}$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 120),
  description text not null default '',
  layout jsonb not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_study_templates_layout_valid check (
    jsonb_typeof(layout) = 'object'
    and layout->>'schema_version' = '1'
    and jsonb_typeof(layout->'content') = 'array'
    and jsonb_array_length(layout->'content') between 1 and 60
    and pg_column_size(layout) <= 65536
  )
);

alter table public.case_study_templates enable row level security;
grant select on public.case_study_templates to anon, authenticated;
grant insert, update, delete on public.case_study_templates to authenticated;

create policy case_study_templates_public_read on public.case_study_templates
  for select to anon, authenticated using (is_published);
create policy case_study_templates_owner_read on public.case_study_templates
  for select to authenticated using (
    (select auth.uid()) is not null
    and (select auth.jwt()->'app_metadata'->>'portfolio_owner') = 'true'
  );
create policy case_study_templates_owner_insert on public.case_study_templates
  for insert to authenticated with check (
    (select auth.uid()) is not null
    and (select auth.jwt()->'app_metadata'->>'portfolio_owner') = 'true'
  );
create policy case_study_templates_owner_update on public.case_study_templates
  for update to authenticated using (
    (select auth.uid()) is not null
    and (select auth.jwt()->'app_metadata'->>'portfolio_owner') = 'true'
  ) with check (
    (select auth.uid()) is not null
    and (select auth.jwt()->'app_metadata'->>'portfolio_owner') = 'true'
  );
create policy case_study_templates_owner_delete on public.case_study_templates
  for delete to authenticated using (
    (select auth.uid()) is not null
    and (select auth.jwt()->'app_metadata'->>'portfolio_owner') = 'true'
  );

alter table public.projects add column case_study_template_key text
  references public.case_study_templates(template_key) on delete set null;
create index projects_case_study_template_idx on public.projects(case_study_template_key)
  where case_study_template_key is not null;

-- A reusable starting layout. All existing projects retain their current page
-- until an owner explicitly assigns a template.
insert into public.case_study_templates(template_key, display_name, description, is_published, layout)
values ('editorial_v1', 'Editorial case study', 'Hero, project facts, technologies, story, and links.', true,
  '{"schema_version":1,"root":{},"content":[
    {"type":"Hero","props":{"id":"case-hero","titleField":"project_name","descriptionField":"project_description","imageField":"project_image"}},
    {"type":"Facts","props":{"id":"case-facts"}},
    {"type":"Technologies","props":{"id":"case-tech"}},
    {"type":"Features","props":{"id":"case-features","title":"What I built"}},
    {"type":"Story","props":{"id":"case-challenges","title":"The challenges","field":"project_problem_faced"}},
    {"type":"Story","props":{"id":"case-learning","title":"What I learned","field":"project_learning"}},
    {"type":"Links","props":{"id":"case-links"}}
  ]}'::jsonb);
