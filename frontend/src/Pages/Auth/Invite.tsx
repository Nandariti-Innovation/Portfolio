import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import supabase from "@/Superbase/client";

export default function Invite() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    // Supabase processes the invite callback and persists its session during client initialization.
    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!mounted) return;
      setUser(data.user);
      setName(typeof data.user?.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : "");
      if (authError && data.user) setError(authError.message);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setUser(session?.user ?? null);
        setLoading(false);
      }
      if (event === "SIGNED_OUT") setUser(null);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 12) { setError("Use a password with at least 12 characters."); return; }
    if (password !== confirmation) { setError("Passwords do not match."); return; }
    if (!name.trim()) { setError("Enter your name."); return; }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { full_name: name.trim() },
      });
      if (updateError) throw updateError;
      navigate("/dashboard", { replace: true });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Account setup failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-sidebar p-4">
    <section className="w-full max-w-md rounded-2xl bg-white p-7 text-gray-900 shadow-xl">
      <h1 className="text-2xl font-bold">Set up your account</h1>
      {loading ? <p role="status" className="mt-4 text-sm">Checking your invitation…</p>
        : !user ? <div className="mt-4 space-y-4 text-sm">
          <p>Your invitation link is invalid or has expired. Ask an administrator for a new invitation.</p>
          <Link to="/dashboard/auth" className="inline-block text-primary underline">Go to sign-in</Link>
        </div>
        : <form onSubmit={event => void complete(event)} className="mt-5 space-y-4">
          <p className="text-sm text-gray-600">Invited as {user.email}. Choose a password to finish setup.</p>
          <label className="block text-sm font-medium">Name
            <input value={name} onChange={event => setName(event.target.value)} autoComplete="name" required maxLength={80}
              className="mt-1 w-full rounded-lg border p-3" /></label>
          <label className="block text-sm font-medium">Password
            <input type="password" value={password} onChange={event => setPassword(event.target.value)}
              autoComplete="new-password" required minLength={12} className="mt-1 w-full rounded-lg border p-3" /></label>
          <label className="block text-sm font-medium">Confirm password
            <input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)}
              autoComplete="new-password" required minLength={12} className="mt-1 w-full rounded-lg border p-3" /></label>
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-primary p-3 font-medium text-white disabled:opacity-50">
            {saving ? "Saving…" : "Complete setup"}
          </button>
        </form>}
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
    </section>
  </main>;
}
