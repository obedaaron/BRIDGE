import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { apiFetch } from "../lib/api";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try { await apiFetch("/auth/password-reset/request", { method: "POST", body: JSON.stringify({ email }) }); setSent(true); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Could not send reset link"); }
    finally { setLoading(false); }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send a reset link to your email."
      footer={<Link to="/login" className="font-semibold text-signal underline">Back to login</Link>}
    >
      {sent ? (
        <p className="text-charcoal/80">If an account exists for <strong>{email}</strong>, a reset link is on its way.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="rounded-xl bg-signal/10 border border-signal/20 px-4 py-3 text-sm text-signal">{error}</p>}
          <input className="input-field" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className="btn-primary disabled:opacity-50" type="submit" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
    </AuthLayout>
  );
}
