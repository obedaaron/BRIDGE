import { useEffect, useState } from "react";
import { WalletCards, Landmark, Loader2, AlertCircle } from "lucide-react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { apiFetch } from "../../lib/api";

type WalletData = { wallet: { available_kobo: number; pending_withdrawal_kobo: number }; transactions: { entry_type: string; amount_kobo: number; created_at: string }[]; withdrawals: { id: string; amount_kobo: number; status: string; requested_at: string; failure_reason?: string }[] };
const money = (kobo: number) => `₦${(Number(kobo || 0) / 100).toLocaleString()}`;

export function Wallet() {
  const [data, setData] = useState<WalletData | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = () => apiFetch("/wallet/mine").then(setData).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  async function withdraw() {
    const naira = Number(amount);
    if (!Number.isFinite(naira) || naira < 100) return setError("Enter at least ₦100.");
    setLoading(true); setError("");
    try { await apiFetch("/wallet/withdrawals", { method: "POST", body: JSON.stringify({ amountKobo: Math.round(naira * 100) }) }); setAmount(""); load(); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }
  return <DashboardLayout><div className="max-w-4xl mx-auto">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Earnings</p><h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">BRIDGE wallet.</h1><p className="mt-3 text-ink/45 max-w-2xl">Completed protected orders are credited here. Withdrawals go only to your verified payout account and are reviewed before release.</p>
    {error && <p className="mt-5 rounded-xl bg-signal/10 p-3 text-sm text-signal flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>}
    <div className="grid sm:grid-cols-2 gap-4 mt-8"><section className="bg-ink text-paper rounded-2xl p-6"><WalletCards className="w-5 h-5 text-signal" /><p className="text-sm text-paper/55 mt-5">Available to withdraw</p><p className="font-mono text-3xl mt-1">{money(data?.wallet.available_kobo || 0)}</p></section><section className="bg-white border border-ink/10 rounded-2xl p-6"><Landmark className="w-5 h-5 text-signal" /><p className="text-sm text-ink/45 mt-5">Pending withdrawals</p><p className="font-mono text-3xl mt-1">{money(data?.wallet.pending_withdrawal_kobo || 0)}</p></section></div>
    <section className="mt-5 bg-white border border-ink/10 rounded-2xl p-6"><h2 className="font-display text-xl font-semibold">Withdraw earnings</h2><p className="text-sm text-ink/45 mt-2">Minimum ₦100. Add or update your payout bank account in Settings first.</p><div className="flex flex-col sm:flex-row gap-3 mt-5"><input className="input-field flex-1" inputMode="decimal" placeholder="Amount in naira" value={amount} onChange={(e) => setAmount(e.target.value)} /><button onClick={withdraw} disabled={loading} className="bg-ink text-paper px-5 py-3 rounded-xl text-sm disabled:opacity-50">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request withdrawal"}</button></div></section>
    <section className="mt-5 bg-white border border-ink/10 rounded-2xl p-6"><h2 className="font-display text-xl font-semibold">Withdrawal history</h2>{!data ? <Loader2 className="w-5 h-5 animate-spin mt-5" /> : data.withdrawals.length === 0 ? <p className="text-sm text-ink/40 mt-4">No withdrawal requests yet.</p> : <div className="divide-y divide-ink/5 mt-4">{data.withdrawals.map((item) => <div key={item.id} className="py-3 flex justify-between gap-4 text-sm"><div><p className="font-medium">{money(item.amount_kobo)}</p><p className="text-xs text-ink/40 mt-1">{new Date(item.requested_at).toLocaleString()}{item.failure_reason ? ` · ${item.failure_reason}` : ""}</p></div><span className="capitalize text-ink/55">{item.status.replace("_", " ")}</span></div>)}</div>}</section>
  </div></DashboardLayout>;
}
