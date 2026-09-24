import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { OrderCards } from "../components/OrderCards";
import type { MarketplaceOrder } from "../components/OrderCards";
import { apiFetch } from "../lib/api";
import { BridgeLoader } from "../components/BridgeLoader";
import { useBridgeTheme } from "../lib/theme";

export function Orders() {
  const { theme, toggleTheme } = useBridgeTheme();
  const dark = theme === "dark";
  const themeStyle = (dark
    ? { "--orders-page": "#11110f", "--orders-panel": "#171714", "--orders-text": "#f1eee7", "--orders-muted": "rgba(255,255,255,.66)", "--orders-line": "rgba(255,255,255,.18)", "--color-ink": "#f1eee7", "--color-paper": "#171714" }
    : { "--orders-page": "#f6f2ea", "--orders-panel": "#ffffff", "--orders-text": "#11110f", "--orders-muted": "rgba(17,17,15,.68)", "--orders-line": "rgba(17,17,15,.18)", "--color-ink": "#1a1a17", "--color-paper": "#fbf7f1" }) as CSSProperties;
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
    <nav className="mx-auto flex max-w-4xl items-center gap-4 border-b border-[var(--orders-line)] px-6 py-5 md:px-12">
      <Link to="/messages" aria-label="Back to messages" className="text-[var(--orders-muted)] hover:text-[var(--orders-text)]"><ArrowLeft className="h-5 w-5" /></Link>
      <Link to="/" className="font-display font-semibold">BRIDGE</Link>
      <button onClick={toggleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} theme`} className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-[var(--orders-line)] text-[#d6ff57] hover:bg-white/10">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
    </nav>
    <main className="mx-auto max-w-4xl px-6 py-10 md:px-12">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#2E8B72]">Transactions</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">My orders.</h1>
      {paidOrderId && <form onSubmit={submitContact} className="mt-6 rounded-2xl border border-[#2E8B72]/45 bg-[var(--orders-panel)] p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">Payment confirmed — delivery contact</h2>
        <p className="mt-1 text-sm text-[var(--orders-muted)]">Share this only now, so the vendor can fulfil your paid order.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><input required className="input-field" placeholder="Recipient name" value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} /><input required className="input-field" inputMode="tel" placeholder="Phone number" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} /></div>
        <button disabled={saving} className="btn-primary mt-4 px-5 py-3 disabled:opacity-50">{saving ? "Saving…" : "Share delivery contact"}</button>
      </form>}
      {error && <p role="alert" className={`mt-4 rounded-xl border p-3 text-sm ${dark ? "border-[#ff9b83]/35 bg-[#C94F36]/15 text-[#ffb19e]" : "border-[#C94F36]/25 bg-[#C94F36]/8 text-[#9f3826]"}`}>{error}</p>}
      <p className="mb-8 mt-3 text-sm text-[var(--orders-muted)]">Your BRIDGE deal history and protected checkout status.</p>
      {orders === undefined ? <BridgeLoader label="Loading your orders" /> : <OrderCards orders={orders} vendorView={false} dark={dark} />}
    </main>
  </div>;
}
