import { useState } from "react";
import type { FormEvent } from "react";
import { KeyRound, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AdminLayout } from "../../components/AdminLayout";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { PasswordInput } from "../../components/PasswordInput";

export function AdminSettings() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    if (form.newPassword !== form.confirmPassword) return setStatus({ type: "error", message: "The new passwords do not match." });
    if (form.newPassword.length < 8) return setStatus({ type: "error", message: "Use at least 8 characters for your new password." });
    setSaving(true);
    try {
      const data = await apiFetch("/auth/me/password", { method: "PATCH", body: JSON.stringify(form) });
      setStatus({ type: "success", message: data.message || "Password updated successfully." });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      setStatus({ type: "error", message: error.message || "Could not update your password." });
    } finally { setSaving(false); }
  }

  return <AdminLayout><div className="max-w-3xl mx-auto">
    <header className="mb-8 sm:mb-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2E8B72] mb-3">Account</p><h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink tracking-tight leading-[.95]">Admin settings.</h1><p className="mt-3 text-ink/45 text-base sm:text-lg">Manage your administrator account and security.</p></header>
    <section className="bg-paper border border-ink/10 p-5 sm:p-7 mb-5"><div className="flex items-start gap-4"><div className="w-10 h-10 shrink-0 rounded-full bg-[#dce9df] text-[#2E8B72] flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div><div><p className="font-medium text-ink">Administrator account</p><p className="text-sm text-ink/50 mt-1 break-all">{user?.email}</p><p className="text-xs text-ink/35 mt-3">This account has access to platform data, reviews, and financial operations.</p></div></div></section>
    <section className="bg-paper border border-ink/10 p-5 sm:p-7"><div className="flex items-center gap-3 mb-6"><KeyRound className="w-5 h-5 text-[#2E8B72]" /><div><h2 className="font-display text-2xl font-semibold">Change password</h2><p className="text-sm text-ink/45 mt-1">Use a long, unique password you do not use elsewhere.</p></div></div>
      {status && <div className={`mb-5 flex gap-2 rounded-xl px-4 py-3 text-sm ${status.type === "success" ? "bg-[#dce9df] text-[#206653]" : "bg-red-50 text-red-700"}`}>{status.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}{status.message}</div>}
      <form onSubmit={submit} className="grid gap-4"><PasswordInput placeholder="Current password" value={form.currentPassword} onChange={(value) => setForm({ ...form, currentPassword: value })} /><PasswordInput placeholder="New password" value={form.newPassword} onChange={(value) => setForm({ ...form, newPassword: value })} /><PasswordInput placeholder="Confirm new password" value={form.confirmPassword} onChange={(value) => setForm({ ...form, confirmPassword: value })} /><button disabled={saving} className="mt-2 w-full sm:w-auto justify-self-start inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E8B72] px-6 py-3.5 text-sm font-semibold text-paper hover:bg-[#206653] disabled:opacity-50">{saving && <Loader2 className="w-4 h-4 animate-spin" />} {saving ? "Updating…" : "Update password"}</button></form>
    </section>
  </div></AdminLayout>;
}
