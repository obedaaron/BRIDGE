import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordInput } from "../components/PasswordInput";
import { ArrowUpRight } from "lucide-react";

export function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!agreed) {
      setError("Please agree to the Terms to continue.");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, fullName);
      navigate("/explore");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account."
      subtitle="Set up your BRIDGE storefront in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-signal underline inline-flex items-center gap-1 hover:opacity-80 transition-opacity">
            Log in <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <div className="bg-signal/10 border border-signal/20 rounded-xl px-4 py-3">
            <p className="text-signal text-sm font-medium">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-paper/40 mb-2">Full name</label>
          <input
            className="input-field w-full bg-paper/5 border border-paper/10 rounded-xl px-5 py-4 text-paper placeholder:text-paper/20 outline-none focus:border-signal/50 focus:bg-paper/[0.07] transition-all"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-paper/40 mb-2">Email</label>
          <input
            className="input-field w-full bg-paper/5 border border-paper/10 rounded-xl px-5 py-4 text-paper placeholder:text-paper/20 outline-none focus:border-signal/50 focus:bg-paper/[0.07] transition-all"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-paper/40 mb-2">Password</label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Password (min. 8 characters)"
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-ink/70 text-paper/40 cursor-pointer">
          <div className="relative flex items-center justify-center mt-0.5">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${agreed ? 'bg-signal border-signal' : 'border-paper/20'}`}>
              {agreed && (
                <svg className="w-3 h-3 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input type="checkbox" className="absolute inset-0 opacity-0 cursor-pointer" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          </div>
          <span>I agree to BRIDGE's Terms of Service and Privacy Policy</span>
        </label>

        <button
          className="btn-primary w-full bg-paper text-ink font-medium py-4 rounded-xl hover:bg-paper/90 transition-colors flex items-center justify-center gap-2 mt-2"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create account"} {!loading && <ArrowUpRight className="w-4 h-4" strokeWidth={2} />}
        </button>
      </form>
    </AuthLayout>
  );
}