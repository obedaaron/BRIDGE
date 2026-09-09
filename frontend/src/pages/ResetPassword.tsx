import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordInput } from "../components/PasswordInput";
import { apiFetch } from "../lib/api";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = searchParams.get("token") || "";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmation) return setError("Passwords do not match");
    setError(""); setLoading(true);
    try { await apiFetch("/auth/password-reset/confirm", { method: "POST", body: JSON.stringify({ token, password }) }); setComplete(true); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Could not reset password"); }
    finally { setLoading(false); }
  }

  return <AuthLayout title="Choose a new password" subtitle="Use at least 8 characters to keep your BRIDGE account secure." footer={<Link to="/login" className="font-semibold text-signal underline">Back to login</Link>}>
    {!token ? <p className="text-signal">This reset link is invalid or incomplete.</p> : complete ? <p className="text-charcoal/80">Password updated. <Link to="/login" className="font-semibold text-signal underline">Log in now</Link>.</p> : <form onSubmit={submit} className="flex flex-col gap-4">
      {error && <p className="rounded-xl bg-[#f7dfd9] border border-[#C94F36]/25 px-4 py-3 text-sm text-signal">{error}</p>}
      <PasswordInput value={password} onChange={setPassword} placeholder="New password" />
      <PasswordInput value={confirmation} onChange={setConfirmation} placeholder="Confirm new password" />
      <button className="btn-primary disabled:opacity-50" type="submit" disabled={loading}>{loading ? "Updating…" : "Reset password"}</button>
    </form>}
  </AuthLayout>;
}
