import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "@/Superbase/client";
import { useDashboardAccess } from "@/features/dashboardAccess/DashboardAccess";

export default function Auth() {
  const navigate = useNavigate();
  const { refresh, user } = useDashboardAccess();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function afterSignIn() {
    await refresh();
    const { data, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) throw aalError;
    if (data.currentLevel !== "aal2" && data.nextLevel === "aal2") {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;
      const verified = factors.data.totp.find(f => f.status === "verified");
      if (verified) { setFactorId(verified.id); return; }
    }
    navigate("/dashboard", { replace: true });
  }

  async function signIn(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      await afterSignIn();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Sign-in failed"); }
    finally { setBusy(false); }
  }

  async function passkeySignIn() {
    setBusy(true); setError("");
    try {
      const result = await supabase.auth.signInWithPasskey();
      if (result.error) throw result.error;
      await afterSignIn();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Passkey sign-in failed"); }
    finally { setBusy(false); }
  }

  async function verify(event: FormEvent) {
    event.preventDefault(); if (!factorId) return;
    setBusy(true); setError("");
    try {
      const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (result.error) throw result.error;
      await refresh(); navigate("/dashboard", { replace: true });
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Invalid code"); }
    finally { setBusy(false); }
  }

  async function setNewPassword(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (password.length < 12) throw new Error("Use a password with at least 12 characters.");
      const result = await supabase.auth.updateUser({ password });
      if (result.error) throw result.error;
      navigate("/dashboard/settings/security", { replace: true });
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to set password"); }
    finally { setBusy(false); }
  }

  return <main className="grid min-h-screen place-items-center bg-sidebar p-4">
    <section className="w-full max-w-sm rounded-2xl bg-white p-7 text-gray-900 shadow-xl">
      <h1 className="text-2xl font-bold">Dashboard sign-in</h1>
      <p className="mt-2 text-sm text-gray-500">Access is limited to invited dashboard users.</p>
      {factorId ? <form className="mt-5 space-y-4" onSubmit={e => void verify(e)}>
        <label className="block text-sm font-medium">Authenticator code
          <input autoComplete="one-time-code" inputMode="numeric" required value={code} onChange={e => setCode(e.target.value)}
            className="mt-1 w-full rounded-lg border p-3" /></label>
        <button disabled={busy} className="w-full rounded-lg bg-primary p-3 font-medium text-white disabled:opacity-50">Verify code</button>
      </form> : user ? <form className="mt-5 space-y-4" onSubmit={e => void setNewPassword(e)}>
        <p className="text-sm">Signed in as {user.email}. If you accepted an invitation, set a password to finish setup.</p>
        <label className="block text-sm font-medium">New password
          <input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
        <button disabled={busy} className="w-full rounded-lg bg-primary p-3 text-white">Set password</button>
        <button type="button" onClick={() => navigate("/dashboard", { replace: true })} className="w-full text-sm text-primary underline">Go to dashboard</button>
      </form> : <form className="mt-5 space-y-4" onSubmit={e => void signIn(e)}>
        <label className="block text-sm font-medium">Email
          <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
        <label className="block text-sm font-medium">Password
          <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
        <div className="text-right"><Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link></div>
        <button disabled={busy} className="w-full rounded-lg bg-primary p-3 font-medium text-white disabled:opacity-50">Sign in</button>
        <button type="button" disabled={busy} onClick={() => void passkeySignIn()}
          className="w-full rounded-lg border p-3 font-medium disabled:opacity-50">Sign in with passkey</button>
      </form>}
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
    </section>
  </main>;
}
