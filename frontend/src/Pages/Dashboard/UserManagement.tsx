import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";
import supabase from "@/Superbase/client";
import { useDashboardAccess } from "@/features/dashboardAccess/DashboardAccess";

type Member = { user_id: string; role_key: string; display_name: string; is_active: boolean };
type Role = { role_key: string; display_name: string; description: string; is_system: boolean };
type Permission = { permission_key: string; display_name: string };
type Assignment = { role_key: string; permission_key: string };
type AuthUser = { id: string; email?: string; invited_at?: string };

async function failureMessage(failure: unknown) {
  if (failure instanceof FunctionsHttpError) {
    const body = await failure.context.json().catch(() => null) as { error?: string } | null;
    return body?.error || `User service returned ${failure.context.status}.`;
  }
  if (failure instanceof FunctionsRelayError) return `User service relay error: ${failure.message}`;
  if (failure instanceof FunctionsFetchError) return "User service is unavailable. Confirm that the dashboard-users Edge Function is deployed.";
  if (failure && typeof failure === "object" && "message" in failure && typeof failure.message === "string") return failure.message;
  return failure instanceof Error ? failure.message : "Unable to complete the request.";
}

export default function UserManagement({ embedded = false }: { embedded?: boolean }) {
  const { refresh } = useDashboardAccess();
  const [members, setMembers] = useState<Member[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [email, setEmail] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [roleName, setRoleName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [memberResponse, roleResponse, permissionResponse, assignmentResponse, userResponse] = await Promise.all([
      supabase.from("dashboard_users").select("user_id,role_key,display_name,is_active").order("created_at"),
      supabase.from("dashboard_roles").select("role_key,display_name,description,is_system").order("created_at"),
      supabase.from("dashboard_permissions").select("permission_key,display_name").order("permission_key"),
      supabase.from("dashboard_role_permissions").select("role_key,permission_key"),
      supabase.functions.invoke("dashboard-users", { method: "GET" }),
    ]);
    const failure = memberResponse.error || roleResponse.error || permissionResponse.error || assignmentResponse.error;
    if (failure) { setError(failure.message); return; }
    setMembers(memberResponse.data ?? []); setRoles(roleResponse.data ?? []);
    setPermissions(permissionResponse.data ?? []); setAssignments(assignmentResponse.data ?? []);
    if (userResponse.error) {
      setAuthUsers([]);
      setError(await failureMessage(userResponse.error));
    } else {
      setAuthUsers(userResponse.data?.users ?? []);
      setError("");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function run(action: () => PromiseLike<{ error?: { message: string } | null }>, success: string) {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await action();
      if (result.error) throw result.error;
      setNotice(success); await load(); await refresh();
    } catch (failure) { setError(await failureMessage(failure)); }
    finally { setBusy(false); }
  }

  async function invite(event: FormEvent) {
    event.preventDefault();
    await run(() => supabase.functions.invoke("dashboard-users", { body: { email } }), "Invitation sent. New user starts with the blank role.");
    setEmail("");
  }
  async function createRole(event: FormEvent) {
    event.preventDefault();
    await run(() => supabase.from("dashboard_roles").insert({ role_key: roleKey, display_name: roleName }), "Role created.");
    setRoleKey(""); setRoleName("");
  }
  async function togglePermission(role: Role, permission: string, checked: boolean) {
    await run(() => checked
      ? supabase.from("dashboard_role_permissions").insert({ role_key: role.role_key, permission_key: permission })
      : supabase.from("dashboard_role_permissions").delete().eq("role_key", role.role_key).eq("permission_key", permission),
    "Permissions updated.");
  }

  return <div className={embedded ? "text-gray-900 dark:text-white" : "h-full min-w-0 flex-1 overflow-y-auto bg-background p-5 text-gray-900 dark:bg-darkthemebg dark:text-white sm:p-8"}>
    <div className="mx-auto max-w-6xl space-y-6">
      <header><h1 className="text-3xl font-bold">User management</h1><p className="mt-1 text-sm text-gray-500">Invite users, assign roles, and choose which dashboard pages they can access.</p></header>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-700">{notice}</p>}
      <form onSubmit={e => void invite(e)} className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <label className="flex-1 text-sm font-medium">Invite by email
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@example.com"
            className="mt-2 w-full rounded-lg border p-2 text-gray-900" /></label>
        <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50">Send invite</button>
      </form>
      <section className="overflow-x-auto rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Dashboard users</h2>
        <table className="w-full min-w-[660px] text-left text-sm"><thead><tr><th className="p-2">User</th><th className="p-2">Display name</th><th className="p-2">Role</th><th className="p-2">Active</th><th className="p-2">Actions</th></tr></thead>
          <tbody>{members.map(member => <tr key={member.user_id} className="border-t dark:border-gray-700">
            <td className="p-2">{authUsers.find(u => u.id === member.user_id)?.email ?? member.user_id}</td>
            <td className="p-2"><input aria-label="Display name" defaultValue={member.display_name} key={`${member.user_id}:${member.display_name}`}
              disabled={busy || member.role_key === "superadmin"} onBlur={e => { if (e.target.value !== member.display_name) void run(() => supabase.from("dashboard_users").update({ display_name: e.target.value }).eq("user_id", member.user_id), "Name saved."); }}
              className="w-36 rounded border px-2 py-1 text-gray-900 disabled:opacity-60" /></td>
            <td className="p-2"><select aria-label="User role" value={member.role_key} disabled={busy || member.role_key === "superadmin"}
              onChange={e => void run(() => supabase.from("dashboard_users").update({ role_key: e.target.value }).eq("user_id", member.user_id), "Role updated.")}
              className="rounded border px-2 py-1 text-gray-900 disabled:opacity-60">
              {roles.filter(r => r.role_key !== "superadmin" || member.role_key === "superadmin").map(r => <option key={r.role_key} value={r.role_key}>{r.display_name}</option>)}
            </select></td>
            <td className="p-2"><input aria-label="User active" type="checkbox" checked={member.is_active} disabled={busy || member.role_key === "superadmin"}
              onChange={e => void run(() => supabase.from("dashboard_users").update({ is_active: e.target.checked }).eq("user_id", member.user_id), "User updated.")} /></td>
            <td className="p-2">{member.role_key === "superadmin" ? <span>Protected</span> : <button disabled={busy} className="text-red-600 underline" onClick={() => {
              if (window.confirm("Permanently delete this Auth user?")) void run(() => supabase.functions.invoke("dashboard-users", { method: "DELETE", body: { user_id: member.user_id } }), "User deleted.");
            }}>Delete</button>}</td>
          </tr>)}</tbody>
        </table>
      </section>
      <section className="space-y-4 rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-semibold">Roles and dashboard sections</h2>
        <form onSubmit={e => void createRole(e)} className="flex flex-wrap gap-2">
          <input required pattern="[a-z][a-z0-9_]{0,39}" placeholder="Role key (e.g. blog_editor)" value={roleKey} onChange={e => setRoleKey(e.target.value)} className="rounded border p-2 text-gray-900" />
          <input required placeholder="Display name" value={roleName} onChange={e => setRoleName(e.target.value)} className="rounded border p-2 text-gray-900" />
          <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm text-white">Create role</button>
        </form>
        {roles.map(role => <article key={role.role_key} className="rounded-xl border p-4 dark:border-gray-700">
          <div className="flex justify-between gap-3"><div><h3 className="font-semibold">{role.display_name}</h3><p className="text-xs text-gray-500">{role.role_key}{role.is_system ? " · built-in" : ""}</p></div>
            {!role.is_system && <button className="text-sm text-red-600 underline" disabled={busy} onClick={() => {
              if (window.confirm("Delete this role? Assign its users another role first.")) void run(() => supabase.from("dashboard_roles").delete().eq("role_key", role.role_key), "Role deleted.");
            }}>Delete role</button>}</div>
          {role.role_key === "blank" ? <p className="mt-2 text-sm text-gray-500">No access until another role is assigned.</p> : role.is_system ?
            <p className="mt-2 text-sm text-gray-500">Full access. This built-in role cannot be edited.</p> :
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{permissions.filter(p => p.permission_key !== "users.manage").map(p => <label key={p.permission_key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled={busy} checked={assignments.some(a => a.role_key === role.role_key && a.permission_key === p.permission_key)}
                onChange={e => void togglePermission(role, p.permission_key, e.target.checked)} />
              <span>{p.display_name} <small className="text-gray-500">({p.permission_key})</small></span>
            </label>)}</div>}
        </article>)}
      </section>
    </div>
  </div>;
}
