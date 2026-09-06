import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { ChevronRight, Inbox, LayoutDashboard, Search } from "lucide-react";

interface Conversation { id: string; vendor_logo: string | null; counterpart_name: string; counterpart_type: "vendor" | "customer"; last_message: string | null; last_message_at: string | null; unread_count: number; }

function formatTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value); const hours = (Date.now() - date.getTime()) / 3_600_000;
  if (hours < 24) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (hours < 48) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function Messages() {
  const [conversations, setConversations] = useState<Conversation[] | undefined>(undefined);
  const [query, setQuery] = useState("");
  function load() { apiFetch("/messages/conversations/mine").then((data) => setConversations(data.conversations)).catch(() => setConversations([])); }
  useEffect(() => { load(); const timer = window.setInterval(load, 30_000); return () => window.clearInterval(timer); }, []);
  const visible = conversations?.filter((conversation) => `${conversation.counterpart_name} ${conversation.last_message || ""}`.toLowerCase().includes(query.toLowerCase())) || [];
  const unreadTotal = conversations?.reduce((total, conversation) => total + Number(conversation.unread_count || 0), 0) || 0;

  return <div className="min-h-screen bg-paper text-ink font-body">
    <nav className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4"><Link to="/" className="shrink-0"><img src="/logo.png" alt="BRIDGE" className="h-7" /></Link><div className="flex items-center gap-2"><Link to="/orders" className="hidden sm:inline text-sm text-ink/55 hover:text-ink px-3 py-2">My orders</Link><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium bg-ink text-paper px-3 sm:px-4 py-2 rounded-full hover:bg-ink/90"><LayoutDashboard className="w-4 h-4" />Dashboard</Link></div></div></nav>
    <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Inbox</p><h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">Messages.</h1><p className="text-ink/45 mt-3">Keep every conversation and protected deal in one place.</p></div>{unreadTotal > 0 && <div className="rounded-2xl bg-signal/10 px-4 py-3 text-sm"><strong>{unreadTotal}</strong> unread message{unreadTotal === 1 ? "" : "s"}</div>}</div>
      <div className="relative mb-5"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" className="w-full rounded-xl border border-ink/10 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-signal/60" /></div>
      {conversations === undefined ? <div className="py-20 text-center text-sm text-ink/40">Loading conversations…</div> : visible.length === 0 ? <div className="text-center py-20 bg-white border border-ink/10 rounded-2xl"><Inbox className="w-8 h-8 text-ink/20 mx-auto mb-4" strokeWidth={1.5} /><p className="font-medium">{query ? "No conversations found" : "No conversations yet"}</p><p className="text-sm text-ink/40 mt-2">{query ? "Try a different search." : "Start by messaging a store from the marketplace."}</p>{!query && <Link to="/explore" className="inline-block mt-5 text-sm font-medium text-signal">Explore stores</Link>}</div> : <section className="overflow-hidden bg-white rounded-2xl border border-ink/10 divide-y divide-ink/10">{visible.map((conversation) => <Link key={conversation.id} to={`/messages/${conversation.id}`} className={`group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-ink/[0.025] transition ${conversation.unread_count > 0 ? "bg-signal/[0.035]" : ""}`}><div className="relative shrink-0">{conversation.counterpart_type === "vendor" && conversation.vendor_logo ? <img src={conversation.vendor_logo} alt="" className="w-12 h-12 rounded-2xl object-cover" /> : <div className="w-12 h-12 rounded-2xl bg-ink/5 flex items-center justify-center font-display font-semibold text-ink/45">{conversation.counterpart_name.charAt(0)}</div>}{conversation.unread_count > 0 && <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-signal text-ink text-[10px] font-bold flex items-center justify-center">{conversation.unread_count > 99 ? "99+" : conversation.unread_count}</span>}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className={`truncate ${conversation.unread_count > 0 ? "font-semibold" : "font-medium"}`}>{conversation.counterpart_name}</p><time className={`shrink-0 text-xs ${conversation.unread_count > 0 ? "text-signal font-medium" : "text-ink/35"}`}>{formatTime(conversation.last_message_at)}</time></div><div className="flex items-center gap-2 mt-1"><span className="text-[10px] uppercase tracking-wider text-ink/35">{conversation.counterpart_type}</span><p className={`truncate text-sm ${conversation.unread_count > 0 ? "text-ink/70 font-medium" : "text-ink/40"}`}>{conversation.last_message || "No messages yet"}</p></div></div><ChevronRight className="w-5 h-5 text-ink/20 group-hover:text-signal shrink-0" /></Link>)}</section>}
    </main>
  </div>;
}
