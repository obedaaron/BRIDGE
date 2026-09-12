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
      await signup(email, password, fullName, agreed);
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
          <Link to="/login" className="font-semibold text-[#d6ff57] underline underline-offset-4 inline-flex items-center gap-1 hover:text-[#ecffad] transition-opacity">
            Log in <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <div className="border-l-2 border-[#ca5b42] bg-[#ca5b42]/10 px-4 py-3">
            <p className="text-[#f1eee7] text-sm font-medium">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Full name</label>
          <input
            className="auth-input"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Email</label>
          <input
            className="auth-input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Password</label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Password (min. 8 characters)"
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-white/60 cursor-pointer">
          <div className="relative flex items-center justify-center mt-0.5">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${agreed ? 'bg-[#d6ff57] border-[#d6ff57]' : 'border-white/25'}`}>
              {agreed && (
                <svg className="w-3 h-3 text-[#11110f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input type="checkbox" className="absolute inset-0 opacity-0 cursor-pointer" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          </div>
          <span>I agree to BRIDGE's <Link to="/terms" className="underline underline-offset-4 text-[#d6ff57] hover:text-[#ecffad]">Terms of Service</Link> and <Link to="/privacy" className="underline underline-offset-4 text-[#d6ff57] hover:text-[#ecffad]">Privacy Policy</Link></span>
        </label>

        <button
          className="w-full bg-[#d6ff57] text-[#11110f] font-semibold py-4 hover:bg-[#ecffad] transition-colors flex items-center justify-center gap-2 mt-2"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create account"} {!loading && <ArrowUpRight className="w-4 h-4" strokeWidth={2} />}
        </button>
      </form>
    </AuthLayout>
  );
}
