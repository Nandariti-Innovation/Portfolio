import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/Superbase/client";
import { useDashboardAccess } from "@/features/dashboardAccess/DashboardAccess";

type Factor = { id: string; friendly_name?: string; status: string };
type Passkey = { id: string; friendly_name?: string; created_at?: string };

export default function Security() {
  const navigate = useNavigate();
  const { user, role, active, aal, isMfaSatisfied, refresh } = useDashboardAccess();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [enrollment, setEnrollment] = useState<{ id: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const [verificationFactorId, setVerificationFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [factorResponse, passkeyResponse] = await Promise.all([
      supabase.auth.mfa.listFactors(), supabase.auth.passkey.list(),
    ]);
    if (factorResponse.error) setError(factorResponse.error.message);
    else setFactors(factorResponse.data.totp.filter(f => f.status === "verified"));
    if (!passkeyResponse.error) setPasskeys(passkeyResponse.data ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function startEnrollment() {
    setBusy(true); setError(""); setNotice("");
    const { data, error: failure } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (failure) setError(failure.message);
    else setEnrollment({ id: data.id, qr: data.totp.qr_code });
    setBusy(false);
  }
  async function verifyEnrollment(event: FormEvent) {
    event.preventDefault(); if (!enrollment) return;
    setBusy(true); setError("");
    const result = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollment.id, code });
    if (result.error) setError(result.error.message);
    else { setEnrollment(null); setCode(""); setNotice("Authenticator enabled."); await refresh(); await load(); }
    setBusy(false);
  }
  async function verifyExistingFactor(event: FormEvent) {
    event.preventDefault(); if (!verificationFactorId) return;
    setBusy(true); setError("");
    const result = await supabase.auth.mfa.challengeAndVerify({ factorId: verificationFactorId, code: verificationCode });
    if (result.error) setError(result.error.message);
    else {
      setVerificationFactorId(null); setVerificationCode("");
      await refresh();
      if (active && role !== "blank") navigate("/dashboard", { replace: true });
      else setNotice("Authenticator verified.");
    }
    setBusy(false);
  }
  async function addPasskey() {
    setBusy(true); setError(""); setNotice("");
    const result = await supabase.auth.registerPasskey();
    if (result.error) setError(result.error.message);
    else { setNotice("Passkey registered."); await load(); }
    setBusy(false);
  }
  async function removePasskey(id: string) {
    if (!window.confirm("Remove this passkey?")) return;
    const result = await supabase.auth.passkey.delete({ passkeyId: id });
    if (result.error) setError(result.error.message);
    else await load();
  }
  async function removeFactor(id: string) {
    if (!window.confirm("Remove this authenticator? Make sure you have another way to sign in.")) return;
    const result = await supabase.auth.mfa.unenroll({ factorId: id });
    if (result.error) setError(result.error.message);
    else { await supabase.auth.refreshSession(); await refresh(); await load(); }
  }

  return <main className="h-full min-w-0 flex-1 overflow-y-auto bg-background p-5 text-gray-900 dark:bg-darkthemebg dark:text-white sm:p-8">
    <div className="mx-auto max-w-3xl space-y-6">
      <header><h1 className="text-3xl font-bold">My security</h1><p className="mt-2 text-sm text-gray-500">{user?.email} · Session assurance: {aal}</p>
        <p className="mt-2 text-sm">Role access: {active ? (["superadmin", "admin"].includes(role ?? "") ? "Full dashboard access" : role === "blank" ? "Pending role assignment" : `Assigned role: ${role}`) : "Inactive"}. Session security: {isMfaSatisfied ? "Verified" : "MFA verification required"}.</p>
      </header>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-700">{notice}</p>}
      <section className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-semibold">Authenticator app</h2>
        <p className="mt-2 text-sm text-gray-500">Required to enter and manage the dashboard. Add a second authenticator for recovery.</p>
        <ul className="my-3 space-y-2">{factors.map(f => <li key={f.id} className="flex justify-between gap-3 text-sm"><span>{f.friendly_name || "Authenticator"}</span>
          {!isMfaSatisfied && <button type="button" disabled={busy} className="text-primary underline" onClick={() => { setVerificationFactorId(f.id); setVerificationCode(""); }}>Verify session</button>}
          {factors.length > 1 && aal === "aal2" && <button className="text-red-600 underline" onClick={() => void removeFactor(f.id)}>Remove</button>}</li>)}</ul>
        {verificationFactorId && !isMfaSatisfied && <form onSubmit={e => void verifyExistingFactor(e)} className="mb-4 space-y-3">
          <label className="block text-sm">Enter the code from your authenticator app
            <input required inputMode="numeric" autoComplete="one-time-code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="mt-2 block rounded-lg border p-2 text-gray-900" />
          </label>
          <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50">Verify and enter dashboard</button>
        </form>}
        {enrollment ? <form onSubmit={e => void verifyEnrollment(e)} className="space-y-3">
          <p className="text-sm">Scan this code in your authenticator app, then enter the six-digit code.</p>
          <img src={enrollment.qr} width={180} height={180} alt="Authenticator setup QR code" />
          <input required inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)}
            placeholder="Authenticator code" className="rounded-lg border p-2 text-gray-900" />
          <button disabled={busy} className="ml-2 rounded-lg bg-primary px-4 py-2 text-white">Verify</button>
        </form> : <button disabled={busy} onClick={() => void startEnrollment()} className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50">Add authenticator</button>}
      </section>
      <section className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-xl font-semibold">Passkeys</h2>
        <p className="mt-2 text-sm text-gray-500">Sign in using a supported device or password manager. Passkey support is experimental.</p>
        <ul className="my-3 space-y-2">{passkeys.map(p => <li key={p.id} className="flex justify-between gap-3 text-sm"><span>{p.friendly_name || "Passkey"}</span>
          <button className="text-red-600 underline" onClick={() => void removePasskey(p.id)}>Remove</button></li>)}</ul>
        <button disabled={busy} onClick={() => void addPasskey()} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Add passkey</button>
      </section>
    </div>
  </main>;
}
