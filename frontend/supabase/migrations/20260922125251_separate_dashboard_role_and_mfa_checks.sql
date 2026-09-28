-- Role authorization and session assurance are distinct checks. RLS still
-- requires both, including for admin and superadmin.
create function private.has_dashboard_role_permission(requested text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.dashboard_users u
    where u.user_id = (select auth.uid()) and u.is_active
      and (u.role_key in ('superadmin', 'admin') or exists (
        select 1 from public.dashboard_role_permissions rp
        where rp.role_key = u.role_key and rp.permission_key = requested))
  );
$$;

create function private.is_dashboard_session_secure() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((select auth.jwt()->>'aal') = 'aal2', false);
$$;

revoke all on function private.has_dashboard_role_permission(text) from public, anon, authenticated;
revoke all on function private.is_dashboard_session_secure() from public, anon, authenticated;

create or replace function private.has_dashboard_permission(requested text) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_dashboard_session_secure()
    and private.has_dashboard_role_permission(requested);
$$;
