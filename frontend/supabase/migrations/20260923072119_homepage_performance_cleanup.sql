-- Remove the retired mentorship feature at the data layer as well as the UI.
-- The legacy view has no application consumers and was the final database
-- dependency on mentorship.
drop view if exists public.homepage_data;
drop table if exists public.mentorship;

-- Existing rows already have unique IDs; make the identifier enforceable.
update public.services
set services_id = gen_random_uuid()
where services_id is null;

alter table public.services
  alter column services_id set not null;

alter table public.services
  add constraint services_pkey primary key (services_id);

-- Index the referencing columns reported by the database advisor.
create index if not exists dashboard_role_permissions_permission_key_idx
  on public.dashboard_role_permissions (permission_key);

create index if not exists dashboard_users_role_key_idx
  on public.dashboard_users (role_key);

-- Keep the public homepage contract intentionally small. Dashboard-only and
-- retired legacy data no longer crosses the public request boundary.
create or replace function public.get_homepage_payload()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'navbar', coalesce((select jsonb_agg(n) from public.navbar n), '[]'::jsonb),
    'home_hero', coalesce((select jsonb_agg(h) from public.home_hero h), '[]'::jsonb),
    'skills', coalesce((select jsonb_agg(s) from public.skills s), '[]'::jsonb),
    'footer', coalesce((select jsonb_agg(f) from public.footer f), '[]'::jsonb),
    'social', coalesce((select jsonb_agg(s) from public.social s), '[]'::jsonb),
    'dynamic_sections', coalesce(
      public.get_homepage_sections(),
      jsonb_build_object('sections', '[]'::jsonb, 'templates', '{}'::jsonb)
    )
  );
$$;

revoke all on function public.get_homepage_payload() from public;
grant execute on function public.get_homepage_payload() to anon, authenticated;

-- Evaluate auth.uid() once per statement instead of once per row. These
-- rewrites preserve the existing access behavior while fixing RLS initplans.
alter policy "Allow Insert to Authenticated" on public.footer
  with check ((select auth.uid()) is not null);
alter policy "Allow Update to Authenticated" on public.footer
  using ((select auth.uid()) is not null);
alter policy "Allow Delete to Authenticated" on public.footer
  using ((select auth.uid()) is not null);

alter policy "Allow Insert to Authenticated" on public.home_hero
  with check ((select auth.uid()) is not null);
alter policy "Allow Update to Authenticated" on public.home_hero
  using ((select auth.uid()) is not null);
alter policy "Allow Delete to Authenticated" on public.home_hero
  using ((select auth.uid()) is not null);

alter policy "Allow Insert to Authenticated" on public.navbar
  with check ((select auth.uid()) is not null);
alter policy "Allow Update to Authenticated" on public.navbar
  using ((select auth.uid()) is not null);
alter policy "Allow Delete to Authenticated" on public.navbar
  using ((select auth.uid()) is not null);

alter policy "Allow Insert to Authenticated" on public.projects
  with check ((select auth.uid()) is not null);
alter policy "Allow Update to Authenticated" on public.projects
  using ((select auth.uid()) is not null);
alter policy "Allow Delete to Authenticated" on public.projects
  using ((select auth.uid()) is not null);

alter policy "Allow Insert to Authenticated" on public.services
  with check ((select auth.uid()) is not null);
alter policy "Allow Update to Authenticated" on public.services
  using ((select auth.uid()) is not null);
alter policy "Allow Delete to Authenticated" on public.services
  using ((select auth.uid()) is not null);

alter policy "Allow Insert to Authenticated" on public.settings
  with check ((select auth.uid()) is not null);
alter policy "Allow Update to Authenticated" on public.settings
  using ((select auth.uid()) is not null);
alter policy "Allow Delete to Authenticated" on public.settings
  using ((select auth.uid()) is not null);

alter policy "Allow Insert to Authenticated" on public.skills
  with check ((select auth.uid()) is not null);
alter policy "Allow Update to Authenticated" on public.skills
  using ((select auth.uid()) is not null);
alter policy "Allow Delete to Authenticated" on public.skills
  using ((select auth.uid()) is not null);

alter policy "Allow Insert to Authenticated" on public.social
  with check ((select auth.uid()) is not null);
alter policy "Allow Update to Authenticated" on public.social
  using ((select auth.uid()) is not null);
alter policy "Allow Delete to Authenticated" on public.social
  using ((select auth.uid()) is not null);

alter policy "Allow Insert to Authenticated" on public.testimonial
  with check ((select auth.uid()) is not null);
alter policy "Allow Update to Authenticated" on public.testimonial
  using ((select auth.uid()) is not null);
alter policy "Allow Delete to Authenticated" on public.testimonial
  using ((select auth.uid()) is not null);

alter policy "Allow Insert to Authenticated" on public.work_experience
  with check ((select auth.uid()) is not null);
alter policy "Allow Update to Authenticated" on public.work_experience
  using ((select auth.uid()) is not null);
alter policy "Allow Delete to Authenticated" on public.work_experience
  using ((select auth.uid()) is not null);

alter policy "Allow Select to Authenticated" on public.visitor_logs
  using ((select auth.uid()) is not null);
alter policy "Allow Delete to Authenticated" on public.visitor_logs
  using ((select auth.uid()) is not null);
