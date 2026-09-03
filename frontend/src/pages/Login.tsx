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
          <Link to="/signup" className="font-medium text-paper hover:text-signal transition-colors inline-flex items-center gap-1">
            Sign up <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
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
          <label className="block text-xs uppercase tracking-[0.2em] text-paper/40 mb-2">Email</label>
          <input
            className="w-full bg-paper/5 border border-paper/10 rounded-xl px-5 py-4 text-paper placeholder:text-paper/20 outline-none focus:border-signal/50 focus:bg-paper/[0.07] transition-all"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-paper/40 mb-2">Password</label>
          <PasswordInput value={password} onChange={setPassword} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-paper/40 cursor-pointer group">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${remember ? 'bg-signal border-signal' : 'border-paper/20 group-hover:border-paper/40'}`}>
              {remember && (
                <svg className="w-3 h-3 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input type="checkbox" className="hidden" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-paper/30 hover:text-signal transition-colors">Forgot password?</Link>
        </div>

        <button
          className="w-full bg-paper text-ink font-medium py-4 rounded-xl hover:bg-paper/90 transition-colors flex items-center justify-center gap-2 mt-2"
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log in"} {!loading && <ArrowUpRight className="w-4 h-4" strokeWidth={2} />}
        </button>
      </form>
    </AuthLayout>
  );
}