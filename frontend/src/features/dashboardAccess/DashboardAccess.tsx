import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import supabase from "@/Superbase/client";

export const PAGE_PERMISSIONS = {
  overview: "overview.read", queries: "queries.read", media: "media.read",
  projects: "projects.read", experience: "experience.read", blogs: "blogs.read",
  sections: "sections.read", settings: "settings.read", templates: "templates.read",
  users: "users.manage",
} as const;

type Access = {
  user: User | null;
  role: string | null;
  name: string;
  active: boolean;
  permissions: string[];
  aal: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  can: (permission: string) => boolean;
};

const initial: Omit<Access, "refresh" | "can"> = {
  user: null, role: null, name: "", active: false, permissions: [],
  aal: "aal1", loading: true, error: null,
};
const AccessContext = createContext<Access | null>(null);

export function DashboardAccessProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState(initial);

  async function refresh() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setAccess({ ...initial, loading: false }); return; }
    // Verify the session with Auth rather than accepting an unverified local token.
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setAccess({ ...initial, loading: false, error: authError?.message ?? "Session expired" });
      return;
    }
    const { data: membership, error } = await supabase.from("dashboard_users")
      .select("role_key,display_name,is_active").eq("user_id", user.id).maybeSingle();
    if (error) {
      setAccess({ ...initial, user, loading: false, error: error.message });
      return;
    }
    const role = membership?.role_key ?? "blank";
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    let permissions: string[] = [];
    if (membership?.is_active && !["superadmin", "admin", "blank"].includes(role)) {
      const { data, error: permissionsError } = await supabase.from("dashboard_role_permissions")
        .select("permission_key").eq("role_key", role);
      if (permissionsError) {
        setAccess({ ...initial, user, loading: false, error: permissionsError.message });
        return;
      }
      permissions = (data ?? []).map(item => item.permission_key);
    }
    setAccess({ user, role, name: membership?.display_name ?? "", active: Boolean(membership?.is_active),
      permissions, aal: assurance?.currentLevel ?? "aal1", loading: false, error: null });
  }

  useEffect(() => {
    void refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setAccess({ ...initial, loading: false });
      else if (event === "SIGNED_IN" || event === "MFA_CHALLENGE_VERIFIED" || event === "TOKEN_REFRESHED") {
        // Supabase warns against awaiting Auth methods inside this callback.
        setTimeout(() => void refresh(), 0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const can = (permission: string) => access.active && access.aal === "aal2" &&
    (access.role === "superadmin" || access.role === "admin" || access.permissions.includes(permission));
  return <AccessContext.Provider value={{ ...access, refresh, can }}>{children}</AccessContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDashboardAccess() {
  const access = useContext(AccessContext);
  if (!access) throw new Error("DashboardAccessProvider is missing");
  return access;
}
