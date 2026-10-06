import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Check, ClipboardCheck, Moon, Send, ShieldCheck, Sun, X } from "lucide-react";
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


  async function updateOrder(orderId: string, action: "start" | "dispatch" | "deliver" | "complete" | "dispute") {
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

  return <div style={themeStyle} className="min-h-[100dvh] bg-[var(--message-page)] text-[var(--message-text)] font-body flex flex-col">
    <header className="sticky top-0 z-30 border-b border-[var(--message-line)] bg-[var(--message-page)]/95 backdrop-blur-xl">
      <nav aria-label="Conversation navigation" className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/messages" aria-label="Back to messages" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--message-line)] text-[var(--message-muted)] hover:bg-[var(--message-soft)]"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="min-w-0 flex-1"><p className="truncate font-display font-semibold text-[var(--message-text)]">{vendorName || "Conversation"}</p><p className="text-xs text-[var(--message-muted)]">{isVendor ? "Customer conversation" : "Store conversation"} · Protected on BRIDGE</p></div>
        <div className="hidden items-center gap-1 sm:flex"><Link to="/explore" className="rounded-full px-3 py-2 text-sm text-[var(--message-muted)] hover:bg-[var(--message-soft)] hover:text-[var(--message-text)]">Explore</Link><Link to="/orders" className="rounded-full px-3 py-2 text-sm text-[var(--message-muted)] hover:bg-[var(--message-soft)] hover:text-[var(--message-text)]">Orders</Link><Link to="/messages" aria-current="page" className="rounded-full bg-[#d6ff57] px-3 py-2 text-sm font-semibold text-[#11110f]">Messages</Link></div>
        <button onClick={toggleTheme} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--message-line)] text-[#2e8b72]" aria-label="Toggle theme">{dark ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}</button>
        {isVendor && <button onClick={() => setShowProposal((open) => !open)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#2e8b72] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#206653]"><ClipboardCheck className="h-3.5 w-3.5" /><span className="hidden sm:inline">Create deal</span></button>}
      </nav>
    </header>    <div className="mx-auto w-full max-w-4xl px-4 pt-4 sm:px-6">
      <div className="rounded-2xl border border-[#2E8B72]/20 bg-[#dce9df]/5 px-4 py-3 flex gap-3 text-xs text-[var(--message-muted)] leading-relaxed"><ShieldCheck className="w-4 h-4 text-[#2E8B72] shrink-0 mt-0.5" /><p>Keep your agreement and payments on BRIDGE. This helps protect both sides and keeps your order details in one place.</p></div>
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
        <div className="border-t border-[var(--message-line)] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p className="font-mono font-medium">{order.currency === "NGN" ? "₦" : ""}{(Number(order.amount_kobo) / 100).toLocaleString()} <span className="font-sans text-xs text-[var(--message-muted)]">seller price</span></p>{!isVendor && order.status !== "proposed" && <p className="text-xs text-[var(--message-muted)] mt-1"><strong>Total: ₦{(Number(order.buyer_total_kobo || order.amount_kobo) / 100).toLocaleString()}</strong></p>}{isVendor && order.status !== "proposed" && <p className="text-xs text-[var(--message-muted)] mt-1">You receive the full seller price after delivery is confirmed.</p>}{order.delivery_terms && <p className="text-xs text-[var(--message-muted)] mt-1">{order.delivery_terms}</p>}</div><div className="flex flex-wrap gap-2">{!isVendor && order.status === "proposed" && <><button onClick={() => respondToOrder(order.id, "reject")} className="text-xs px-3 py-2 border border-[var(--message-line)] rounded-lg hover:bg-[var(--message-soft)]">Decline</button><button onClick={() => respondToOrder(order.id, "accept")} className="text-xs px-3 py-2 bg-[#2E8B72] text-paper rounded-lg hover:bg-[#206653] inline-flex gap-1.5 items-center"><Check className="w-3.5 h-3.5" />Accept amount</button></>}{!isVendor && order.status === "accepted" && <Link to="/orders" className="text-xs px-3 py-2 bg-signal text-[var(--message-text)] font-medium rounded-lg">Continue payment in My Orders</Link>}{isVendor && order.status === "paid" && <button onClick={() => updateOrder(order.id, "start")} disabled={updatingOrderId === order.id} className="text-xs px-3 py-2 bg-[#2E8B72] text-paper rounded-lg disabled:opacity-50">Start fulfilment</button>}{isVendor && order.status === "in_progress" && <button onClick={() => updateOrder(order.id, "dispatch")} disabled={updatingOrderId === order.id} className="text-xs px-3 py-2 bg-signal text-[var(--message-text)] rounded-lg disabled:opacity-50">Send out for delivery</button>}{isVendor && order.status === "out_for_delivery" && <button onClick={() => updateOrder(order.id, "deliver")} disabled={updatingOrderId === order.id} className="text-xs px-3 py-2 bg-signal text-[var(--message-text)] rounded-lg disabled:opacity-50">Confirm delivered</button>}{!isVendor && order.status === "delivered" && <button onClick={() => updateOrder(order.id, "complete")} disabled={updatingOrderId === order.id} className="text-xs px-3 py-2 bg-signal text-[var(--message-text)] rounded-lg disabled:opacity-50">Confirm delivery</button>}{["paid", "in_progress", "out_for_delivery", "delivered"].includes(order.status) && <button onClick={() => updateOrder(order.id, "dispute")} disabled={updatingOrderId === order.id} className="text-xs px-3 py-2 border border-[#2E8B72]/30 text-[#2E8B72] rounded-lg disabled:opacity-50">Report issue</button>}{order.status === "payment_pending" && <p className="text-xs text-gold font-medium">Awaiting Paystack confirmation.</p>}</div></div>
      </div>)}
    </div>

    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-6 sm:px-6">{messages.map((m) => <div key={m.id} className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${m.sender_id === user?.id ? "self-end bg-[#2E8B72] text-white" : "self-start border border-[var(--message-line)] bg-[var(--message-panel)] text-[var(--message-text)] shadow-sm"}`}><p>{m.body}</p><time className={`mt-1 block text-[10px] ${m.sender_id === user?.id ? "text-white/75" : "text-[var(--message-muted)]"}`}>{messageTime(m.created_at)}</time></div>)}<div ref={bottomRef} /></div>
    <form onSubmit={handleSend} className="sticky bottom-0 mx-auto flex w-full max-w-4xl gap-2 border-t border-[var(--message-line)] bg-[var(--message-page)]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:gap-3 sm:px-6"><input className="min-w-0 flex-1 rounded-xl border border-[var(--message-line)] bg-[var(--message-panel)] px-4 py-3 text-sm text-[var(--message-text)] outline-none placeholder:text-[var(--message-muted)] focus:border-[#2e8b72] focus:ring-2 focus:ring-[#2e8b72]/20" placeholder="Type a message..." value={body} onChange={(e) => setBody(e.target.value)} /><button className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#d6ff57] px-4 text-[#11110f] hover:brightness-95 disabled:opacity-50" type="submit" disabled={sending}><Send className="w-4 h-4" /></button></form>
  </div>;
}
