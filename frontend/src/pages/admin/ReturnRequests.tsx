import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { AdminLayout } from "../../components/AdminLayout";
import { BridgeLoader } from "../../components/BridgeLoader";
import { apiFetch } from "../../lib/api";
type RequestRow = { id: string; order_id: string; order_title: string; buyer_total_kobo: number; buyer_name: string; buyer_email: string; vendor_name: string; reason: string; details: string; status: string; review_note: string | null; created_at: string };
export function ReturnRequests() {
  const [items, setItems] = useState<RequestRow[] | null>(null); const [busy, setBusy] = useState(""); const [error, setError] = useState("");
  const load = () => apiFetch("/admin/return-requests").then((data) => setItems(data.requests)).catch((err) => setError(err.message));
  useEffect(() => { void load(); }, []);
  async function review(id: string, decision: "approve" | "reject") {
    const reviewNote = window.prompt(decision === "approve" ? "Optional note for the customer:" : "Reason for declining this request:") || "";
    if (decision === "reject" && reviewNote.trim().length < 5) return;
    setBusy(id); setError("");
    try { await apiFetch(`/admin/return-requests/${id}`, { method: "PATCH", body: JSON.stringify({ decision, reviewNote }) }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not review request"); }
    finally { setBusy(""); }
  }
  return <AdminLayout><div className="mx-auto max-w-5xl"><p className="mb-3 text-xs font-semibold uppercase tracking-[.2em] text-[#d6ff57]">Customer care</p><h1 className="font-display text-4xl font-semibold">Returns & refunds.</h1><p className="mb-7 mt-3 max-w-2xl text-white/65">Review the customer’s report and decide whether to credit the paid order total to their BRIDGE wallet.</p>{error && <p role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}{items === null ? <BridgeLoader label="Loading return requests" /> : items.length === 0 ? <p className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white/70">No return requests yet.</p> : <div className="space-y-4">{items.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="rounded-full bg-[#d6ff57]/10 px-3 py-1 text-xs font-semibold capitalize text-[#d6ff57]">{item.status}</span><h2 className="mt-3 text-lg font-semibold">{item.order_title}</h2><p className="mt-1 text-sm text-white/70">{item.buyer_name} · {item.buyer_email} · {item.vendor_name}</p></div><strong>₦{(Number(item.buyer_total_kobo) / 100).toLocaleString()}</strong></div><p className="mt-4 text-sm font-semibold">{item.reason}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-white/75">{item.details}</p>{item.review_note && <p className="mt-3 text-sm text-white/65">Review note: {item.review_note}</p>}{item.status === "requested" && <div className="mt-5 flex flex-wrap gap-2"><button disabled={busy === item.id} onClick={() => void review(item.id, "approve")} className="inline-flex items-center gap-2 rounded-xl bg-[#d6ff57] px-4 py-2.5 text-sm font-semibold text-[#11110f] disabled:opacity-50"><Check className="h-4 w-4" />Approve wallet refund</button><button disabled={busy === item.id} onClick={() => void review(item.id, "reject")} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"><X className="h-4 w-4" />Decline</button></div>}</article>)}</div>}</div></AdminLayout>;
}
