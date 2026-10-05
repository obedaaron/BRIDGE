import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ChevronRight, CreditCard, LockKeyhole, Minus, Moon, Plus, ShoppingBag, ShoppingCart, Sun, Trash2, Truck, MapPin, Gift } from "lucide-react";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../lib/api";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useBridgeTheme } from "../lib/theme";

export function Cart() {
  const { items, total, setQuantity, remove, clear } = useCart();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useBridgeTheme();
  const dark = theme === "dark";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [delivery, setDelivery] = useState({ address: "", city: "", state: "" });
  const [buyer, setBuyer] = useState({ name: "", phone: "" });
  const [gift, setGift] = useState(false);
  const [recipient, setRecipient] = useState({ name: "", phone: "", message: "" });
  const [pricing, setPricing] = useState({ platformFeeBps: 700, processingFeeBps: 150, processingFeeFixedKobo: 10000, processingFeeCapKobo: 0 });
  const style = (dark
    ? { "--cart-page": "#11110f", "--cart-panel": "#171714", "--cart-panel-raised": "#1d1d19", "--cart-text": "#f1eee7", "--cart-muted": "rgba(241,238,231,.66)", "--cart-line": "rgba(241,238,231,.16)", "--cart-soft": "rgba(241,238,231,.06)" }
    : { "--cart-page": "#f6f2ea", "--cart-panel": "#fff", "--cart-panel-raised": "#fbf9f4", "--cart-text": "#171714", "--cart-muted": "rgba(23,23,20,.68)", "--cart-line": "rgba(23,23,20,.14)", "--cart-soft": "rgba(23,23,20,.045)" }) as CSSProperties;

  useEffect(() => { apiFetch("/orders/pricing-policy").then(setPricing).catch(() => undefined); }, []);
  const deliveryFee = 1500;
  const quote = useMemo(() => {
    const sellerAmount = total + deliveryFee;
    const platformFee = Math.round(sellerAmount * pricing.platformFeeBps / 10_000);
    const protectedAmount = sellerAmount + platformFee;
    return { sellerAmount, platformFee, buyerTotal: protectedAmount };
  }, [pricing, total, deliveryFee]);

  async function checkout() {
    setError("");
    if (!buyer.name.trim() || !buyer.phone.trim()) { setError("Add your name and phone number so the store can confirm delivery."); return; }
    if (!delivery.address.trim() || !delivery.city.trim() || !delivery.state.trim()) { setError("Complete your delivery address, city and state to continue."); return; }
    if (gift && (!recipient.name.trim() || !recipient.phone.trim())) { setError("Add the recipient name and phone number for this gift."); return; }
    if (!window.confirm("Confirm this delivery order? You will pay from My Orders after the store confirms it.")) return;
    setLoading(true);
    try {
      await apiFetch("/orders/catalog-checkout", { method: "POST", body: JSON.stringify({ items: items.map((item) => ({ listingId: item.listingId, quantity: item.quantity })), fulfilmentMethod: "local_delivery", buyerContactName: buyer.name, buyerContactPhone: buyer.phone, deliveryAddress: delivery.address, deliveryCity: delivery.city, deliveryState: delivery.state, isGift: gift, giftRecipientName: recipient.name, giftRecipientPhone: recipient.phone, giftMessage: recipient.message }) });
      clear();
      navigate("/orders?new=1");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  const inputClass = "input-field w-full";
  const panelClass = "rounded-2xl border border-[var(--cart-line)] bg-[var(--cart-panel)]";
  return <div style={style} data-cart-theme={theme} className={`cart-theme min-h-screen bg-[var(--cart-page)] text-[var(--cart-text)] font-body transition-colors duration-300 ${dark ? "cart-theme-dark" : "cart-theme-light"}`}>
    <style>{`
      .cart-theme .input-field{border:1px solid var(--cart-line);border-radius:12px;padding:13px 15px;background:var(--cart-panel-raised);color:var(--cart-text);min-height:48px}
      .cart-theme .input-field::placeholder{color:var(--cart-muted)}
      .cart-theme .input-field:focus{outline:2px solid #2e8b72;outline-offset:1px}
    `}</style>
    <header className="sticky top-0 z-30 border-b border-[var(--cart-line)] bg-[var(--cart-page)]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/explore" aria-label="Back to Explore" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--cart-line)] text-[var(--cart-muted)] transition hover:bg-[var(--cart-soft)] hover:text-[var(--cart-text)]"><ArrowLeft className="h-4 w-4" /></Link>
        <Link to="/explore" className="font-display text-lg font-bold tracking-tight">BRIDGE</Link>
        <nav aria-label="Main navigation" className="ml-5 hidden items-center gap-6 text-sm font-medium text-[var(--cart-muted)] md:flex">
          <Link to="/explore" className="hover:text-[var(--cart-text)]">Explore stores</Link>
          <Link to="/orders" className="hover:text-[var(--cart-text)]">My orders</Link>
          <Link to="/messages" className="hover:text-[var(--cart-text)]">Messages</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/explore" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#2e8b72] hover:bg-[var(--cart-soft)] sm:inline-flex">Continue shopping</Link>
          <button onClick={toggleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} mode`} className="grid h-10 w-10 place-items-center rounded-full border border-[var(--cart-line)] text-[#2e8b72] hover:bg-[var(--cart-soft)]">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <Link to="/cart" aria-label={`Cart, ${items.length} items`} className="relative grid h-10 w-10 place-items-center rounded-full bg-[#d6ff57] text-[#11110f]"><ShoppingCart className="h-4 w-4" />{items.length > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#171714] px-1 text-[10px] font-bold text-white">{items.length}</span>}</Link>
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-7 flex flex-wrap items-center gap-2 text-sm text-[var(--cart-muted)]">
        <Link to="/explore" className="hover:text-[var(--cart-text)]">Explore</Link><ChevronRight className="h-3.5 w-3.5" /><span className="font-medium text-[var(--cart-text)]">Your cart</span>
      </div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#2e8b72]"><ShoppingBag className="h-3.5 w-3.5" /> Protected checkout</p><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your cart<span className="text-[#2e8b72]">.</span></h1><p className="mt-2 text-sm text-[var(--cart-muted)]">{items.length ? `${items.reduce((sum, item) => sum + item.quantity, 0)} items from ${items[0].vendorName}` : "Your next great local find is only a few clicks away."}</p></div>
        {items.length > 0 && <button onClick={clear} className="rounded-full border border-[var(--cart-line)] px-4 py-2 text-sm font-medium text-[var(--cart-muted)] transition hover:border-red-400/50 hover:text-red-500">Clear cart</button>}
      </div>

      {items.length === 0 ? <section className={`${panelClass} mx-auto max-w-2xl px-6 py-14 text-center sm:py-20`}>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#d6ff57]/30 text-[#2e8b72]"><ShoppingCart className="h-7 w-7" /></div>
        <h2 className="mt-5 font-display text-2xl font-semibold">Your cart is waiting.</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--cart-muted)]">Browse trusted local storefronts and add something you love. Your items will be saved here.</p>
        <Link to="/explore" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#d6ff57] px-6 py-3 font-semibold text-[#11110f] transition hover:brightness-95">Explore stores <ArrowRight className="h-4 w-4" /></Link>
      </section> : <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="space-y-5">
          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-[var(--cart-line)] px-4 py-4 sm:px-6"><div><h2 className="font-display text-lg font-semibold">Items</h2><p className="mt-0.5 text-xs text-[var(--cart-muted)]">From <span className="font-semibold text-[var(--cart-text)]">{items[0].vendorName}</span></p></div><span className="rounded-full bg-[var(--cart-soft)] px-3 py-1 text-xs font-semibold">{items.length} {items.length === 1 ? "product" : "products"}</span></div>
            <div className="divide-y divide-[var(--cart-line)]">
              {items.map((item) => <article key={item.listingId} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-20 w-20 shrink-0 rounded-xl bg-[var(--cart-soft)] object-cover sm:h-24 sm:w-24" /> : <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-[var(--cart-soft)] text-[#2e8b72] sm:h-24 sm:w-24"><ShoppingBag className="h-6 w-6" /></div>}
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0"><h3 className="truncate font-semibold">{item.title}</h3><p className="mt-1 truncate text-sm text-[var(--cart-muted)]">{item.vendorName}</p><p className="mt-2 font-mono text-sm font-semibold">{item.currency === "NGN" ? "₦" : ""}{item.price.toLocaleString()}</p></div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="inline-flex items-center rounded-full border border-[var(--cart-line)] bg-[var(--cart-panel-raised)] p-1"><button onClick={() => setQuantity(item.listingId, item.quantity - 1)} aria-label={`Decrease ${item.title} quantity`} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--cart-soft)]"><Minus className="h-3.5 w-3.5" /></button><span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span><button onClick={() => setQuantity(item.listingId, item.quantity + 1)} aria-label={`Increase ${item.title} quantity`} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--cart-soft)]"><Plus className="h-3.5 w-3.5" /></button></div>
                    <strong className="w-24 text-right text-sm font-semibold tabular-nums">₦{(item.price * item.quantity).toLocaleString()}</strong>
                    <button onClick={() => remove(item.listingId)} aria-label={`Remove ${item.title}`} className="grid h-9 w-9 place-items-center rounded-full text-[var(--cart-muted)] transition hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>)}
            </div>
          </section>

          <section className={"p-4 sm:p-6 " + panelClass}>
            <div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d6ff57]/30 text-[#2e8b72]"><Truck className="h-5 w-5" /></div><div><h2 className="font-display text-lg font-semibold">Delivery details</h2><p className="mt-1 text-sm leading-5 text-[var(--cart-muted)]">Tell the store who to deliver to and how to reach you.</p></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-medium">Your name</span><input value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} placeholder="Full name" className={inputClass} autoComplete="name" /></label>
              <label><span className="mb-2 block text-sm font-medium">Phone number</span><input value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} placeholder="Number for delivery updates" className={inputClass} autoComplete="tel" /></label>
              <label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium">Delivery address</span><div className="relative"><MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cart-muted)]" /><input value={delivery.address} onChange={(e) => setDelivery({ ...delivery, address: e.target.value })} placeholder="Street, building or landmark" className={inputClass + " pl-10"} autoComplete="street-address" /></div></label>
              <label><span className="mb-2 block text-sm font-medium">City</span><input value={delivery.city} onChange={(e) => setDelivery({ ...delivery, city: e.target.value })} placeholder="Your city" className={inputClass} /></label>
              <label><span className="mb-2 block text-sm font-medium">State</span><input value={delivery.state} onChange={(e) => setDelivery({ ...delivery, state: e.target.value })} placeholder="Your state" className={inputClass} /></label>
            </div>
            <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--cart-line)] bg-[var(--cart-soft)] p-4"><input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} className="h-4 w-4 accent-[#2e8b72]" /><Gift className="h-5 w-5 text-[#2e8b72]" /><span className="text-sm font-semibold">This order is a gift</span></label>
            {gift && <div className="mt-3 grid gap-3 rounded-xl border border-[var(--cart-line)] p-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-medium">Recipient name</span><input value={recipient.name} onChange={(e) => setRecipient({ ...recipient, name: e.target.value })} placeholder="Who is receiving it?" className={inputClass} /></label><label><span className="mb-2 block text-sm font-medium">Recipient phone</span><input value={recipient.phone} onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })} placeholder="Recipient phone" className={inputClass} /></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium">Gift message (optional)</span><textarea value={recipient.message} onChange={(e) => setRecipient({ ...recipient, message: e.target.value })} placeholder="Add a short note" className={inputClass + " min-h-20"} maxLength={300} /></label></div>}
          </section>          <div className="flex items-start gap-2.5 rounded-xl border border-[var(--cart-line)] bg-[var(--cart-soft)] p-4 text-xs leading-5 text-[var(--cart-muted)]"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#2e8b72]" /><p>Your payment is protected by BRIDGE. Fees and delivery are shown before you pay.</p></div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <section className={`${panelClass} p-5 sm:p-6`}>
            <h2 className="font-display text-xl font-semibold">Order summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><span className="text-[var(--cart-muted)]">Items subtotal</span><span className="font-medium tabular-nums">₦{total.toLocaleString()}</span></div>
              <div className="flex justify-between gap-3"><span className="text-[var(--cart-muted)]">Delivery</span><span className="tabular-nums">₦1,500</span></div>
              <div className="border-t border-[var(--cart-line)] pt-4"><div className="flex items-end justify-between gap-3"><span className="font-semibold">Total</span><span className="font-mono text-xl font-bold tabular-nums">₦{quote.buyerTotal.toLocaleString()}</span></div><p className="mt-1 text-right text-xs text-[var(--cart-muted)]">Delivery and service included</p></div>
            </div>
            {error && <p role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-600">{error}</p>}
            <button onClick={checkout} disabled={loading || items.length === 0} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d6ff57] px-5 py-3.5 font-semibold text-[#11110f] transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60">{loading ? "Preparing your order…" : <><CreditCard className="h-4 w-4" /> Place delivery order <ArrowRight className="h-4 w-4" /></>}</button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-[var(--cart-muted)]"><Check className="h-3.5 w-3.5 text-[#2e8b72]" /> You’ll review the order with the store next</p>
          </section>
          <Link to="/explore" className="mt-4 inline-flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-[#2e8b72] hover:underline">Continue exploring stores <ArrowRight className="h-4 w-4" /></Link>
        </aside>
      </div>}
    </main>
  </div>;
}
