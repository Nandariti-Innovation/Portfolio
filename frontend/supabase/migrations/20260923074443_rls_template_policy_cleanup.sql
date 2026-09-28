-- Keep published templates public while allowing portfolio owners to read
-- unpublished templates through one authenticated SELECT policy.
alter policy case_study_templates_public_read on public.case_study_templates
  to anon
  using (is_published);

alter policy case_study_templates_owner_read on public.case_study_templates
  to authenticated
  using (
    is_published
    or (
      (select auth.uid()) is not null
      and ((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_owner') = 'true'
    )
  );

alter policy case_study_templates_owner_insert on public.case_study_templates
  with check (
    (select auth.uid()) is not null
    and ((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_owner') = 'true'
  );

alter policy case_study_templates_owner_update on public.case_study_templates
  using (
    (select auth.uid()) is not null
    and ((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_owner') = 'true'
  )
  with check (
    (select auth.uid()) is not null
    and ((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_owner') = 'true'
  );

alter policy case_study_templates_owner_delete on public.case_study_templates
  using (
    (select auth.uid()) is not null
    and ((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_owner') = 'true'
  );

alter policy section_templates_public_read on public.section_templates
  to anon
  using (is_published);

alter policy section_templates_owner_read on public.section_templates
  to authenticated
  using (
    is_published
    or (
      (select auth.uid()) is not null
      and ((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_owner') = 'true'
    )
  );

alter policy section_templates_owner_insert on public.section_templates
  with check (
    (select auth.uid()) is not null
    and ((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_owner') = 'true'
  );

alter policy section_templates_owner_update on public.section_templates
  using (
    (select auth.uid()) is not null
    and ((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_owner') = 'true'
  )
  with check (
    (select auth.uid()) is not null
    and ((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_owner') = 'true'
  );

alter policy section_templates_owner_delete on public.section_templates
  using (
    (select auth.uid()) is not null
    and ((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_owner') = 'true'
    and not is_builtin
  );
