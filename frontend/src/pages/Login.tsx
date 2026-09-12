import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordInput } from "../components/PasswordInput";
import { ArrowUpRight } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "admin" ? "/admin/verifications" : "/explore");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Log in to manage your storefront and connect with customers across Nigeria."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-[#d6ff57] hover:text-[#ecffad] transition-colors inline-flex items-center gap-1">
            Sign up <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
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
          <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Email</label>
          <input
            className="auth-input"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Password</label>
          <PasswordInput value={password} onChange={setPassword} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-white/60 cursor-pointer group">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${remember ? 'bg-[#d6ff57] border-[#d6ff57]' : 'border-white/25 group-hover:border-white/50'}`}>
              {remember && (
                <svg className="w-3 h-3 text-[#11110f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input type="checkbox" className="hidden" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-white/55 hover:text-[#d6ff57] transition-colors">Forgot password?</Link>
        </div>

        <button
          className="w-full bg-[#d6ff57] text-[#11110f] font-semibold py-4 hover:bg-[#ecffad] transition-colors flex items-center justify-center gap-2 mt-2"
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log in"} {!loading && <ArrowUpRight className="w-4 h-4" strokeWidth={2} />}
        </button>
      </form>
    </AuthLayout>
  );
}