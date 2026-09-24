import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.116.0/cors";

const url = Deno.env.get("SUPABASE_URL")!;
const publishableKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false, experimental: { passkey: true } } });
const auth = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
const origins = new Set(["https://deepanshugulia.in", "https://www.deepanshugulia.in", "http://localhost:5173", "http://localhost:5174"]);
const allowed = (origin: string) => origins.has(origin) || /^https:\/\/[a-z0-9-]+-5173\.app\.github\.dev$/i.test(origin);
const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);

Deno.serve(async request => {
  const origin = request.headers.get("origin") ?? ""; const originAllowed = !origin || allowed(origin);
  const headers: Record<string,string> = { ...corsHeaders, "Content-Type": "application/json", Vary: "Origin", "Access-Control-Allow-Origin": originAllowed ? origin || "*" : "null", "Access-Control-Allow-Methods": "POST, OPTIONS" };
  const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (request.method === "OPTIONS") return new Response("ok", { status: originAllowed ? 200 : 403, headers });
  if (!originAllowed) return respond(403, { error: "Origin denied" });
  if (request.method !== "POST") return respond(405, { error: "Method not allowed" });
  const jwt = request.headers.get("Authorization")?.replace(/^Bearer /i, "");
  if (!jwt) return respond(401, { error: "Sign in required" });
  const { data: claims, error: claimsError } = await auth.auth.getClaims(jwt); const managerId = claims?.claims?.sub;
  if (claimsError || !managerId || claims.claims.aal !== "aal2") return respond(403, { error: "MFA verification required" });
  const { data: manager } = await admin.from("dashboard_users").select("role_key,is_active").eq("user_id", managerId).single();
  if (!manager?.is_active || !["superadmin","admin"].includes(manager.role_key)) return respond(403, { error: "User management access denied" });
  const body = await request.json().catch(() => ({})); const action = typeof body.action === "string" ? body.action : "";
  const targetId = body.user_id; const redirectBase = origin && allowed(origin) ? origin : "https://deepanshugulia.in";

  if (action === "list_users") {
    const users: Record<string,unknown>[] = [];
    for (let page=1;page<=10;page++){const result=await admin.auth.admin.listUsers({page,perPage:100});if(result.error)return respond(500,{error:"Unable to list users"});users.push(...result.data.users.map(user=>({id:user.id,email:user.email,invited_at:user.invited_at,created_at:user.created_at,confirmed_at:user.confirmed_at,email_confirmed_at:user.email_confirmed_at,last_sign_in_at:user.last_sign_in_at})));if(result.data.users.length<100)break;}
    return respond(200,{users});
  }
  if (action === "invite") {
    const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";const role=typeof body.role_key==="string"?body.role_key:"blank";
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return respond(400,{error:"Valid email required"});
    if(role==="superadmin")return respond(403,{error:"Superadmin cannot be assigned"});
    const roleResult=await admin.from("dashboard_roles").select("role_key").eq("role_key",role).maybeSingle();if(roleResult.error||!roleResult.data)return respond(400,{error:"Invalid role"});
    const result=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:`${redirectBase}/auth/invite`});if(result.error)return respond(400,{error:result.error.message});
    if(role!=="blank"){const update=await admin.from("dashboard_users").update({role_key:role}).eq("user_id",result.data.user.id);if(update.error)return respond(500,{error:"Invitation sent, but the initial role could not be assigned"});}
    return respond(201,{id:result.data.user.id});
  }
  if (!uuid(targetId)) return respond(400,{error:"Invalid user"});
  const { data: targetMembership }=await admin.from("dashboard_users").select("user_id,role_key,display_name,is_active,created_at,updated_at").eq("user_id",targetId).single();
  if(!targetMembership)return respond(404,{error:"Dashboard user not found"});

  if (action === "get_user") {
    const [userResult,roleResult,rolesResult,permissionResult,factorResult,passkeyResult]=await Promise.all([
      admin.auth.admin.getUserById(targetId),
      admin.from("dashboard_roles").select("*").eq("role_key",targetMembership.role_key).single(),
      admin.from("dashboard_roles").select("*").order("created_at"),
      targetMembership.role_key==="blank"?Promise.resolve({data:[],error:null}):targetMembership.role_key==="admin"||targetMembership.role_key==="superadmin"?admin.from("dashboard_permissions").select("*").order("permission_key"):admin.from("dashboard_role_permissions").select("dashboard_permissions(permission_key,display_name)").eq("role_key",targetMembership.role_key),
      admin.auth.admin.mfa.listFactors({userId:targetId}),
      admin.auth.admin.passkey.listPasskeys({userId:targetId}),
    ]);
    if(userResult.error||roleResult.error)return respond(404,{error:"User details unavailable"});
    const rawPermissions=permissionResult.data??[];const permissions=rawPermissions.map((item: Record<string,unknown>)=>item.dashboard_permissions??item).flat();
    const user=userResult.data.user;
    return respond(200,{user:{id:user.id,email:user.email,invited_at:user.invited_at,created_at:user.created_at,confirmed_at:user.confirmed_at,email_confirmed_at:user.email_confirmed_at,last_sign_in_at:user.last_sign_in_at},membership:targetMembership,role:roleResult.data,roles:rolesResult.data??[],permissions,factors:factorResult.data?.factors??[],passkeys:passkeyResult.data??[]});
  }
  if(action==="reset_password"){const user=await admin.auth.admin.getUserById(targetId);if(user.error||!user.data.user.email)return respond(400,{error:"User email unavailable"});const result=await admin.auth.resetPasswordForEmail(user.data.user.email,{redirectTo:`${redirectBase}/auth/reset-password`});return result.error?respond(400,{error:result.error.message}):respond(200,{sent:true});}
  if(action==="delete_factor"){if(!uuid(body.factor_id))return respond(400,{error:"Invalid factor"});const result=await admin.auth.admin.mfa.deleteFactor({userId:targetId,id:body.factor_id});return result.error?respond(400,{error:result.error.message}):respond(200,{deleted:true});}
  if(action==="delete_passkey"){if(!uuid(body.passkey_id))return respond(400,{error:"Invalid passkey"});const result=await admin.auth.admin.passkey.deletePasskey({userId:targetId,passkeyId:body.passkey_id});return result.error?respond(400,{error:result.error.message}):respond(200,{deleted:true});}
  if(action==="delete_user"){if(targetMembership.role_key==="superadmin"||targetId===managerId)return respond(403,{error:"This user cannot be deleted"});const result=await admin.auth.admin.deleteUser(targetId);return result.error?respond(400,{error:result.error.message}):respond(200,{deleted:true});}
  return respond(400,{error:"Unsupported user action"});
});
