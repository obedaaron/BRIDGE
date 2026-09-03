import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true); // UI only — no backend endpoint yet
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
          <input className="input-field" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className="btn-primary" type="submit">Send reset link</button>
        </form>
      )}
    </AuthLayout>
  );
}