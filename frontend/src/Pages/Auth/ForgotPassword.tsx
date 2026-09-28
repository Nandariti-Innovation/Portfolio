import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, KeyRound } from "lucide-react";
import supabase from "@/Superbase/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const redirectTo = `${window.location.origin}/auth/reset-password`;
    const { error: failure } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (failure) setError(failure.message); else setSent(true);
    setBusy(false);
  }
  return <main className="grid min-h-screen place-items-center bg-sidebar p-4"><section className="w-full max-w-md rounded-2xl bg-white p-7 text-gray-900 shadow-xl">
    <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">{sent ? <CheckCircle2/> : <KeyRound/>}</span>
    <h1 className="mt-4 text-2xl font-bold">{sent ? "Check your email" : "Forgot your password?"}</h1>
    {sent ? <><p className="mt-2 text-sm leading-6 text-gray-500">If an account exists for <strong>{email}</strong>, a secure password reset link has been sent.</p><Link to="/dashboard/auth" className="mt-6 inline-block text-sm font-medium text-primary">Return to sign in</Link></> :
      <form onSubmit={event => void submit(event)} className="mt-5 space-y-4"><p className="text-sm text-gray-500">Enter your dashboard email address and we’ll send you a reset link.</p>
        <label className="block text-sm font-medium">Email address<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
        <button disabled={busy} className="w-full rounded-lg bg-primary p-3 font-medium text-white disabled:opacity-50">{busy ? "Sending…" : "Send reset link"}</button>
        <Link to="/dashboard/auth" className="block text-center text-sm text-gray-500">Back to sign in</Link>
      </form>}
    {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
  </section></main>;
}
