import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Check, ClipboardCheck, LayoutDashboard, Send, ShieldCheck, X } from "lucide-react";

interface Message { id: string; sender_id: string; body: string; }
interface Order { id: string; title: string; description: string | null; amount_kobo: number; buyer_total_kobo?: number; platform_fee_kobo?: number; processing_fee_kobo?: number; currency: string; delivery_terms: string | null; status: string; }
const statusStyle: Record<string, string> = { proposed: "bg-gold/15 text-ink", accepted: "bg-signal/15 text-ink", payment_pending: "bg-gold/15 text-ink", paid: "bg-signal/15 text-ink", in_progress: "bg-ink/10 text-ink", delivered: "bg-signal/15 text-ink", completed: "bg-signal/20 text-ink", rejected: "bg-ink/5 text-ink/50", cancelled: "bg-ink/5 text-ink/50", refunded: "bg-ink/5 text-ink/50", disputed: "bg-signal/20 text-ink" };

export function Conversation() {
  const { id } = useParams();
  const { user } = useAuth();
  const [vendorName, setVendorName] = useState("");
  const [isVendor, setIsVendor] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [proposal, setProposal] = useState({ title: "", amountNaira: "", description: "", deliveryTerms: "" });
  const [error, setError] = useState("");
  const [savingProposal, setSavingProposal] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const [conversationData, orderData] = await Promise.all([apiFetch(`/messages/conversations/${id}/messages`), apiFetch(`/orders/conversations/${id}`)]);
    setVendorName(conversationData.conversation.counterpart_name || conversationData.conversation.vendor_name);
    setIsVendor(conversationData.conversation.viewer_is_vendor);
    setMessages(conversationData.messages);
    setOrders(orderData.orders);
  }

  useEffect(() => { load().catch(() => undefined); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, orders]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try { await apiFetch(`/messages/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) }); setBody(""); await load(); }
    finally { setSending(false); }
  }

  async function handleCreateProposal(e: FormEvent) {
    e.preventDefault(); setError(""); setSavingProposal(true);
    try {
      await apiFetch(`/orders/conversations/${id}/proposals`, { method: "POST", body: JSON.stringify({ ...proposal, amountNaira: Number(proposal.amountNaira.replace(/,/g, "")) }) });
      setProposal({ title: "", amountNaira: "", description: "", deliveryTerms: "" }); setShowProposal(false); await load();
    } catch (err: any) { setError(err.message); }
    finally { setSavingProposal(false); }
  }

  async function respondToOrder(orderId: string, action: "accept" | "reject") {
    try { await apiFetch(`/orders/${orderId}/respond`, { method: "PATCH", body: JSON.stringify({ action }) }); await load(); }
    catch (err: any) { setError(err.message); }
  }

  async function payWithPaystack(orderId: string) {
    setError(""); setPayingOrderId(orderId);
    try {
      const data = await apiFetch(`/payments/orders/${orderId}/paystack`, { method: "POST" });
      window.location.assign(data.authorizationUrl);
    } catch (err: any) { setError(err.message); setPayingOrderId(null); }
  }

  async function updateOrder(orderId: string, action: "start" | "deliver" | "complete" | "dispute") {
    setError(""); setUpdatingOrderId(orderId);
    try {
      if (action === "dispute") {
        const reason = window.prompt("Tell BRIDGE support what went wrong (at least 10 characters):");
        if (!reason) return;
        await apiFetch(`/orders/${orderId}/disputes`, { method: "POST", body: JSON.stringify({ reason }) });
      } else await apiFetch(`/orders/${orderId}/${action}`, { method: "PATCH" });
      await load();
    } catch (err: any) { setError(err.message); }
    finally { setUpdatingOrderId(null); }
  }

  return <div className="min-h-screen bg-paper text-ink font-body flex flex-col">
    <nav className="flex items-center justify-between gap-4 px-6 md:px-12 py-4 border-b border-ink/10">
      <div className="flex items-center gap-4"><Link to="/messages" className="text-ink/50 hover:text-ink"><ArrowLeft className="w-5 h-5" /></Link><p className="font-display font-semibold text-ink">{vendorName || "Conversation"}</p></div>
      <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-ink"><LayoutDashboard className="w-3.5 h-3.5" />Dashboard</Link>
      {isVendor && <button onClick={() => setShowProposal((open) => !open)} className="text-xs font-medium bg-ink text-paper px-3 py-2 rounded-full hover:bg-ink/90 transition-colors inline-flex items-center gap-1.5"><ClipboardCheck className="w-3.5 h-3.5" />Create deal</button>}
    </nav>

    <div className="max-w-2xl w-full mx-auto px-6 pt-4">
      <div className="rounded-xl border border-signal/20 bg-signal/5 px-4 py-3 flex gap-3 text-xs text-ink/65 leading-relaxed"><ShieldCheck className="w-4 h-4 text-signal shrink-0 mt-0.5" /><p>Keep your agreement on BRIDGE. BRIDGE Everything is not responsible or liable for damages, injuries, or losses from negotiations or transactions completed outside the platform.</p></div>
      {error && <p className="text-xs text-signal mt-3">{error}</p>}

      {isVendor && showProposal && <form onSubmit={handleCreateProposal} className="mt-4 bg-white rounded-2xl border border-ink/10 p-5 space-y-3">
        <div className="flex items-center justify-between"><div><p className="font-display font-semibold">Create a deal</p><p className="text-xs text-ink/40 mt-1">The buyer must accept this exact amount in BRIDGE.</p></div><button type="button" onClick={() => setShowProposal(false)} className="text-ink/35 hover:text-ink"><X className="w-4 h-4" /></button></div>
        <div className="grid sm:grid-cols-[1fr_160px] gap-3"><input className="input-field" placeholder="What is this deal for?" value={proposal.title} onChange={(e) => setProposal({ ...proposal, title: e.target.value })} required /><input className="input-field" inputMode="decimal" placeholder="Amount (₦)" value={proposal.amountNaira} onChange={(e) => setProposal({ ...proposal, amountNaira: e.target.value })} required /></div>
        <textarea className="input-field min-h-20 resize-none" placeholder="What is included? (optional)" value={proposal.description} onChange={(e) => setProposal({ ...proposal, description: e.target.value })} />
        <input className="input-field" placeholder="Delivery or completion terms (optional)" value={proposal.deliveryTerms} onChange={(e) => setProposal({ ...proposal, deliveryTerms: e.target.value })} />
        <button className="btn-primary text-sm px-5 py-2.5" disabled={savingProposal}>{savingProposal ? "Creating..." : "Send deal proposal"}</button>
      </form>}

      {orders.map((order) => <div key={order.id} className="mt-4 bg-white rounded-2xl border border-ink/10 overflow-hidden">
        <div className="p-5 flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.18em] text-ink/35 mb-1">BRIDGE deal</p><h2 className="font-display font-semibold text-lg">{order.title}</h2>{order.description && <p className="text-sm text-ink/50 mt-1">{order.description}</p>}</div><span className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${statusStyle[order.status]}`}>{order.status}</span></div>
        <div className="border-t border-ink/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p className="font-mono font-medium">{order.currency === "NGN" ? "₦" : ""}{(Number(order.amount_kobo) / 100).toLocaleString()} <span className="font-sans text-xs text-ink/40">seller price</span></p>{!isVendor && order.status !== "proposed" && <p className="text-xs text-ink/50 mt-1">BRIDGE protection: ₦{(Number(order.platform_fee_kobo || 0) / 100).toLocaleString()} · Processing: ₦{(Number(order.processing_fee_kobo || 0) / 100).toLocaleString()} · <strong>Total: ₦{(Number(order.buyer_total_kobo || order.amount_kobo) / 100).toLocaleString()}</strong></p>}{isVendor && order.status !== "proposed" && <p className="text-xs text-ink/40 mt-1">You receive the full seller price after delivery is confirmed.</p>}{order.delivery_terms && <p className="text-xs text-ink/40 mt-1">{order.delivery_terms}</p>}</div><div className="flex flex-wrap gap-2">{!isVendor && order.status === "proposed" && <><button onClick={() => respondToOrder(order.id, "reject")} className="text-xs px-3 py-2 border border-ink/10 rounded-full hover:bg-ink/5">Decline</button><button onClick={() => respondToOrder(order.id, "accept")} className="text-xs px-3 py-2 bg-ink text-paper rounded-full hover:bg-ink/90 inline-flex gap-1.5 items-center"><Check className="w-3.5 h-3.5" />Accept amount</button></>}{!isVendor && order.status === "accepted" && <button onClick={() => payWithPaystack(order.id)} disabled={payingOrderId === order.id} className="text-xs px-3 py-2 bg-signal text-ink font-medium rounded-full hover:bg-signal/90 disabled:opacity-50">{payingOrderId === order.id ? "Opening checkout..." : `Pay ₦${(Number(order.buyer_total_kobo || order.amount_kobo) / 100).toLocaleString()} securely`}</button>}{isVendor && order.status === "paid" && <button onClick={() => updateOrder(order.id, "start")} disabled={updatingOrderId === order.id} className="text-xs px-3 py-2 bg-ink text-paper rounded-full disabled:opacity-50">Start fulfilment</button>}{isVendor && order.status === "in_progress" && <button onClick={() => updateOrder(order.id, "deliver")} disabled={updatingOrderId === order.id} className="text-xs px-3 py-2 bg-signal text-ink rounded-full disabled:opacity-50">Mark delivered</button>}{!isVendor && order.status === "delivered" && <button onClick={() => updateOrder(order.id, "complete")} disabled={updatingOrderId === order.id} className="text-xs px-3 py-2 bg-signal text-ink rounded-full disabled:opacity-50">Confirm delivery</button>}{["paid", "in_progress", "delivered"].includes(order.status) && <button onClick={() => updateOrder(order.id, "dispute")} disabled={updatingOrderId === order.id} className="text-xs px-3 py-2 border border-signal/30 text-signal rounded-full disabled:opacity-50">Report issue</button>}{order.status === "payment_pending" && <p className="text-xs text-gold font-medium">Awaiting Paystack confirmation.</p>}</div></div>
      </div>)}
    </div>

    <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 overflow-y-auto flex flex-col gap-3">{messages.map((m) => <div key={m.id} className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${m.sender_id === user?.id ? "self-end bg-ink text-paper" : "self-start bg-ink/5 text-ink"}`}>{m.body}</div>)}<div ref={bottomRef} /></div>
    <form onSubmit={handleSend} className="border-t border-ink/10 px-6 md:px-12 py-4 flex gap-3 max-w-2xl w-full mx-auto"><input className="flex-1 input-field" placeholder="Type a message..." value={body} onChange={(e) => setBody(e.target.value)} /><button className="btn-primary px-4" type="submit" disabled={sending}><Send className="w-4 h-4" /></button></form>
  </div>;
}
