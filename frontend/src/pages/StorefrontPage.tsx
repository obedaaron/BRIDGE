import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ReviewsSection } from "../components/ReviewsSection";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Headphones, Home, MapPin, MessageCircle, Moon, Package, ShieldCheck, ShoppingCart, Star, Sun } from "lucide-react";
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
const money = (amount: number | null, currency: string) => amount === null
  ? "Contact for price"
  : new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

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

  useEffect(() => {
    let active = true;
    setVendor(undefined);
    apiFetch("/store/" + slug)
      .then((data) => {
        if (!active) return;
        setVendor(data.vendor);
        setItems(data.listings);
        setGallery(data.gallery || []);
      })
      .catch(() => { if (active) setVendor(null); });
    return () => { active = false; };
  }, [slug]);

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

  function addToCart(item: Item) {
    if (!vendor) return;
    add({ listingId: item.id, title: item.title, price: item.price ?? 0, currency: item.currency, imageUrl: item.image_url, vendorSlug: vendor.slug, vendorName: vendor.business_name });
    setAddedId(item.id);
    setTimeout(() => setAddedId((id) => id === item.id ? null : id), 400);
    setToasts((current) => [...current, { id: item.id, key: item.id + "-" + Date.now(), title: item.title, imageUrl: item.image_url }]);
  }

  if (vendor === undefined) return <div style={themeStyle} className="min-h-screen bg-[var(--store-page)] text-[var(--store-text)]"><BridgeLoader label="Loading this storefront" className="min-h-screen" /></div>;
  if (!vendor) return <div style={themeStyle} className="grid min-h-screen place-items-center bg-[var(--store-page)] p-6 text-center text-[var(--store-text)]"><div><p className="font-display text-3xl font-semibold">Store not found.</p><Link className="mt-4 inline-flex items-center gap-2 text-[var(--store-muted)] underline underline-offset-4" to="/explore"><ArrowLeft className="h-4 w-4" />Back to Explore</Link></div></div>;

  const heroImage = vendor.storefront_cover_url || vendor.cover_image_url || gallery[0]?.image_url || items.find((item) => item.image_url)?.image_url || null;
  const breadcrumbCategory = vendor.category_name || "All businesses";
  const categoryHref = vendor.category_slug ? "/explore?category=" + encodeURIComponent(vendor.category_slug) : "/explore";
  const isOwner = user?.id === vendor.user_id;
  const description = vendor.description || "Discover products and services from this BRIDGE store.";
  const location = [vendor.city, vendor.state].filter(Boolean).join(", ") || "Location not listed";

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

    <main className="mx-auto max-w-[1440px] px-4 pb-14 sm:px-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 py-5 text-xs font-semibold sm:py-7 sm:text-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[var(--store-muted)] transition-colors hover:text-[var(--store-text)]"><Home className="h-3.5 w-3.5" />Home</Link>
        <ChevronRight className="h-3.5 w-3.5 text-[var(--store-muted)]" />
        <Link to={categoryHref} className="text-[var(--store-muted)] transition-colors hover:text-[var(--store-text)]">{breadcrumbCategory}</Link>
        <ChevronRight className="h-3.5 w-3.5 text-[var(--store-muted)]" />
        <span aria-current="page" className="max-w-[55vw] truncate text-[var(--store-text)]">{vendor.business_name}</span>
      </nav>

      <div className="mb-4">
        <Link to="/explore" className="inline-flex items-center gap-2 rounded-full border border-[var(--store-line)] px-3.5 py-2 text-xs font-semibold text-[var(--store-muted)] transition-colors hover:border-[#8ba526] hover:text-[var(--store-text)]"><ArrowLeft className="h-3.5 w-3.5" />Back to businesses</Link>
      </div>

      <section className="overflow-hidden rounded-3xl border border-[var(--store-line)] bg-[var(--store-panel)]">
        <div className="relative aspect-[16/8] min-h-48 max-h-[440px] overflow-hidden bg-[var(--store-soft)] sm:aspect-[16/6]">
          {heroImage ? <img src={heroImage} alt={vendor.business_name + " storefront"} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-[var(--store-soft)] to-[var(--store-panel)]"><StoreMark name={vendor.business_name} /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-4 sm:p-7">
            <div className="flex min-w-0 items-end gap-3 sm:gap-4">
              {vendor.logo_url ? <img src={vendor.logo_url} alt={vendor.business_name + " logo"} className="h-14 w-14 shrink-0 rounded-2xl border-2 border-white bg-white object-cover shadow-lg sm:h-20 sm:w-20" /> : <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#d6ff57] text-xl font-bold text-[#11110f] sm:h-20 sm:w-20">{vendor.business_name.charAt(0)}</div>}
              <div className="min-w-0 pb-0.5"><span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">{breadcrumbCategory}</span><h1 className="truncate font-display text-2xl font-semibold tracking-[-.045em] text-white drop-shadow sm:text-4xl">{vendor.business_name}</h1></div>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-xs font-bold text-[#11110f] shadow-lg sm:px-4 sm:py-2.5 sm:text-sm"><MapPin className="h-4 w-4 text-[#526b0c]" /><span className="max-w-[34vw] truncate sm:max-w-none">{location}</span></div>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-9 lg:py-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h2 className="font-display text-2xl font-semibold tracking-[-.04em] sm:text-3xl">{vendor.business_name}</h2>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--store-accent-ink)]"><ShieldCheck className="h-4 w-4" />{vendor.verification_status === "unverified" ? "New storefront" : "Verified"}</span>
            </div>
            <p className={"mt-3 max-w-3xl text-sm leading-relaxed text-[var(--store-muted)] sm:text-base " + (showFullDescription ? "" : "line-clamp-2")}>{description}</p>
            {description.length > 140 && <button type="button" onClick={() => setShowFullDescription((value) => !value)} className="mt-1 text-sm font-semibold text-[#5a7411] underline underline-offset-4 dark:text-[#d6ff57]">{showFullDescription ? "Show less" : "More info"}</button>}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <a href="#reviews" className="inline-flex items-center gap-2 rounded-full border border-[var(--store-line)] px-3 py-1.5 transition-colors hover:bg-[var(--store-soft)]"><Star className="h-4 w-4 fill-amber-400 text-amber-500" /><strong>{vendor.avg_rating?.toFixed(1) || "New"}</strong><span className="text-[var(--store-muted)]">({vendor.review_count} reviews)</span></a>
              <span className="inline-flex items-center gap-1.5 text-[var(--store-muted)]"><Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />{vendor.completed_transactions} completed orders</span>
              {vendor.reliability_score > 0 && <span className="text-xs text-[var(--store-muted)]">Reliability {vendor.reliability_score}%</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <a href="#shop" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d6ff57] px-5 py-3 text-sm font-bold text-[#11110f] transition-colors hover:bg-[#e9ff9c]">Shop this store <ArrowRight className="h-4 w-4" /></a>
            <button onClick={message} disabled={messaging} className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--store-line)] px-5 py-3 text-sm font-semibold transition-colors hover:bg-[var(--store-soft)] disabled:opacity-60"><MessageCircle className="h-4 w-4" />{messaging ? "Opening…" : "Message store"}</button>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {gallery.length > 0 && <section aria-label="Store gallery" className="mb-9"><div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--store-accent-ink)]">A closer look</p><h2 className="mt-1 font-display text-xl font-semibold">From the storefront</h2></div><span className="text-xs text-[var(--store-muted)]">{gallery.length} photos</span></div><div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">{gallery.map((image) => <img key={image.id} src={image.image_url} alt={vendor.business_name + " gallery"} loading="lazy" className="h-28 w-40 shrink-0 snap-start rounded-xl border border-[var(--store-line)] object-cover sm:h-36 sm:w-52" />)}</div></section>}

          <section id="shop" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--store-line)] pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--store-accent-ink)]">Browse the collection</p><h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">From this store</h2></div><span className="text-sm text-[var(--store-muted)]">{items.length} item{items.length === 1 ? "" : "s"}</span></div>
            {items.length === 0 ? <div className="mt-5 rounded-2xl border border-[var(--store-line)] bg-[var(--store-panel)] px-5 py-12 text-center"><Package className="mx-auto h-7 w-7 text-[var(--store-muted)]" /><p className="mt-3 font-semibold">This store hasn’t added listings yet.</p><p className="mt-1 text-sm text-[var(--store-muted)]">Check back soon or message the store directly.</p></div> : <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article id={"product-" + item.id} key={item.id} className="scroll-mt-24 min-w-0 overflow-hidden rounded-2xl border border-[var(--store-line)] bg-[var(--store-panel)] transition-shadow hover:shadow-lg hover:shadow-black/5">
              <div className="relative aspect-[4/3] bg-[var(--store-soft)]">{item.image_url ? <img src={item.image_url} className="h-full w-full object-cover" alt={item.title} loading="lazy" /> : <div className="grid h-full place-items-center"><Package className="h-8 w-8 text-[var(--store-muted)]" /></div>}<span className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">{item.type}</span></div>
              <div className="min-w-0 p-4"><h3 className="break-words font-display text-lg font-semibold">{item.title}</h3>{item.description && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--store-muted)]">{item.description}</p>}<div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--store-line)] pt-3"><div><strong className="text-base">{money(item.price, item.currency)}</strong>{item.stock_quantity > 0 && <p className="mt-0.5 text-xs text-[var(--store-muted)]">{item.stock_quantity} available</p>}</div><button onClick={() => addToCart(item)} aria-label={"Add " + item.title + " to cart"} className={"grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d6ff57] text-[#11110f] transition-transform " + (addedId === item.id ? "scale-90" : "hover:scale-105 active:scale-95")}><ShoppingCart className="h-4 w-4" /></button></div></div>
            </article>)}</div>}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-[var(--store-line)] bg-[var(--store-panel)] p-5 sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--store-accent-ink)]">Shop with confidence</p><h2 className="mt-2 font-display text-2xl font-semibold">Support local.<br />Shop smart.</h2><p className="mt-2 text-sm leading-relaxed text-[var(--store-muted)]">Find trusted products and services from businesses in your community.</p><div className="mt-5 space-y-4 border-t border-[var(--store-line)] pt-4 text-sm"><p className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--store-accent-ink)]" /><span><strong className="block">Store verification</strong><span className="text-[var(--store-muted)]">{vendor.verification_status === "unverified" ? "New storefront" : "Verified on BRIDGE"}</span></span></p><p className="flex items-start gap-3"><Star className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span><strong className="block">Customer feedback</strong><span className="text-[var(--store-muted)]">{vendor.avg_rating?.toFixed(1) || "No rating yet"} · {vendor.review_count} reviews</span></span></p><p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--store-accent-ink)]" /><span><strong className="block">Store location</strong><span className="text-[var(--store-muted)]">{location}</span></span></p></div><button onClick={message} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--store-line)] px-4 py-3 text-sm font-semibold transition-colors hover:bg-[var(--store-soft)]"><Headphones className="h-4 w-4" />Contact this store</button></section>
          <section className="rounded-2xl bg-[var(--store-soft)] p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--store-accent-ink)]">Discover more</p><h2 className="mt-3 font-display text-2xl font-semibold">More local finds await.</h2><Link to="/explore" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--store-panel)] px-4 py-2.5 text-sm font-semibold transition-colors hover:shadow-sm">Explore businesses <ArrowRight className="h-4 w-4" /></Link></section>
        </aside>
      </div>
    </main>

    <ReviewsSection slug={vendor.slug} isOwner={isOwner} />

    <footer className="border-t border-[var(--store-line)] bg-[var(--store-panel)]"><div className="mx-auto flex max-w-[1440px] flex-wrap gap-x-8 gap-y-3 px-5 py-7 text-sm text-[var(--store-muted)] sm:px-8"><Link to="/" className="font-bold text-[var(--store-text)]">BRIDGE</Link><span>Secure payments</span><span>Reliable delivery</span><Link to="/explore" className="transition-colors hover:text-[var(--store-text)]">Explore businesses</Link></div></footer>
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end">{toasts.map((toast) => <AddToCartToast key={toast.key} title={toast.title} imageUrl={toast.imageUrl} onDone={() => setToasts((current) => current.filter((item) => item.key !== toast.key))} />)}</div>
  </div>;
}

function SearchIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function StoreMark({ name }: { name: string }) { return <div className="grid h-20 w-20 place-items-center rounded-3xl bg-[#d6ff57] text-3xl font-bold text-[#11110f]">{name.charAt(0)}</div>; }
