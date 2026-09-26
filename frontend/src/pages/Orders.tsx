import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, ClipboardList, MessageCircle, Moon, ShoppingBag, Sun } from "lucide-react";
import { OrderCards } from "../components/OrderCards";
import type { MarketplaceOrder } from "../components/OrderCards";
import { apiFetch } from "../lib/api";
import { BridgeLoader } from "../components/BridgeLoader";
import { useBridgeTheme } from "../lib/theme";

export function Orders() {
  const { theme, toggleTheme } = useBridgeTheme();
  const dark = theme === "dark";
  const themeStyle = (dark
    ? { "--orders-page": "#11110f", "--orders-panel": "#171714", "--orders-text": "#f1eee7", "--orders-muted": "rgba(241,238,231,.68)", "--orders-line": "rgba(241,238,231,.16)", "--color-ink": "#f1eee7", "--color-paper": "#171714" }
    : { "--orders-page": "#f6f2ea", "--orders-panel": "#ffffff", "--orders-text": "#171714", "--orders-muted": "rgba(23,23,20,.68)", "--orders-line": "rgba(23,23,20,.15)", "--color-ink": "#1a1a17", "--color-paper": "#fbf7f1" }) as CSSProperties;
  const [orders, setOrders] = useState<MarketplaceOrder[] | undefined>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();
  const [paidOrderId, setPaidOrderId] = useState("");
  const [contact, setContact] = useState({ name: "", phone: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = () => apiFetch("/orders/mine").then((data) => setOrders(data.orders)).catch((err) => { setOrders([]); setError(err.message); });

  useEffect(() => {
    load();
    const reference = searchParams.get("reference");
    if (reference) apiFetch(`/payments/paystack/verify/${reference}`).then((data) => { if (data.order?.id) setPaidOrderId(data.order.id); setSearchParams({}); load(); }).catch((err) => setError(err.message));
  }, []);

  async function submitContact(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try { await apiFetch(`/orders/${paidOrderId}/contact`, { method: "POST", body: JSON.stringify(contact) }); setPaidOrderId(""); load(); }
    catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  return <div style={themeStyle} className={`min-h-screen bg-[var(--orders-page)] text-[var(--orders-text)] font-body transition-colors duration-300 ${dark ? "orders-theme-dark" : "orders-theme-light"}`}>
    <style>{`.orders-theme-dark .input-field{background:#1b1b18;border-color:rgba(255,255,255,.24);color:#f1eee7}.orders-theme-dark .input-field::placeholder{color:rgba(255,255,255,.55)}.orders-theme-light .input-field{background:#fff;border-color:rgba(17,17,15,.22);color:#11110f}.orders-theme-light .input-field::placeholder{color:rgba(17,17,15,.55)}`}</style>
    <header className="sticky top-0 z-30 border-b border-[var(--orders-line)] bg-[var(--orders-page)]/95 backdrop-blur-xl">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/explore" aria-label="Back to Explore" className="grid h-10 w-10 place-items-center rounded-full border border-[var(--orders-line)] text-[var(--orders-muted)] hover:bg-black/5"><ArrowLeft className="h-4 w-4" /></Link>
        <Link to="/explore" className="font-display text-lg font-bold">BRIDGE</Link>
        <div className="ml-4 hidden items-center gap-1 sm:flex">
          <Link to="/explore" className="rounded-full px-4 py-2 text-sm font-medium text-[var(--orders-muted)] hover:bg-black/5 hover:text-[var(--orders-text)]">Explore</Link>
          <Link to="/orders" aria-current="page" className="rounded-full bg-[#d6ff57] px-4 py-2 text-sm font-semibold text-[#11110f]">My orders</Link>
          <Link to="/messages" className="rounded-full px-4 py-2 text-sm font-medium text-[var(--orders-muted)] hover:bg-black/5 hover:text-[var(--orders-text)]">Messages</Link>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:hidden"><Link to="/messages" aria-label="Messages" className="grid h-10 w-10 place-items-center rounded-full border border-[var(--orders-line)]"><MessageCircle className="h-4 w-4" /></Link><Link to="/explore" aria-label="Explore stores" className="grid h-10 w-10 place-items-center rounded-full border border-[var(--orders-line)]"><ShoppingBag className="h-4 w-4" /></Link></div>
        <button onClick={toggleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} theme`} className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-[var(--orders-line)] text-[#2e8b72] hover:bg-black/5 sm:ml-4">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
      </nav>
    </header>
    <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-[var(--orders-muted)]"><Link to="/explore" className="hover:text-[var(--orders-text)]">Explore</Link><ChevronRight className="h-3.5 w-3.5" /><span className="font-medium text-[var(--orders-text)]">My orders</span></div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#2e8b72]"><ClipboardList className="h-3.5 w-3.5" /> Your activity</p><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">My orders<span className="text-[#2e8b72]">.</span></h1><p className="mt-2 text-sm text-[var(--orders-muted)]">Track protected deals and continue the conversation with a store.</p></div>
        {orders && orders.length > 0 && <span className="rounded-full border border-[var(--orders-line)] bg-[var(--orders-panel)] px-4 py-2 text-sm font-medium">{orders.length} {orders.length === 1 ? "order" : "orders"}</span>}
      </div>
      {paidOrderId && <form onSubmit={submitContact} className="mb-6 rounded-2xl border border-[#2E8B72]/40 bg-[var(--orders-panel)] p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-xl font-semibold">Payment confirmed — delivery contact</h2>
        <p className="mt-1 text-sm text-[var(--orders-muted)]">Share the recipient details so the vendor can fulfil your paid order.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><input required className="input-field" placeholder="Recipient name" value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} /><input required className="input-field" inputMode="tel" placeholder="Phone number" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} /></div>
        <button disabled={saving} className="btn-primary mt-4 px-5 py-3 disabled:opacity-50">{saving ? "Saving…" : "Share delivery contact"}</button>
      </form>}
      {error && <p role="alert" className={`mb-5 rounded-xl border p-3 text-sm ${dark ? "border-[#ff9b83]/35 bg-[#C94F36]/15 text-[#ffb19e]" : "border-[#C94F36]/25 bg-[#C94F36]/8 text-[#9f3826]"}`}>{error}</p>}
      {orders === undefined ? <BridgeLoader label="Loading your orders" /> : orders.length === 0 ? <section className="rounded-2xl border border-[var(--orders-line)] bg-[var(--orders-panel)] px-6 py-14 text-center sm:py-16"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#d6ff57]/30 text-[#2e8b72]"><ClipboardList className="h-6 w-6" /></div><h2 className="mt-4 font-display text-xl font-semibold">Your order history starts here.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--orders-muted)]">When you accept a deal or check out from a store, you’ll find its progress here.</p><Link to="/explore" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d6ff57] px-5 py-3 text-sm font-semibold text-[#11110f]">Explore stores <ShoppingBag className="h-4 w-4" /></Link></section> : <OrderCards orders={orders} vendorView={false} dark={dark} />}
    </main>
  </div>;
}
