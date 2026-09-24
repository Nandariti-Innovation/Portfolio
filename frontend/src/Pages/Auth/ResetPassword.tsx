import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import supabase from "@/Superbase/client";

export default function ResetPassword() {
  const navigate = useNavigate(); const [ready, setReady] = useState(false);
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => { if (mounted) setReady(Boolean(data.session)); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) setReady(Boolean(session));
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (password.length < 12) { setError("Use a password with at least 12 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true); const { error: failure } = await supabase.auth.updateUser({ password });
    if (failure) setError(failure.message); else { await supabase.auth.signOut(); navigate("/dashboard/auth", { replace: true }); }
    setBusy(false);
  }
  return <main className="grid min-h-screen place-items-center bg-sidebar p-4"><section className="w-full max-w-md rounded-2xl bg-white p-7 text-gray-900 shadow-xl">
    <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><KeyRound/></span><h1 className="mt-4 text-2xl font-bold">Set a new password</h1>
    {!ready ? <div className="mt-4 text-sm text-gray-500"><p>This password reset link is invalid or has expired.</p><Link to="/auth/forgot-password" className="mt-4 inline-block text-primary">Request another link</Link></div> :
      <form onSubmit={event => void submit(event)} className="mt-5 space-y-4"><label className="block text-sm font-medium">New password<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
        <label className="block text-sm font-medium">Confirm password<input type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={event => setConfirm(event.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
        <button disabled={busy} className="w-full rounded-lg bg-primary p-3 font-medium text-white disabled:opacity-50">{busy ? "Saving…" : "Update password"}</button></form>}
    {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
  </section></main>;
}
