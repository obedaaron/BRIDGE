import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { ArrowRight, ChevronRight, Inbox, MessageCircle, Search, Sparkles } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { BridgeLoader } from "../components/BridgeLoader";
import { useBridgeTheme } from "../lib/theme";

interface Conversation { id: string; vendor_logo: string | null; counterpart_name: string; counterpart_type: "vendor" | "customer"; last_message: string | null; last_message_at: string | null; unread_count: number; }

function formatTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value); const hours = (Date.now() - date.getTime()) / 3_600_000;
  if (hours < 24) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (hours < 48) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function Messages() {
  const { theme } = useBridgeTheme();
  const dark = theme === "dark";
  const [conversations, setConversations] = useState<Conversation[] | undefined>(undefined);
  const [query, setQuery] = useState("");
  function load() { apiFetch("/messages/conversations/mine").then((data) => setConversations(data.conversations)).catch(() => setConversations([])); }
  useEffect(() => { load(); const timer = window.setInterval(load, 30_000); return () => window.clearInterval(timer); }, []);
  const visible = conversations?.filter((conversation) => `${conversation.counterpart_name} ${conversation.last_message || ""}`.toLowerCase().includes(query.toLowerCase())) || [];
  const unreadTotal = conversations?.reduce((total, conversation) => total + Number(conversation.unread_count || 0), 0) || 0;
  const panel = dark ? "border-white/15 bg-[#171714]" : "border-[#171714]/15 bg-white";
  const line = dark ? "border-white/10 divide-white/10" : "border-[#171714]/10 divide-[#171714]/10";
  const muted = dark ? "text-white/65" : "text-[#171714]/65";
  const faint = dark ? "text-white/45" : "text-[#171714]/50";

  return <DashboardLayout><div className="mx-auto max-w-5xl py-2 sm:py-4">
    <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#2e8b72]"><MessageCircle className="h-3.5 w-3.5" /> Your inbox</p><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Messages<span className="text-[#2e8b72]">.</span></h1><p className={`mt-2 text-sm ${muted}`}>Talk with stores and keep your protected deals in one place.</p></div>
      {unreadTotal > 0 && <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm ${dark ? "border-[#d6ff57]/25 bg-[#d6ff57]/10" : "border-[#2e8b72]/20 bg-[#2e8b72]/8"}`}><span className="h-2 w-2 rounded-full bg-[#2e8b72]" /><strong>{unreadTotal}</strong><span className={muted}>unread {unreadTotal === 1 ? "message" : "messages"}</span></div>}
    </div>
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className={`relative block flex-1 rounded-2xl border ${panel}`}><Search className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${faint}`} /><input aria-label="Search conversations" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a store or message…" className={`w-full rounded-2xl bg-transparent py-3.5 pl-11 pr-4 text-sm outline-none placeholder:${dark ? "text-white/40" : "text-black/45"} focus:ring-2 focus:ring-[#2e8b72]/40`} /></label>
      <Link to="/explore" className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-semibold ${panel} hover:border-[#2e8b72]/50`}><Sparkles className="h-4 w-4 text-[#2e8b72]" /> Find a store</Link>
    </div>
    {conversations === undefined ? <div className={`rounded-2xl border p-5 ${panel}`}><BridgeLoader label="Loading conversations" /></div> : visible.length === 0 ? <div className={`rounded-2xl border px-6 py-14 text-center sm:py-16 ${panel}`}><div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${dark ? "bg-white/5" : "bg-[#171714]/5"}`}><Inbox className={`h-6 w-6 ${faint}`} strokeWidth={1.5} /></div><h2 className="mt-4 font-display text-xl font-semibold">{query ? "No conversations found" : "Your inbox is ready"}</h2><p className={`mx-auto mt-2 max-w-sm text-sm leading-6 ${muted}`}>{query ? "Try a different name or phrase." : "Message a storefront to ask a question or discuss a protected deal."}</p>{!query && <Link to="/explore" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d6ff57] px-5 py-3 text-sm font-semibold text-[#11110f]">Explore stores <ArrowRight className="h-4 w-4" /></Link>}</div> : <section aria-label="Conversations" className={`overflow-hidden rounded-2xl border ${panel} ${line} divide-y`}>{visible.map((conversation) => <Link key={conversation.id} to={`/messages/${conversation.id}`} className={`group flex items-center gap-3 p-4 transition sm:gap-4 sm:p-5 ${conversation.unread_count > 0 ? (dark ? "bg-[#d6ff57]/[.045]" : "bg-[#2e8b72]/[.045]") : ""} ${dark ? "hover:bg-white/[.04]" : "hover:bg-black/[.025]"}`}>
      <div className="relative shrink-0">{conversation.counterpart_type === "vendor" && conversation.vendor_logo ? <img src={conversation.vendor_logo} alt="" className="h-12 w-12 rounded-2xl border border-black/5 object-cover sm:h-14 sm:w-14" /> : <div className={`grid h-12 w-12 place-items-center rounded-2xl font-display text-lg font-semibold sm:h-14 sm:w-14 ${dark ? "bg-white/8 text-white/70" : "bg-[#171714]/5 text-[#171714]/65"}`}>{conversation.counterpart_name.charAt(0).toUpperCase()}</div>}{conversation.unread_count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#d6ff57] px-1 text-[10px] font-bold text-[#11110f]">{conversation.unread_count > 99 ? "99+" : conversation.unread_count}</span>}</div>
      <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className={`truncate ${conversation.unread_count > 0 ? "font-semibold" : "font-medium"}`}>{conversation.counterpart_name}</p><time className={`shrink-0 text-xs ${conversation.unread_count > 0 ? "font-medium text-[#2e8b72]" : faint}`}>{formatTime(conversation.last_message_at)}</time></div><div className="mt-1 flex items-center gap-2"><span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${dark ? "bg-white/7 text-white/50" : "bg-[#171714]/5 text-[#171714]/55"}`}>{conversation.counterpart_type === "vendor" ? "Store" : "Customer"}</span><p className={`truncate text-sm ${conversation.unread_count > 0 ? (dark ? "text-white/75" : "text-[#171714]/75") : muted}`}>{conversation.last_message || "Start a conversation"}</p></div></div><ChevronRight className={`h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 ${faint} group-hover:text-[#2e8b72]`} />
    </Link>)}</section>}
  </div></DashboardLayout>;
}
