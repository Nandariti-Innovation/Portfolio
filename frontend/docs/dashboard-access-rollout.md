# Dashboard access rollout

The rollout uses two migrations because the current owner has no verified TOTP factor. Applying the enforcement migration before enrollment would block dashboard writes.

1. `20260922114853_dashboard_access_roles.sql` bootstraps protected roles, the sole existing superadmin, and `blank` for new Auth users. This migration has been applied to production; existing content policies remain active. **Do not invite users yet.**
2. Merge and deploy the frontend with `/dashboard/security`, `/dashboard/users`, and the session based guard. Sign in as the existing owner, enroll a TOTP factor in My security, verify it, and ensure the session reports `aal2`.
3. Apply `20260922114918_dashboard_access_enforcement.sql` only after step 2. This replaces permissive content policies with role permissions and MFA enforcement. Deploy `dashboard-users` with `verify_jwt = true` and server-only `SUPABASE_SERVICE_ROLE_KEY`; never put that key in `VITE_*` variables.
   The later `separate_dashboard_role_and_mfa_checks` migration refactors the permission helper without relaxing enforcement. Apply it after the enforcement migration, once MFA enrollment has been verified. Do not run all pending migrations before step 2.
4. Test access with a `blank` invited user, a custom role, an admin, and the protected superadmin.
5. Disable public email signups in Supabase Auth so new dashboard accounts are created only by invitations. Allow the production `/dashboard/auth` redirect in Supabase Auth URL settings. If Netlify serves an additional dashboard domain, add that origin to `dashboard-users` CORS and Auth redirect allowlist.
6. In Supabase Dashboard → Authentication → Passkeys, enable passkeys and configure relying party ID `deepanshugulia.in`, with `https://deepanshugulia.in` as an allowed origin. Passkeys are experimental; sign-in remains possible with email, password, and TOTP.

The `dashboard_users`, `dashboard_roles`, `dashboard_permissions`, and `dashboard_role_permissions` tables must never be added to `get_homepage_payload`. Existing public content reads remain public; writes and private reads require active membership and a matching role permission. The role assigned to a new Auth user is always `blank`. The existing owner is selected by `app_metadata.portfolio_owner = true` and is the sole immutable `superadmin`.

An admin or superadmin has every role permission automatically, but a protected dashboard session still requires `aal2`. The My security page shows these states separately and lets a signed-in user verify an existing TOTP factor. Database RLS continues to call `private.has_dashboard_permission`, which combines the separate role and session checks.
