import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.116.0/cors";

const url = Deno.env.get("SUPABASE_URL")!;
const publishableKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const auth = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
const origins = new Set(["https://deepanshugulia.in", "https://www.deepanshugulia.in", "http://localhost:5173"]);
const isAllowedOrigin = (origin: string) => origins.has(origin) || /^https:\/\/[a-z0-9-]+-5173\.app\.github\.dev$/i.test(origin);

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  const originAllowed = !origin || isAllowedOrigin(origin);
  const headers: Record<string, string> = { ...corsHeaders, "Content-Type": "application/json", Vary: "Origin" };
  headers["Access-Control-Allow-Origin"] = originAllowed ? (origin || "*") : "null";
  headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS";
  const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (request.method === "OPTIONS") return new Response("ok", { status: originAllowed ? 200 : 403, headers });
  if (!originAllowed) return respond(403, { error: "Origin denied" });
  const jwt = request.headers.get("Authorization")?.replace(/^Bearer /i, "");
  if (!jwt) return respond(401, { error: "Sign in required" });

  const { data: claims, error: claimsError } = await auth.auth.getClaims(jwt);
  const userId = claims?.claims?.sub;
  if (claimsError || !userId || claims.claims.aal !== "aal2") return respond(403, { error: "MFA required" });
  const { data: manager, error: managerError } = await admin.from("dashboard_users")
    .select("role_key,is_active").eq("user_id", userId).single();
  if (managerError || !manager?.is_active || !["superadmin", "admin"].includes(manager.role_key))
    return respond(403, { error: "User management access denied" });

  if (request.method === "GET") {
    const members: { id: string; email: string | undefined; invited_at?: string }[] = [];
    for (let page = 1; page <= 10; page++) {
      const result = await admin.auth.admin.listUsers({ page, perPage: 100 });
      if (result.error) return respond(500, { error: "Unable to list users" });
      members.push(...result.data.users.map(u => ({ id: u.id, email: u.email, invited_at: u.invited_at })));
      if (result.data.users.length < 100) break;
    }
    return respond(200, { users: members });
  }
  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      return respond(400, { error: "Valid email required" });
    // Invites create a blank role through the Auth trigger; assigning a role is a separate action.
    const result = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: "https://deepanshugulia.in/dashboard/auth",
    });
    if (result.error) return respond(400, { error: result.error.message });
    return respond(201, { id: result.data.user.id });
  }
  if (request.method === "DELETE") {
    const body = await request.json().catch(() => ({}));
    const targetId = typeof body.user_id === "string" ? body.user_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(targetId)) return respond(400, { error: "Invalid user" });
    const { data: target } = await admin.from("dashboard_users").select("role_key").eq("user_id", targetId).single();
    if (target?.role_key === "superadmin" || targetId === userId) return respond(403, { error: "This user cannot be deleted" });
    const result = await admin.auth.admin.deleteUser(targetId);
    if (result.error) return respond(400, { error: result.error.message });
    return respond(200, { deleted: true });
  }
  return respond(405, { error: "Method not allowed" });
});
