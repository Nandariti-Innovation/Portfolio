-- Dashboard access is independent of the public homepage payload.
-- The sole existing portfolio_owner account becomes the protected superadmin.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.dashboard_roles (
  role_key text primary key check (role_key ~ '^[a-z][a-z0-9_]{0,39}$'),
  display_name text not null check (length(btrim(display_name)) between 1 and 80),
  description text not null default '',
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.dashboard_permissions (
  permission_key text primary key,
  display_name text not null
);
create table public.dashboard_role_permissions (
  role_key text not null references public.dashboard_roles(role_key) on delete cascade,
  permission_key text not null references public.dashboard_permissions(permission_key) on delete cascade,
  primary key (role_key, permission_key)
);
create table public.dashboard_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role_key text not null default 'blank' references public.dashboard_roles(role_key),
  display_name text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index dashboard_one_superadmin on public.dashboard_users ((true)) where role_key = 'superadmin';

insert into public.dashboard_roles(role_key, display_name, description, is_system) values
 ('superadmin','Superadmin','Protected sole owner',true),
 ('admin','Admin','Full dashboard access',true),
 ('blank','Unassigned','No dashboard access until assigned',true);
insert into public.dashboard_permissions(permission_key,display_name) values
 ('overview.read','Dashboard overview'),('queries.read','Contact enquiries and analytics'),
 ('media.read','Media library'),('media.write','Manage media'),
 ('projects.read','View projects'),('projects.write','Manage projects'),
 ('experience.read','View experience'),('experience.write','Manage experience'),
 ('blogs.read','View blogs and drafts'),('blogs.write','Manage blogs'),
 ('sections.read','View homepage sections'),('sections.write','Manage homepage sections'),
 ('settings.read','View settings'),('settings.write','Manage settings'),
 ('templates.read','View templates'),('templates.write','Manage templates'),
 ('users.manage','Manage users and roles');

do $bootstrap$
declare owner_id uuid;
begin
  if (select count(*) from auth.users where raw_app_meta_data->>'portfolio_owner' = 'true') <> 1 then
    raise exception 'Expected exactly one existing portfolio owner; refusing unsafe superadmin bootstrap';
  end if;
  select id into owner_id from auth.users where raw_app_meta_data->>'portfolio_owner' = 'true';
  insert into public.dashboard_users(user_id,role_key,display_name)
    values (owner_id,'superadmin','Deepanshu Gulia');
end $bootstrap$;

-- No browser client may directly change the protected account, including its active flag.
create function private.protect_superadmin() returns trigger language plpgsql
security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' and old.role_key = 'superadmin' then
    raise exception 'Superadmin cannot be deleted';
  end if;
  if tg_op = 'UPDATE' and (old.role_key = 'superadmin' or new.role_key = 'superadmin') then
    raise exception 'Superadmin cannot be edited';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
create trigger protect_superadmin before update or delete on public.dashboard_users
  for each row execute function private.protect_superadmin();

-- Invited Auth users start blank, even if a client tries to add metadata with a role.
create function private.new_dashboard_user() returns trigger language plpgsql
security definer set search_path = '' as $$
begin
  insert into public.dashboard_users(user_id,role_key) values (new.id,'blank');
  return new;
end $$;
create trigger new_dashboard_user after insert on auth.users
  for each row execute function private.new_dashboard_user();

-- A private helper avoids recursive RLS on dashboard_users. Never trust user_metadata.
create function private.has_dashboard_permission(requested text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.dashboard_users u
    where u.user_id = (select auth.uid()) and u.is_active
      and (select auth.jwt()->>'aal') = 'aal2'
      and (u.role_key in ('superadmin','admin') or exists (
        select 1 from public.dashboard_role_permissions rp
        where rp.role_key = u.role_key and rp.permission_key = requested))
  );
$$;
revoke all on function private.has_dashboard_permission(text) from public, anon;
grant execute on function private.has_dashboard_permission(text) to authenticated;

alter table public.dashboard_users enable row level security;
alter table public.dashboard_roles enable row level security;
alter table public.dashboard_permissions enable row level security;
alter table public.dashboard_role_permissions enable row level security;
revoke all on public.dashboard_users, public.dashboard_roles, public.dashboard_permissions,
  public.dashboard_role_permissions from public, anon, authenticated;
grant select, update on public.dashboard_users to authenticated;
grant select, insert, update, delete on public.dashboard_roles to authenticated;
grant select on public.dashboard_permissions to authenticated;
grant select, insert, delete on public.dashboard_role_permissions to authenticated;
create policy users_self_or_manager on public.dashboard_users for select to authenticated
  using (user_id = (select auth.uid()) or (select private.has_dashboard_permission('users.manage')));
create policy users_manager_update on public.dashboard_users for update to authenticated
  using (role_key <> 'superadmin' and (select private.has_dashboard_permission('users.manage')))
  with check (role_key <> 'superadmin' and (select private.has_dashboard_permission('users.manage')));
create policy roles_manager_read on public.dashboard_roles for select to authenticated
  using ((select private.has_dashboard_permission('users.manage')));
create policy roles_manager_insert on public.dashboard_roles for insert to authenticated
  with check (not is_system and role_key not in ('superadmin','admin','blank')
    and (select private.has_dashboard_permission('users.manage')));
create policy roles_manager_update on public.dashboard_roles for update to authenticated
  using (not is_system and (select private.has_dashboard_permission('users.manage')))
  with check (not is_system and role_key not in ('superadmin','admin','blank')
    and (select private.has_dashboard_permission('users.manage')));
create policy roles_manager_delete on public.dashboard_roles for delete to authenticated
  using (not is_system and (select private.has_dashboard_permission('users.manage')));
create policy permissions_manager_read on public.dashboard_permissions for select to authenticated
  using ((select private.has_dashboard_permission('users.manage')));
create policy role_permissions_manager_read on public.dashboard_role_permissions for select to authenticated
  using ((select private.has_dashboard_permission('users.manage')) or exists
    (select 1 from public.dashboard_users u where u.user_id = (select auth.uid())
      and u.role_key = dashboard_role_permissions.role_key and u.is_active));
create policy role_permissions_manager_insert on public.dashboard_role_permissions for insert to authenticated
  with check (permission_key <> 'users.manage' and (select private.has_dashboard_permission('users.manage')) and exists
    (select 1 from public.dashboard_roles r where r.role_key = dashboard_role_permissions.role_key and not r.is_system));
create policy role_permissions_manager_delete on public.dashboard_role_permissions for delete to authenticated
  using ((select private.has_dashboard_permission('users.manage')) and exists
    (select 1 from public.dashboard_roles r where r.role_key = dashboard_role_permissions.role_key and not r.is_system));

