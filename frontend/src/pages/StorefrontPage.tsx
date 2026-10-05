import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ReviewsSection } from "../components/ReviewsSection";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Headphones, Home, MapPin, MessageCircle, Minus, Moon, Package, Plus, Search, ShieldCheck, ShoppingCart, Star, Sun, X } from "lucide-react";
import { useBridgeTheme } from "../lib/theme";
import { BridgeLoader } from "../components/BridgeLoader";

type Item = { id: string; title: string; description: string | null; type: string; price: number | null; currency: string; image_url: string | null; stock_quantity: number };
type GalleryImage = { id: string; image_url: string; position: number };
type Vendor = {
  id: string; user_id: string; business_name: string; slug: string; description: string | null;
  city: string | null; state: string | null; logo_url: string | null; cover_image_url: string | null;
  verification_status: string; avg_rating: number | null; review_count: number; completed_transactions: number;
  reliability_score: number; storefront_cover_url: string | null; storefront_accent_color: string | null;
  category_name: string | null; category_slug: string | null;
};
type Toast = { id: string; key: string; title: string; imageUrl: string | null };
/* What the person added during this visit. Drives the order panel; the real cart still lives in CartContext. */
type VisitLine = { listingId: string; title: string; price: number; currency: string; imageUrl: string | null; qty: number };

const money = (amount: number | null, currency: string) => amount === null
  ? "Contact for price"
  : new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

const typeLabel = (type: string) => type ? type.charAt(0).toUpperCase() + type.slice(1) : "Other";

/* Cleans up messy city/state input: splits on , or /, trims, dedupes, drops "state". */
function formatPlace(city?: string | null, state?: string | null) {
  const seen = new Set<string>();
  const parts = [city, state]
    .filter(Boolean)
    .flatMap((value) => (value as string).split(/[,/]/))
    .map((part) => part.trim().replace(/\s+state$/i, ""))
    .filter((part) => {
      const key = part.toLowerCase();
      if (!part || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return parts.slice(0, 2).join(", ") || "Location not listed";
}

function AddToCartToast({ title, imageUrl, onDone }: { title: string; imageUrl: string | null; onDone: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const enter = requestAnimationFrame(() => setShow(true));
    const leave = setTimeout(() => setShow(false), 2600);
    const remove = setTimeout(onDone, 3000);
    return () => { cancelAnimationFrame(enter); clearTimeout(leave); clearTimeout(remove); };
  }, [onDone]);
  return <div className={"pointer-events-auto flex w-full max-w-xs items-center gap-3 rounded-2xl border border-[var(--store-line)] bg-[var(--store-panel)] p-3 pr-4 shadow-xl shadow-black/15 transition-all duration-300 " + (show ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0")}>
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d6ff57] text-[#11110f]"><Check className="h-5 w-5" /></div>
    {imageUrl && <img src={imageUrl} className="h-10 w-10 shrink-0 rounded-lg object-cover" alt="" />}
    <div className="min-w-0"><p className="text-sm font-semibold">Added to cart</p><p className="truncate text-xs text-[var(--store-muted)]">{title}</p></div>
  </div>;
}

/* Product details popup: bottom sheet on phones, centered dialog on larger screens. */
function ProductModal({ item, vendorName, location, inCartQty, onClose, onAdd, onMessage }: {
  item: Item; vendorName: string; location: string; inCartQty: number;
  onClose: () => void; onAdd: (item: Item, qty: number) => void; onMessage: () => void;
}) {
  const [qty, setQty] = useState(1);
  const closeRef = useRef<HTMLButtonElement>(null);
  const max = item.stock_quantity > 0 ? item.stock_quantity : 99;
  const priced = item.price !== null;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [onClose]);

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="product-modal-title" className="relative grid max-h-[94vh] w-full max-w-3xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-t-3xl border border-[var(--store-line)] bg-[var(--store-panel)] text-[var(--store-text)] shadow-2xl sm:max-h-[640px] sm:grid-cols-2 sm:grid-rows-1 sm:rounded-3xl">
      <button ref={closeRef} type="button" onClick={onClose} aria-label="Close product details" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-[var(--store-panel)] text-[var(--store-text)] shadow-lg transition-transform hover:scale-105"><X className="h-5 w-5" /></button>

      <div className="relative h-56 bg-[var(--store-soft)] sm:h-full">
        {item.image_url
          ? <img src={item.image_url} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
          : <div className="grid h-full place-items-center"><Package className="h-12 w-12 text-[var(--store-muted)]" /></div>}
        <span className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">{item.type}</span>
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--store-accent-ink)]">{vendorName}</p>
          <h2 id="product-modal-title" className="mt-2 break-words font-display text-2xl font-semibold tracking-[-.04em] sm:text-3xl">{item.title}</h2>
          <p className="mt-3 font-display text-2xl font-semibold">{money(item.price, item.currency)}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            {item.stock_quantity > 0 && <span className="rounded-full bg-[var(--store-soft)] px-3 py-1.5">{item.stock_quantity} available</span>}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--store-soft)] px-3 py-1.5"><MapPin className="h-3.5 w-3.5 text-[var(--store-accent-ink)]" />{location}</span>
            {inCartQty > 0 && <span className="rounded-full bg-[#d6ff57] px-3 py-1.5 text-[#11110f]">{inCartQty} already added</span>}
          </div>
          <h3 className="mt-6 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--store-muted)]">About this item</h3>
          <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-[var(--store-muted)]">{item.description || "The store hasn’t added a description yet. Message them if you want more detail."}</p>
          <p className="mt-5 flex items-start gap-3 rounded-2xl bg-[var(--store-soft)] p-3.5 text-sm"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--store-accent-ink)]" /><span><strong className="block">Secure payment on BRIDGE</strong><span className="text-[var(--store-muted)]">You pay through BRIDGE, not directly to the seller.</span></span></p>
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--store-line)] bg-[var(--store-panel)] p-4 sm:px-7">
          {priced ? <>
            <div className="inline-flex h-12 shrink-0 items-center rounded-full border border-[var(--store-line)]">
              <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="grid h-full w-11 place-items-center rounded-full transition-colors hover:bg-[var(--store-soft)] disabled:opacity-40"><Minus className="h-4 w-4" /></button>
              <span aria-live="polite" className="min-w-[1.75rem] text-center font-semibold tabular-nums">{qty}</span>
              <button type="button" onClick={() => setQty((value) => Math.min(max, value + 1))} disabled={qty >= max} aria-label="Increase quantity" className="grid h-full w-11 place-items-center rounded-full transition-colors hover:bg-[var(--store-soft)] disabled:opacity-40"><Plus className="h-4 w-4" /></button>
            </div>
            <button type="button" onClick={() => onAdd(item, qty)} className="flex h-12 min-w-0 flex-1 items-center justify-between gap-3 rounded-full bg-[#d6ff57] px-5 text-sm font-bold text-[#11110f] transition-colors hover:bg-[#e9ff9c]"><span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Add to cart</span><span className="tabular-nums">{money((item.price as number) * qty, item.currency)}</span></button>
          </> : <button type="button" onClick={onMessage} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#d6ff57] px-5 text-sm font-bold text-[#11110f] transition-colors hover:bg-[#e9ff9c]"><MessageCircle className="h-4 w-4" />Message store for a price</button>}
        </div>
      </div>
    </div>
  </div>;
}

export function StorefrontPage() {
  const { theme, toggleTheme } = useBridgeTheme();
  const dark = theme === "dark";
  const themeStyle = (dark
    ? { "--store-page": "#11110f", "--store-text": "#f1eee7", "--store-panel": "#171714", "--store-line": "rgba(255,255,255,.16)", "--store-muted": "rgba(255,255,255,.68)", "--store-soft": "#24251f", "--store-accent-ink": "#d6ff57", "--store-danger": "#ff9b9b" }
    : { "--store-page": "#ffffff", "--store-text": "#11110f", "--store-panel": "#ffffff", "--store-line": "#d5dad6", "--store-muted": "#545a56", "--store-soft": "#f2f5f3", "--store-accent-ink": "#526b0c", "--store-danger": "#b42318" }) as CSSProperties;
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add, items: cartItems } = useCart();
  const [vendor, setVendor] = useState<Vendor | null | undefined>();
  const [items, setItems] = useState<Item[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [messaging, setMessaging] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [active, setActive] = useState<Item | null>(null);
  const [visit, setVisit] = useState<VisitLine[]>([]);
  /* If the banner image fails to load we fall back to the store mark. */
  const [heroFailed, setHeroFailed] = useState(false);

  useEffect(() => {
    let current = true;
    setVendor(undefined);
    setHeroFailed(false);
    setVisit([]);
    setTab("all");
    setQuery("");
    setActive(null);
    apiFetch("/store/" + slug)
      .then((data) => {
        if (!current) return;
        setVendor(data.vendor);
        setItems(data.listings);
        setGallery(data.gallery || []);
      })
      .catch(() => { if (current) setVendor(null); });
    return () => { current = false; };
  }, [slug]);

  const closeModal = useCallback(() => setActive(null), []);

  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => counts.set(item.type, (counts.get(item.type) || 0) + 1));
    return [{ key: "all", label: "All", count: items.length }, ...Array.from(counts, ([key, count]) => ({ key, label: typeLabel(key), count }))];
  }, [items]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => (tab === "all" || item.type === tab) && (!needle || (item.title + " " + (item.description || "")).toLowerCase().includes(needle)));
  }, [items, tab, query]);

  const visitQty = (id: string) => visit.find((line) => line.listingId === id)?.qty || 0;
  const visitCount = visit.reduce((sum, line) => sum + line.qty, 0);
  const visitTotal = visit.reduce((sum, line) => sum + line.price * line.qty, 0);
  const visitCurrency = visit[0]?.currency || "NGN";

  async function message() {
    if (!user) { navigate("/login"); return; }
    if (messaging) return;
    setMessaging(true);
    try {
      const data = await apiFetch("/messages/conversations", { method: "POST", body: JSON.stringify({ vendorSlug: slug }) });
      navigate("/messages/" + data.conversation.id);
    } catch (error) {
      console.error("Failed to start conversation", error);
      window.alert("Couldn't start a conversation with this store. Please try again.");
    } finally { setMessaging(false); }
  }

  /* Quantity is applied by calling add() once per unit, so it works with the existing CartContext. */
  function addToCart(item: Item, qty = 1) {
    if (!vendor) return;
    for (let i = 0; i < qty; i += 1) {
      add({ listingId: item.id, title: item.title, price: item.price ?? 0, currency: item.currency, imageUrl: item.image_url, vendorSlug: vendor.slug, vendorName: vendor.business_name });
    }
    setVisit((lines) => lines.some((line) => line.listingId === item.id)
      ? lines.map((line) => line.listingId === item.id ? { ...line, qty: line.qty + qty } : line)
      : [...lines, { listingId: item.id, title: item.title, price: item.price ?? 0, currency: item.currency, imageUrl: item.image_url, qty }]);
    setAddedId(item.id);
    setTimeout(() => setAddedId((id) => id === item.id ? null : id), 600);
    setToasts((current) => [...current, { id: item.id, key: item.id + "-" + Date.now(), title: qty > 1 ? qty + " × " + item.title : item.title, imageUrl: item.image_url }]);
  }

  if (vendor === undefined) return <div style={themeStyle} className="min-h-screen bg-[var(--store-page)] text-[var(--store-text)]"><BridgeLoader label="Loading this storefront" className="min-h-screen" /></div>;
  if (!vendor) return <div style={themeStyle} className="grid min-h-screen place-items-center bg-[var(--store-page)] p-6 text-center text-[var(--store-text)]"><div><p className="font-display text-3xl font-semibold">Store not found.</p><Link className="mt-4 inline-flex items-center gap-2 text-[var(--store-muted)] underline underline-offset-4" to="/explore"><ArrowLeft className="h-4 w-4" />Back to Explore</Link></div></div>;

  const heroImage = vendor.storefront_cover_url || vendor.cover_image_url || gallery[0]?.image_url || items.find((item) => item.image_url)?.image_url || null;
  const showHero = Boolean(heroImage) && !heroFailed;
  const breadcrumbCategory = vendor.category_name || "All businesses";
  const categoryHref = vendor.category_slug ? "/explore?category=" + encodeURIComponent(vendor.category_slug) : "/explore";
  const isOwner = user?.id === vendor.user_id;
  const description = vendor.description || "Discover products and services from this BRIDGE store.";
  const location = formatPlace(vendor.city, vendor.state);
  const verified = vendor.verification_status !== "unverified";

  return <div style={themeStyle} className="min-h-screen overflow-x-hidden bg-[var(--store-page)] font-body text-[var(--store-text)]">
    <header className="sticky top-0 z-40 border-b border-[var(--store-line)] bg-[var(--store-panel)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:gap-5 sm:px-8">
        <Link to="/" aria-label="BRIDGE home" className="shrink-0 font-display text-xl font-bold tracking-[-.06em] sm:text-2xl">BRIDGE</Link>
        <Link to="/explore" className="hidden min-w-0 flex-1 items-center gap-2 rounded-full bg-[var(--store-soft)] px-5 py-3 text-sm text-[var(--store-muted)] transition-colors hover:text-[var(--store-text)] md:flex"><SearchIcon />Search products, services, or stores</Link>
        <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5">
          <button onClick={toggleTheme} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--store-line)] text-[var(--store-accent-ink)]" aria-label="Toggle theme">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <button onClick={message} disabled={messaging} className="grid h-9 w-9 place-items-center rounded-full text-[var(--store-muted)] transition-colors hover:bg-[var(--store-soft)] hover:text-[var(--store-text)] disabled:opacity-50" aria-label="Message store"><MessageCircle className="h-5 w-5" /></button>
          <Link to="/cart" aria-label={"Cart, " + cartItems.length + " items"} className="flex items-center gap-1.5 rounded-full bg-[#d6ff57] px-3 py-2 text-sm font-semibold text-[#11110f]"><ShoppingCart className="h-4 w-4" /><span>{cartItems.length}</span></Link>
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-8 xl:pb-14">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 py-5 text-xs font-semibold sm:py-6 sm:text-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[var(--store-muted)] transition-colors hover:text-[var(--store-text)]"><Home className="h-3.5 w-3.5" />Home</Link>
        <ChevronRight className="h-3.5 w-3.5 text-[var(--store-muted)]" />
        <Link to={categoryHref} className="text-[var(--store-muted)] transition-colors hover:text-[var(--store-text)]">{breadcrumbCategory}</Link>
        <ChevronRight className="h-3.5 w-3.5 text-[var(--store-muted)]" />
        <span aria-current="page" className="max-w-[55vw] truncate text-[var(--store-text)]">{vendor.business_name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        {/* ── Left: store identity ── */}
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="relative isolate aspect-[16/10] overflow-hidden rounded-3xl bg-[var(--store-soft)] lg:aspect-[4/3]">
            {showHero
              ? <img
                  src={heroImage!}
                  alt={vendor.business_name + " storefront"}
                  onError={() => setHeroFailed(true)}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
              : <div className="grid h-full place-items-center bg-gradient-to-br from-[var(--store-soft)] to-[var(--store-panel)]"><StoreMark name={vendor.business_name} /></div>}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-[var(--store-panel)] py-1.5 pl-1.5 pr-3.5 text-xs font-bold shadow-lg">
              {vendor.logo_url ? <img src={vendor.logo_url} alt={vendor.business_name + " logo"} className="h-7 w-7 rounded-full object-cover" /> : <span className="grid h-7 w-7 place-items-center rounded-full bg-[#d6ff57] text-[#11110f]">{vendor.business_name.charAt(0)}</span>}
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[var(--store-accent-ink)]" /><span className="max-w-[160px] truncate">{location}</span></span>
            </div>
          </div>

          <h1 className="mt-5 break-words font-display text-3xl font-semibold leading-[1.05] tracking-[-.045em]">{vendor.business_name}</h1>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#d6ff57]/25 px-3 py-1 text-sm font-semibold text-[var(--store-accent-ink)]"><ShieldCheck className="h-4 w-4" />{verified ? "Verified" : "New storefront"}</span>
          <p className={"mt-3 text-sm leading-relaxed text-[var(--store-muted)] " + (showFullDescription ? "" : "line-clamp-3")}>{description}</p>
          {description.length > 140 && <button type="button" onClick={() => setShowFullDescription((value) => !value)} className="mt-1 text-sm font-semibold underline underline-offset-4">{showFullDescription ? "Show less" : "More info"}</button>}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <a href="#reviews" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--store-line)] px-3 py-1.5 transition-colors hover:bg-[var(--store-soft)]"><Star className="h-4 w-4 fill-amber-400 text-amber-500" /><strong>{vendor.avg_rating?.toFixed(1) || "New"}</strong><span className="text-[var(--store-muted)]">({vendor.review_count})</span></a>
            <span className="inline-flex items-center gap-1.5 text-[var(--store-muted)]"><Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />{vendor.completed_transactions} orders</span>
          </div>
          {vendor.reliability_score > 0 && <div className="mt-4"><div className="flex justify-between text-xs text-[var(--store-muted)]"><span>Reliability</span><span className="font-semibold text-[var(--store-text)]">{vendor.reliability_score}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--store-soft)]"><div className="h-full rounded-full bg-[#d6ff57]" style={{ width: Math.min(100, vendor.reliability_score) + "%" }} /></div></div>}

          <button onClick={message} disabled={messaging} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--store-line)] px-5 py-3 text-sm font-semibold transition-colors hover:bg-[var(--store-soft)] disabled:opacity-60"><MessageCircle className="h-4 w-4" />{messaging ? "Opening…" : "Message store"}</button>
        </aside>

        {/* ── Centre: menu ── */}
        <section id="shop" className="min-w-0 scroll-mt-24">
          <label className="flex h-13 items-center gap-3 rounded-2xl border border-[var(--store-line)] bg-[var(--store-soft)] px-4 py-3.5 focus-within:border-[#8ba526]">
            <Search className="h-5 w-5 shrink-0 text-[var(--store-accent-ink)]" />
            <span className="sr-only">Search this store</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={"Search " + vendor.business_name} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--store-muted)]" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-[var(--store-muted)] hover:text-[var(--store-text)]"><X className="h-4 w-4" /></button>}
          </label>

          {tabs.length > 2 && <div role="tablist" aria-label="Item types" className="sticky top-[61px] z-30 -mx-4 mt-3 flex gap-1 overflow-x-auto border-b border-[var(--store-line)] bg-[var(--store-page)] px-4 sm:-mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((entry) => <button key={entry.key} role="tab" aria-selected={tab === entry.key} type="button" onClick={() => setTab(entry.key)} className={"relative shrink-0 px-4 py-3.5 text-sm font-semibold transition-colors " + (tab === entry.key ? "text-[var(--store-text)] after:absolute after:inset-x-4 after:-bottom-px after:h-[3px] after:rounded-t-full after:bg-[#d6ff57]" : "text-[var(--store-muted)] hover:text-[var(--store-text)]")}>{entry.label}<span className="ml-1.5 text-xs font-normal text-[var(--store-muted)]">{entry.count}</span></button>)}
          </div>}

          <div className="mb-4 mt-6 flex items-end justify-between gap-3"><h2 className="font-display text-2xl font-semibold tracking-[-.03em]">{tab === "all" ? "Everything in store" : typeLabel(tab)}</h2><span className="text-sm text-[var(--store-muted)]">{visible.length} item{visible.length === 1 ? "" : "s"}</span></div>

          {items.length === 0 ? <div className="rounded-2xl border border-[var(--store-line)] bg-[var(--store-panel)] px-5 py-12 text-center"><Package className="mx-auto h-7 w-7 text-[var(--store-muted)]" /><p className="mt-3 font-semibold">This store hasn’t added listings yet.</p><p className="mt-1 text-sm text-[var(--store-muted)]">Check back soon or message the store directly.</p></div>
          : visible.length === 0 ? <div className="rounded-2xl border border-[var(--store-line)] px-5 py-12 text-center"><p className="font-semibold">Nothing matches “{query}”.</p><button type="button" onClick={() => { setQuery(""); setTab("all"); }} className="mt-2 text-sm font-semibold underline underline-offset-4">Clear filters</button></div>
          : <div className="grid gap-3 sm:grid-cols-2">{visible.map((item) => {
            const inCart = visitQty(item.id);
            return <article id={"product-" + item.id} key={item.id} className="group relative grid min-h-[148px] min-w-0 scroll-mt-40 grid-cols-[minmax(0,1fr)_132px] overflow-hidden rounded-2xl border border-[var(--store-line)] bg-[var(--store-panel)] transition-all hover:-translate-y-0.5 hover:border-[#8ba526] hover:shadow-lg hover:shadow-black/5 sm:grid-cols-[minmax(0,1fr)_120px] 2xl:grid-cols-[minmax(0,1fr)_132px]">
              <div className="flex min-w-0 flex-col p-4 pr-3">
                <h3 className="break-words font-display text-base font-semibold leading-snug"><button type="button" onClick={() => setActive(item)} className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-[#8ba526]">{item.title}</button></h3>
                {item.description && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--store-muted)]">{item.description}</p>}
                <div className="mt-auto flex items-center gap-2 pt-3"><strong className="text-[15px] tabular-nums">{money(item.price, item.currency)}</strong><span className="rounded-full bg-[var(--store-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--store-muted)]">{item.type}</span></div>
              </div>
              <div className="relative bg-[var(--store-soft)]">
                {item.image_url ? <img src={item.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><Package className="h-7 w-7 text-[var(--store-muted)]" /></div>}
                {inCart > 0 && <span className="absolute left-2 top-2 rounded-full bg-[#d6ff57] px-2 py-0.5 text-[11px] font-bold text-[#11110f]">{inCart} added</span>}
                {item.price !== null && <button type="button" onClick={() => addToCart(item)} aria-label={"Add " + item.title + " to cart"} className={"absolute bottom-2 right-2 z-10 inline-flex h-9 items-center gap-1 rounded-full bg-[var(--store-panel)] px-3 text-sm font-bold text-[var(--store-text)] shadow-lg transition-all hover:bg-[#d6ff57] hover:text-[#11110f] " + (addedId === item.id ? "scale-90 !bg-[#d6ff57] !text-[#11110f]" : "active:scale-95")}>{addedId === item.id ? <Check className="h-4 w-4" /> : <>Add<Plus className="h-4 w-4" /></>}</button>}
              </div>
            </article>;
          })}</div>}

          {gallery.length > 0 && <section aria-label="Store gallery" className="mt-12"><div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--store-accent-ink)]">A closer look</p><h2 className="mt-1 font-display text-xl font-semibold">From the storefront</h2></div><span className="text-xs text-[var(--store-muted)]">{gallery.length} photos</span></div><div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">{gallery.map((image) => <img key={image.id} src={image.image_url} alt={vendor.business_name + " gallery"} loading="lazy" className="h-28 w-40 shrink-0 snap-start rounded-xl border border-[var(--store-line)] object-cover sm:h-36 sm:w-52" />)}</div></section>}
        </section>

        {/* ── Right: live order panel (xl and up) ── */}
        <aside aria-label="Your order" className="hidden min-w-0 xl:sticky xl:top-24 xl:block xl:self-start">
          <section className="overflow-hidden rounded-3xl border border-[var(--store-line)] bg-[var(--store-panel)]">
            <div className="flex items-center justify-between px-5 pb-3 pt-5"><h2 className="font-display text-2xl font-semibold tracking-[-.03em]">Your order</h2>{visitCount > 0 && <span className="rounded-full bg-[#d6ff57] px-2.5 py-1 text-xs font-bold text-[#11110f]">{visitCount}</span>}</div>
            <div className="max-h-[46vh] overflow-y-auto border-t border-[var(--store-line)] px-5">
              {visit.length === 0 ? <div className="py-10 text-center"><ShoppingCart className="mx-auto h-7 w-7 text-[var(--store-muted)]" /><p className="mt-3 font-semibold">Nothing added yet</p><p className="mt-1 text-sm text-[var(--store-muted)]">Tap Add on any item, or open it to see the details first.</p></div>
              : <ul className="divide-y divide-[var(--store-line)]">{visit.map((line) => <li key={line.listingId} className="flex items-center gap-3 py-3.5">
                {line.imageUrl ? <img src={line.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" /> : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--store-soft)]"><Package className="h-5 w-5 text-[var(--store-muted)]" /></div>}
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{line.title}</p><p className="text-xs text-[var(--store-muted)] tabular-nums">{line.qty} × {money(line.price, line.currency)}</p></div>
                <strong className="text-sm tabular-nums">{money(line.price * line.qty, line.currency)}</strong>
              </li>)}</ul>}
            </div>
            <div className="border-t border-[var(--store-line)] p-5">
              <div className="flex items-center justify-between text-sm"><span className="text-[var(--store-muted)]">Added this visit</span><strong className="text-lg tabular-nums">{money(visitTotal, visitCurrency)}</strong></div>
              <Link to="/cart" className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-[#d6ff57] text-sm font-bold text-[#11110f] transition-colors hover:bg-[#e9ff9c]">Review cart &amp; checkout <ArrowRight className="h-4 w-4" /></Link>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[var(--store-muted)]"><ShieldCheck className="h-3.5 w-3.5" />Secure payments on BRIDGE</p>
            </div>
          </section>
          <section className="mt-4 rounded-3xl bg-[var(--store-soft)] p-5"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--store-accent-ink)]">Need help?</p><p className="mt-2 text-sm text-[var(--store-muted)]">Ask about sizes, delivery or custom orders before you buy.</p><button onClick={message} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--store-panel)] px-4 py-2.5 text-sm font-semibold transition-shadow hover:shadow-sm"><Headphones className="h-4 w-4" />Contact this store</button></section>
        </aside>
      </div>
    </main>

    <ReviewsSection slug={vendor.slug} isOwner={isOwner} />

    <footer className="border-t border-[var(--store-line)] bg-[var(--store-panel)]"><div className="mx-auto flex max-w-[1440px] flex-wrap gap-x-8 gap-y-3 px-5 py-7 text-sm text-[var(--store-muted)] sm:px-8"><Link to="/" className="font-bold text-[var(--store-text)]">BRIDGE</Link><span>Secure payments</span><span>Reliable delivery</span><Link to="/explore" className="transition-colors hover:text-[var(--store-text)]">Explore businesses</Link></div></footer>

    {/* Below xl the order panel collapses into a bottom bar. */}
    {visitCount > 0 && !active && <Link to="/cart" className="fixed inset-x-4 bottom-4 z-40 flex h-14 items-center justify-between rounded-2xl bg-[#d6ff57] px-5 text-sm font-bold text-[#11110f] shadow-xl shadow-black/20 xl:hidden"><span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />View cart · {visitCount} item{visitCount === 1 ? "" : "s"}</span><span className="tabular-nums">{money(visitTotal, visitCurrency)}</span></Link>}

    {active && <ProductModal item={active} vendorName={vendor.business_name} location={location} inCartQty={visitQty(active.id)} onClose={closeModal} onAdd={(item, qty) => { addToCart(item, qty); closeModal(); }} onMessage={() => { closeModal(); message(); }} />}

    <div className={"pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end " + (visitCount > 0 ? "bottom-24 xl:bottom-5" : "bottom-5")}>{toasts.map((toast) => <AddToCartToast key={toast.key} title={toast.title} imageUrl={toast.imageUrl} onDone={() => setToasts((current) => current.filter((item) => item.key !== toast.key))} />)}</div>
  </div>;
}

function SearchIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function StoreMark({ name }: { name: string }) { return <div className="grid h-20 w-20 place-items-center rounded-3xl bg-[#d6ff57] text-3xl font-bold text-[#11110f]">{name.charAt(0)}</div>; }