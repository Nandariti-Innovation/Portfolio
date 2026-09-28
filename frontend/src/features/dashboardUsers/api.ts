import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";
import supabase from "@/Superbase/client";

export type DashboardMember = { user_id: string; role_key: string; display_name: string; is_active: boolean; created_at: string; updated_at: string };
export type AuthUserSummary = { id: string; email?: string; invited_at?: string; created_at?: string; confirmed_at?: string; last_sign_in_at?: string };
export type Role = { role_key: string; display_name: string; description: string; is_system: boolean };
export type Permission = { permission_key: string; display_name: string };
export type Factor = { id: string; friendly_name?: string; factor_type?: string; status: string; created_at?: string };
export type Passkey = { id: string; friendly_name?: string; created_at?: string; updated_at?: string };

export async function functionError(failure: unknown) {
  if (failure instanceof FunctionsHttpError) {
    const body = await failure.context.json().catch(() => null) as { error?: string } | null;
    return body?.error || `User service returned ${failure.context.status}.`;
  }
  if (failure instanceof FunctionsRelayError) return `User service relay error: ${failure.message}`;
  if (failure instanceof FunctionsFetchError) return "User service is unavailable. Confirm that the dashboard-users Edge Function is deployed.";
  return failure instanceof Error ? failure.message : "Unable to complete the request.";
}

export async function userService<T>(body: Record<string, unknown>) {
  const response = await supabase.functions.invoke<T>("dashboard-users", { method: "POST", body });
  if (response.error) throw response.error;
  return response.data;
}
