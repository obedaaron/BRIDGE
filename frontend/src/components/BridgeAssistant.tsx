import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Bot, CheckCircle2, ChevronRight, CircleHelp, ExternalLink, Send, Sparkles, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type Action = { label: string; kind: "go" | "publish" | "delivery" | "support"; target?: string; fee?: number };
type Message = { from: "bot" | "user"; text: string; action?: Action; done?: boolean };
const clean = (v: string) => v.toLowerCase().replace(/[^a-z0-9₦ ]/g, " ").replace(/\s+/g, " ").trim();

function respond(input: string, vendor: boolean): { text: string; action?: Action } {
  const q = clean(input);
  const match = q.match(/(?:delivery fee|delivery).{0,20}?(\d[\d,]*)/);
  if (vendor && match) {
    const fee = Number(match[1].replace(/,/g, ""));
    return { text: "I found a request to set your out of city delivery fee to ₦" + fee.toLocaleString() + ". Confirm to apply it.", action: { label: "Confirm delivery fee", kind: "delivery", fee } };
  }
  if (vendor && q.includes("publish")) return { text: "Publishing makes your store visible to customers. Confirm when ready.", action: { label: "Publish my store", kind: "publish" } };
  if (q.includes("analytic") || q.includes("performance") || q.includes("sales report")) return { text: "I can open your analytics for views, orders, revenue and conversion.", action: { label: "Open analytics", kind: "go", target: "/dashboard/analytics" } };
  if (q.includes("add product") || q.includes("new product") || q.includes("add listing")) return { text: "Open Listings to add a product or service, price, image and availability.", action: { label: "Add a listing", kind: "go", target: "/dashboard/listings" } };
  if (q.includes("gallery") || q.includes("cover") || q.includes("edit store") || q.includes("store setting")) return { text: "Store Settings lets you update delivery, gallery, cover, colour and store details.", action: { label: "Open store settings", kind: "go", target: "/dashboard/settings" } };
  if (q.includes("verification") || q.includes("kyc")) return { text: "Verification shows the requirements that protect customers and let you publish.", action: { label: "Open verification", kind: "go", target: "/dashboard/verification" } };
  if (q.includes("wallet") || q.includes("payout") || q.includes("earning")) return { text: "Your wallet contains earnings, withdrawals and payout activity.", action: { label: "Open wallet", kind: "go", target: "/dashboard/wallet" } };
  if (q.includes("plan") || q.includes("upgrade") || q.includes("subscription")) return { text: "Plans control listings and advanced storefront features.", action: { label: "View plans", kind: "go", target: "/dashboard/plans" } };
  if (q.includes("order") || q.includes("delivery")) return { text: vendor ? "Order tools help you fulfil protected orders and update customers." : "Your orders page shows protected checkout status and next steps.", action: { label: "Open orders", kind: "go", target: vendor ? "/dashboard/orders" : "/orders" } };
  if (q.includes("message") || q.includes("contact vendor")) return { text: "Messages are the safest way to discuss a BRIDGE order or store.", action: { label: "Open messages", kind: "go", target: "/messages" } };
  if (q.includes("cart") || q.includes("checkout")) return { text: "Your cart shows seller price, delivery and all buyer fees before payment.", action: { label: "Open cart", kind: "go", target: "/cart" } };
  if (q.includes("find") || q.includes("search") || q.includes("recommend")) {
    const term = input.replace(/^(find|search for|recommend|show me)\s+/i, "").trim();
    return { text: "I can take you to Explore. Search by store, category or city to find a good match.", action: { label: "Search Explore", kind: "go", target: "/explore" + (term ? "?q=" + encodeURIComponent(term) : "") } };
  }
  if (q.includes("support") || q.includes("help") || q.includes("problem")) return { text: "For account-specific help, contact the BRIDGE support team.", action: { label: "Contact support", kind: "support" } };
  return { text: vendor ? "I can help with listings, store settings, analytics, orders, delivery fees, publishing, plans or your wallet." : "I can help you find local businesses, check orders, open your cart, message a seller or contact support." };
}

function tip(path: string, vendor: boolean) {
  if (vendor) return path.includes("listings") ? "Clear photos and up-to-date prices help customers choose with confidence." : path.includes("orders") ? "Keep order updates in BRIDGE Messages so both sides can find the details later." : "A complete storefront with clear delivery details is easier for customers to trust.";
  return path.includes("cart") ? "Check delivery details and the full total before you continue to checkout." : path.includes("orders") ? "Your Orders page keeps payment and delivery updates together." : "Search by business name, category and city to find the right local store.";
}
function prompts(path: string, vendor: boolean) {
  if (vendor) return path.includes("orders") ? ["View my orders", "Open messages", "Show analytics"] : ["Add a listing", "Show analytics", "Edit my store"];
  return path.includes("cart") ? ["Open my cart", "Find a local store", "Track an order"] : path.includes("orders") ? ["Track an order", "Open my messages", "Find a local store"] : ["Find a local store", "Track an order", "Contact support"];
}

export function BridgeAssistant() {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const vendor = user?.role === "vendor";
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const chips = prompts(location.pathname, vendor);
  useEffect(() => {
    if (open || window.sessionStorage.getItem("bridge-assistant-hint-seen")) return;
    const show = window.setTimeout(() => { window.sessionStorage.setItem("bridge-assistant-hint-seen", "true"); setNudge(true); }, 5000);
    const hide = window.setTimeout(() => setNudge(false), 13500);
    return () => { window.clearTimeout(show); window.clearTimeout(hide); };
  }, [open]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sendPrompt = (prompt: string) => {
    const text = prompt.trim();
    if (!text) return;
    setMessages((list) => [...list, { from: "user", text }, { from: "bot", ...respond(text, vendor) }]);
    setValue("");
  };
  const run = async (index: number, action: Action) => {
    if (action.kind === "go" && action.target) { nav(action.target); setOpen(false); return; }
    if (action.kind === "support") { window.location.href = "mailto:bridgeverything@gmail.com?subject=BRIDGE%20Support"; return; }
    setBusy(true);
    try {
      if (action.kind === "publish") await apiFetch("/vendors/me/publish", { method: "PATCH" });
      if (action.kind === "delivery") await apiFetch("/vendors/me/delivery", { method: "PATCH", body: JSON.stringify({ outOfCityDeliveryFeeNaira: action.fee }) });
      setMessages((list) => list.map((m, i) => i === index ? { ...m, done: true, text: action.kind === "publish" ? "Your store publish status was updated successfully." : "Your out of city delivery fee was updated successfully." } : m));
    } catch (e: unknown) {
      const reason = e instanceof Error ? e.message : "Try Store Settings.";
      setMessages((list) => list.map((m, i) => i === index ? { ...m, done: true, text: "I could not complete that change. " + reason } : m));
    } finally { setBusy(false); }
  };
  const dismissHint = () => { window.sessionStorage.setItem("bridge-assistant-hint-seen", "true"); setNudge(false); };

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-[70] flex max-w-[calc(100vw-1.5rem)] flex-col items-end font-body sm:bottom-5 sm:right-5">
      {open && <section id="bridge-assistant-panel" role="dialog" aria-modal="false" aria-labelledby="bridge-assistant-title" className="mb-3 flex w-[calc(100vw-1.5rem)] max-w-[24rem] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#141512] text-[#f1eee7] shadow-[0_24px_80px_rgba(0,0,0,.45)] ring-1 ring-black/10" style={{ maxHeight: "min(38rem, calc(100dvh - 8.5rem))" }}>
        <header className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(ellipse_at_top_right,rgba(214,255,87,.18),transparent_55%),linear-gradient(135deg,#20231b,#171814)] px-5 pb-4 pt-5">
          <div className="absolute -right-5 -top-9 h-28 w-28 rounded-full bg-[#d6ff57]/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#d6ff57]/35 bg-[#d6ff57]/10 text-[#d6ff57]"><Bot className="h-6 w-6" /><Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5" /></span>
              <div><p id="bridge-assistant-title" className="flex items-center gap-2 font-semibold">BRIDGE assistant</p><p className="mt-0.5 text-xs text-white/55">Quick help for your next step</p></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close BRIDGE assistant" className="grid h-9 w-9 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6ff57]"><X className="h-4 w-4" /></button>
          </div>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 sm:p-5" role="log" aria-live="polite" aria-relevant="additions text">
          {messages.length === 0 ? <div className="space-y-4">
            <div><p className="text-lg font-semibold leading-snug">{vendor ? "Hi" + (user?.email ? ", " + user.email.split("@")[0] : "") + " — ready to grow your store?" : "Hi" + (user?.email ? ", " + user.email.split("@")[0] : "") + " — what are you looking for?"}</p><p className="mt-1.5 text-sm leading-relaxed text-white/60">{vendor ? "I can help manage listings, orders and store details." : "I can help you discover local businesses and find your way around BRIDGE."}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3.5"><p className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#d6ff57]"><Sparkles className="h-3.5 w-3.5" />A quick tip</p><p className="text-xs leading-relaxed text-white/65">{tip(location.pathname, vendor)}</p></div>
            <div><p className="mb-2 text-xs font-medium text-white/45">Try one of these</p><div className="flex flex-wrap gap-2">{chips.map((s) => <button key={s} type="button" onClick={() => sendPrompt(s)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/12 bg-white/[.04] px-3 py-2 text-left text-xs font-medium text-white/80 transition hover:border-[#d6ff57]/45 hover:bg-[#d6ff57]/10 hover:text-[#e4ff9b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6ff57]">{s}<ArrowUpRight className="h-3 w-3" /></button>)}</div></div>
          </div> : messages.map((m, i) => <div key={i} className={m.from === "user" ? "ml-auto max-w-[88%]" : "max-w-[92%]"}><p className={"rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed " + (m.from === "user" ? "rounded-br-md bg-[#d6ff57] text-[#11110f]" : "rounded-bl-md border border-white/[.06] bg-white/[.07] text-white/90")}>{m.text}</p>{m.action && !m.done && <button type="button" disabled={busy} onClick={() => run(i, m.action!)} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d6ff57]/35 bg-[#d6ff57]/[.07] px-3 py-2 text-xs font-semibold text-[#d6ff57] hover:bg-[#d6ff57]/15 disabled:opacity-50">{m.action.kind === "publish" ? <CheckCircle2 className="h-3.5 w-3.5" /> : m.action.kind === "go" ? <ChevronRight className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}{busy ? "Working..." : m.action.label}</button>}</div>)}
          <div ref={endRef} />
        </div>
        <footer className="border-t border-white/10 bg-[#171814] p-3 sm:p-4">
          <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{chips.map((s) => <button key={s} type="button" onClick={() => sendPrompt(s)} className="min-h-9 shrink-0 rounded-full border border-white/12 px-3 py-1.5 text-xs text-white/65 hover:border-[#d6ff57]/40 hover:text-[#e4ff9b]">{s}</button>)}</div>
          <form className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.06] p-1.5 focus-within:border-[#d6ff57]/50 focus-within:ring-2 focus-within:ring-[#d6ff57]/10" onSubmit={(e) => { e.preventDefault(); sendPrompt(value); }}>
            <label className="sr-only" htmlFor="bridge-assistant-input">Ask BRIDGE for help</label><input id="bridge-assistant-input" value={value} onChange={(e) => setValue(e.target.value)} placeholder={vendor ? "Ask about your store..." : "Find a store or get help..."} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/40" />
            <button type="submit" disabled={!value.trim()} aria-label="Send message" className="grid h-10 w-10 place-items-center rounded-xl bg-[#d6ff57] text-[#11110f] hover:bg-[#e2ff8a] disabled:opacity-40"><Send className="h-4 w-4" /></button>
          </form>
          <div className="mt-2 flex items-center justify-between gap-2 px-1"><span className="text-[10px] text-white/35">BRIDGE shortcuts · review before changes</span><button type="button" onClick={() => setMessages([])} className="inline-flex items-center gap-1 text-[10px] text-white/45 hover:text-white/75"><CircleHelp className="h-3 w-3" />Reset</button></div>
        </footer>
      </section>}

      {!open && nudge && <div className="mb-3 flex max-w-[min(19rem,calc(100vw-2rem))] items-start gap-2 rounded-2xl border border-white/10 bg-[#171814] px-3.5 py-3 text-white shadow-xl ring-1 ring-black/20">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#d6ff57]/12 text-[#d6ff57]"><Sparkles className="h-4 w-4" /></span>
        <button type="button" onClick={() => { setOpen(true); dismissHint(); }} className="min-w-0 flex-1 text-left text-xs leading-relaxed text-white/80">Need a hand? I can suggest your next step.</button>
        <button type="button" onClick={dismissHint} aria-label="Dismiss assistant greeting" className="grid h-7 w-7 place-items-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" /></button>
      </div>}

      <button type="button" onClick={() => { setOpen((v) => !v); setNudge(false); }} aria-label={open ? "Close BRIDGE assistant" : "Open BRIDGE assistant"} aria-expanded={open} className="group relative grid h-14 w-14 place-items-center rounded-[1.35rem] border border-[#e9ff9f]/50 bg-[#d6ff57] text-[#11110f] shadow-[0_10px_35px_rgba(0,0,0,.28),0_0_30px_rgba(214,255,87,.18)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_42px_rgba(0,0,0,.32),0_0_38px_rgba(214,255,87,.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4">
        {open ? <X className="h-6 w-6" /> : <span className="relative grid place-items-center"><Bot className="h-6 w-6" /><Sparkles className="absolute -right-2 -top-2 h-3.5 w-3.5" /></span>}
      </button>
    </div>
  );
}
