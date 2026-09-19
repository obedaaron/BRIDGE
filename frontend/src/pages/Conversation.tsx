import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Check, ClipboardCheck, LayoutDashboard, Moon, Send, ShieldCheck, Sun, X } from "lucide-react";
import { useBridgeTheme } from "../lib/theme";

interface Message { id: string; sender_id: string; body: string; created_at: string; }
interface Order { id: string; title: string; description: string | null; amount_kobo: number; buyer_total_kobo?: number; platform_fee_kobo?: number; processing_fee_kobo?: number; currency: string; delivery_terms: string | null; status: string; }
const messageTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const statusStyle: Record<string, string> = { proposed: "bg-gold/15 text-[var(--message-text)]", accepted: "bg-[#dce9df]/15 text-[var(--message-text)]", payment_pending: "bg-gold/15 text-[var(--message-text)]", paid: "bg-[#dce9df]/15 text-[var(--message-text)]", in_progress: "bg-ink/10 text-[var(--message-text)]", delivered: "bg-[#dce9df]/15 text-[var(--message-text)]", completed: "bg-[#dce9df]/20 text-[var(--message-text)]", rejected: "bg-[var(--message-soft)] text-[var(--message-muted)]", cancelled: "bg-[var(--message-soft)] text-[var(--message-muted)]", refunded: "bg-[var(--message-soft)] text-[var(--message-muted)]", disputed: "bg-[#dce9df]/20 text-[var(--message-text)]" };

export function Conversation() {
  const { theme, toggleTheme } = useBridgeTheme(); const dark = theme === "dark"; const themeStyle = { "--message-page": dark ? "#11110f" : "#f6f2ea", "--message-text": dark ? "#f1eee7" : "#11110f", "--message-panel": dark ? "#171714" : "#ffffff", "--message-line": dark ? "rgba(255,255,255,.15)" : "rgba(17,17,15,.15)", "--message-soft": dark ? "rgba(255,255,255,.07)" : "rgba(17,17,15,.05)", "--message-muted": dark ? "rgba(255,255,255,.58)" : "rgba(17,17,15,.58)" } as React.CSSProperties;
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

  return <div style={themeStyle} className="min-h-screen bg-[var(--message-page)] text-[var(--message-text)] font-body flex flex-col">
    <nav className="flex items-center justify-between gap-4 px-6 md:px-12 py-4 border-b border-[var(--message-line)]">
      <div className="flex items-center gap-4"><Link to="/messages" className="text-[var(--message-muted)] hover:text-[var(--message-text)]"><ArrowLeft className="w-5 h-5" /></Link><p className="font-display font-semibold text-[var(--message-text)]">{vendorName || "Conversation"}</p></div>
      <button onClick={toggleTheme} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--message-line)] text-[#d6ff57]" aria-label="Toggle theme">{dark ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}</button><Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[var(--message-muted)] hover:text-[var(--message-text)]"><LayoutDashboard className="w-3.5 h-3.5" />Dashboard</Link>
      {isVendor && <button onClick={() => setShowProposal((open) => !open)} className="text-xs font-medium bg-[#2E8B72] text-paper px-3 py-2 rounded-lg hover:bg-[#206653] transition-colors inline-flex items-center gap-1.5"><ClipboardCheck className="w-3.5 h-3.5" />Create deal</button>}
    </nav>

    <div className="max-w-2xl w-full mx-auto px-6 pt-4">
      <div className="rounded-2xl border border-[#2E8B72]/20 bg-[#dce9df]/5 px-4 py-3 flex gap-3 text-xs text-[var(--message-muted)] leading-relaxed"><ShieldCheck className="w-4 h-4 text-[#2E8B72] shrink-0 mt-0.5" /><p>Keep your agreement on BRIDGE. BRIDGE Everything is not responsible or liable for damages, injuries, or losses from negotiations or transactions completed outside the platform.</p></div>
      {error && <p className="text-xs text-[#2E8B72] mt-3">{error}</p>}

      {isVendor && showProposal && <form onSubmit={handleCreateProposal} className="mt-4 bg-[var(--message-panel)] rounded-2xl border border-[var(--message-line)] p-5 space-y-3">
        <div className="flex items-center justify-between"><div><p className="font-display font-semibold">Create a deal</p><p className="text-xs text-[var(--message-muted)] mt-1">The buyer must accept this exact amount in BRIDGE.</p></div><button type="button" onClick={() => setShowProposal(false)} className="text-[var(--message-muted)] hover:text-[var(--message-text)]"><X className="w-4 h-4" /></button></div>
        <div className="grid sm:grid-cols-[1fr_160px] gap-3"><input className="input-field" placeholder="What is this deal for?" value={proposal.title} onChange={(e) => setProposal({ ...proposal, title: e.target.value })} required /><input className="input-field" inputMode="decimal" placeholder="Amount (₦)" value={proposal.amountNaira} onChange={(e) => setProposal({ ...proposal, amountNaira: e.target.value })} required /></div>
        <textarea className="input-field min-h-20 resize-none" placeholder="What is included? (optional)" value={proposal.description} onChange={(e) => setProposal({ ...proposal, description: e.target.value })} />
        <input className="input-field" placeholder="Delivery or completion terms (optional)" value={proposal.deliveryTerms} onChange={(e) => setProposal({ ...proposal, deliveryTerms: e.target.value })} />
        <button className="btn-primary text-sm px-5 py-2.5" disabled={savingProposal}>{savingProposal ? "Creating..." : "Send deal proposal"}</button>
      </form>}

      {orders.map((order) => <div key={order.id} className="mt-4 bg-[var(--message-panel)] rounded-2xl border border-[var(--message-line)] overflow-hidden">
        <div className="p-5 flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.18em] text-[var(--message-muted)] mb-1">BRIDGE deal</p><h2 className="font-display font-semibold text-lg">{order.title}</h2>{order.description && <p className="text-sm text-[var(--message-muted)] mt-1">{order.description}</p>}</div><span className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-lg ${statusStyle[order.status]}`}>{order.status}</span></div>
        <div className="border-t border-[var(--message-line)] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p className="font-mono font-medium">{order.currency === "NGN" ? "₦" : ""}{(Number(order.amount_kobo) / 100).toLocaleString()} <span className="font-sans text-xs text-[var(--message-muted)]">seller price</span></p>{!isVendor && order.status !== "proposed" && <p className="text-xs text-[var(--message-muted)] mt-1">BRIDGE protection: ₦{(Number(order.platform_fee_kobo || 0) / 100).toLocaleString()} · Processing: ₦{(Number(order.processing_fee_kobo || 0) / 100).toLocaleString()} · <strong>Total: ₦{(Number(order.buyer_total_kobo || order.amount_kobo) / 100).toLocaleString()}</strong></p>}{isVendor && order.status !== "proposed" && <p className="text-xs text-[var(--message-muted)] mt-1">You receive the full seller price after delivery is confirmed.</p>}{order.delivery_terms && <p className="text-xs text-[var(--message-muted)] mt-1">{order.delivery_terms}</p>}</div><div className="flex flex-wrap gap-2">{!isVendor && order.status === "proposed" && <><button onClick={() => respondToOrder(order.id, "reject")} className="text-xs px-3 py-2 border border-[var(--message-line)] rounded-lg hover:bg-[var(--message-soft)]">Decline</button><button onClick={() => respondToOrder(order.id, "accept")} className="text-xs px-3 py-2 bg-[#2E8B72] text-paper rounded-lg hover:bg-[#206653] inline-flex gap-1.5 items-center"><Check className="w-3.5 h-3.5" />Accept amount</button></>}{!isVendor && order.status === "accepted" && <button onClick={() => payWithPaystack(order.id)} disabled={payingOrderId === order.id} className="text-xs px-3 py-2 bg-signal text-[var(--message-text)] font-medium rounded-lg hover:bg-[#dce9df]/90 disabled:opacity-50">{payingOrderId === order.id ? "Opening checkout..." : `Pay ₦${(Number(order.buyer_total_kobo || order.amount_kobo) / 100).toLocaleString()} securely`}</button>}{isVendor && order.status === "paid" && <button onClick={() => updateOrder(order.id, "start")} disabled={updatingOrderId === order.id} className="text-xs px-3 py-2 bg-[#2E8B72] text-paper rounded-lg disabled:opacity-50">Start fulfilment</button>}{isVendor && order.status === "in_progress" && <button onClick={() => updateOrder(order.id, "deliver")} disabled={updatingOrderId === order.id} className="text-xs px-3 py-2 bg-signal text-[var(--message-text)] rounded-lg disabled:opacity-50">Mark delivered</button>}{!isVendor && order.status === "delivered" && <button onClick={() => updateOrder(order.id, "complete")} disabled={updatingOrderId === order.id} className="text-xs px-3 py-2 bg-signal text-[var(--message-text)] rounded-lg disabled:opacity-50">Confirm delivery</button>}{["paid", "in_progress", "delivered"].includes(order.status) && <button onClick={() => updateOrder(order.id, "dispute")} disabled={updatingOrderId === order.id} className="text-xs px-3 py-2 border border-[#2E8B72]/30 text-[#2E8B72] rounded-lg disabled:opacity-50">Report issue</button>}{order.status === "payment_pending" && <p className="text-xs text-gold font-medium">Awaiting Paystack confirmation.</p>}</div></div>
      </div>)}
    </div>

    <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 overflow-y-auto flex flex-col gap-3">{messages.map((m) => <div key={m.id} className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${m.sender_id === user?.id ? "self-end bg-[#2E8B72] text-paper" : "self-start bg-[var(--message-soft)] text-[var(--message-text)]"}`}><p>{m.body}</p><time className={`mt-1 block text-[10px] ${m.sender_id === user?.id ? "text-paper/65" : "text-[var(--message-muted)]"}`}>{messageTime(m.created_at)}</time></div>)}<div ref={bottomRef} /></div>
    <form onSubmit={handleSend} className="border-t border-[var(--message-line)] px-6 md:px-12 py-4 flex gap-3 max-w-2xl w-full mx-auto"><input className="flex-1 rounded-xl border border-[var(--message-line)] bg-[var(--message-soft)] px-4 py-3 text-sm text-[var(--message-text)] outline-none" placeholder="Type a message..." value={body} onChange={(e) => setBody(e.target.value)} /><button className="btn-primary px-4" type="submit" disabled={sending}><Send className="w-4 h-4" /></button></form>
  </div>;
}
