import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { SignboardTag } from "../components/SignboardTag";
import { StarRating } from "../components/StarRating";
import { useAuth } from "../context/AuthContext";
import { ArrowUpRight, BookOpen, Camera, Car, Home, Laptop, MapPin, MessageCircle, Monitor, Moon, UserRound, Navigation, Scissors, Search, Shirt, SlidersHorizontal, Sparkles, Star, Store, Sun, Truck, Utensils, Wrench } from "lucide-react";
import { useBridgeTheme } from "../lib/theme";
import { BridgeLoader } from "../components/BridgeLoader";

interface Vendor {
  id: string; business_name: string; slug: string; description: string | null; city: string | null; state: string | null;
  verification_status: string; logo_url: string | null; cover_image_url?: string | null; storefront_cover_url?: string | null; image_url?: string | null;
  category_name?: string | null; avg_rating: number | null; review_count: number; is_promoted?: boolean; distance_km?: number | null;
}
interface Category { id: string; name: string; slug: string; }
interface VendorSuggestion { id: string; business_name: string; slug: string; city: string | null; state: string | null; logo_url: string | null; category_name: string | null; }
interface ExploreNavigationProps {
  theme: "dark" | "light";
  onThemeChange: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  suggestions: VendorSuggestion[];
  suggestionsOpen: boolean;
  onSuggestionsOpenChange: (open: boolean) => void;
  onSuggestionSelect: (vendor: VendorSuggestion) => void;
}
type BrowseFilter = "all" | "featured" | "rated";

const cardTones = ["bg-[#d6ff57]", "bg-[#ca5b42]", "bg-[#e9e4da]", "bg-[#6d7160]"];
function CategoryIcon({ category, large = false }: { category: Category; large?: boolean }) {
  const label = (category.name + " " + category.slug).toLowerCase();
  const className = large ? "h-7 w-7" : "mr-1 inline h-3.5 w-3.5 shrink-0";
  if (/fashion|tailor|cloth|wear/.test(label)) return <Shirt className={className} />;
  if (/electronic|tech/.test(label)) return <Laptop className={className} />;
  if (/food|cater|beverage|restaurant/.test(label)) return <Utensils className={className} />;
  if (/beauty|hair|personal/.test(label)) return <Sparkles className={className} />;
  if (/home|living|furniture/.test(label)) return <Home className={className} />;
  if (/repair|maintenance|plumb|electric/.test(label)) return <Wrench className={className} />;
  if (/logistic|delivery|transport/.test(label)) return <Truck className={className} />;
  if (/digital|service/.test(label)) return <Monitor className={className} />;
  if (/event|media|photo/.test(label)) return <Camera className={className} />;
  if (/education|training|school/.test(label)) return <BookOpen className={className} />;
  if (/auto|mobility|vehicle/.test(label)) return <Car className={className} />;
  if (/alteration|sewing/.test(label)) return <Scissors className={className} />;
  return <Store className={className} />;
}

function ExploreNavigation({ theme, onThemeChange, query, onQueryChange, city, onCityChange, onSubmit, suggestions, suggestionsOpen, onSuggestionsOpenChange, onSuggestionSelect }: ExploreNavigationProps) {
  const { user } = useAuth();
  const dark = theme === "dark";
  return <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-6">
    <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel)]/95 p-2.5 text-[var(--text)] shadow-xl shadow-black/10 backdrop-blur-xl sm:flex-nowrap sm:gap-0 sm:rounded-full sm:px-4 sm:py-2.5">
      <Link to="/" className="order-1 flex shrink-0 items-center gap-2 px-2 sm:px-3" aria-label="BRIDGE home"><img src="/logo.png" alt="" className={"h-7 w-7 object-contain " + (dark ? "invert" : "")} /><span className="font-display text-lg font-bold tracking-[-0.06em]">BRIDGE</span></Link>
      <label className="order-2 flex min-w-0 flex-1 items-center gap-2 rounded-xl border-l border-[var(--line)] px-2.5 transition-colors focus-within:bg-[var(--soft)] focus-within:ring-2 focus-within:ring-[var(--accent-ink)] sm:w-[205px] sm:flex-none sm:gap-3 sm:px-4 sm:focus-within:bg-transparent sm:focus-within:ring-0">
        <MapPin className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" /><span className="min-w-0 flex-1"><span className="hidden text-[9px] font-bold uppercase tracking-[.18em] text-[var(--muted)] sm:block">Searching in</span><input aria-label="City or state" className="w-full min-w-0 truncate bg-transparent text-xs font-medium text-[var(--text)] outline-none placeholder:text-[var(--placeholder)] sm:mt-0.5 sm:text-sm" placeholder="City or state" value={city} onChange={(event) => onCityChange(event.target.value)} /></span>
      </label>
      <div className="order-4 relative w-full border-t border-[var(--line)] pt-2 sm:order-3 sm:w-auto sm:min-w-[220px] sm:flex-1 sm:border-l sm:border-t-0 sm:px-3 sm:pt-0">
        <form onSubmit={onSubmit} className="flex items-center gap-2 rounded-xl border border-transparent bg-[var(--soft)] px-3 py-2 transition-colors focus-within:border-[var(--accent-ink)] sm:rounded-full sm:px-4">
          <Search className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" /><input aria-label="Search businesses or services" className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--placeholder)] sm:text-base" placeholder="Business, service or category" value={query} onChange={(event) => { onQueryChange(event.target.value); onSuggestionsOpenChange(true); }} onFocus={() => onSuggestionsOpenChange(true)} onBlur={() => window.setTimeout(() => onSuggestionsOpenChange(false), 120)} onKeyDown={(event) => { if (event.key === "Escape") onSuggestionsOpenChange(false); }} aria-autocomplete="list" aria-expanded={suggestionsOpen && suggestions.length > 0} />
          <button type="submit" aria-label="Search" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#d6ff57] text-[#11110f] transition-colors hover:bg-[#ecffad] sm:hidden"><ArrowUpRight className="h-4 w-4" /></button>
          <button type="submit" className="hidden shrink-0 rounded-full bg-[#d6ff57] px-4 py-2 text-xs font-bold text-[#11110f] transition-colors hover:bg-[#ecffad] sm:inline-flex">Search</button>
        </form>
        {suggestionsOpen && query.trim().length >= 1 && suggestions.length > 0 && <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto scrollbar-hide rounded-xl border border-[var(--line)] bg-[var(--panel)] p-1.5 shadow-2xl sm:left-3 sm:right-3">{suggestions.map((vendor) => <button key={vendor.id} type="button" role="option" aria-selected="false" onMouseDown={(event) => event.preventDefault()} onClick={() => onSuggestionSelect(vendor)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[var(--soft)]"><span className="shrink-0">{vendor.logo_url ? <img src={vendor.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#d6ff57]/20 text-sm font-semibold text-[#789920]">{vendor.business_name.charAt(0)}</span>}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{vendor.business_name}</span><span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{[[vendor.city, vendor.state].filter(Boolean).join(", "), vendor.category_name].filter(Boolean).join(" · ") || "Location not listed"}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 opacity-45" /></button>)}</div>}
      </div>
      <div className="order-3 ml-auto flex shrink-0 items-center gap-1.5 sm:order-4 sm:ml-0 sm:gap-2">{user ? <><Link to="/messages" aria-label="Messages" className="hidden h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--page)] hover:text-[var(--text)] sm:inline-flex"><MessageCircle className="h-4 w-4" /></Link><Link to="/profile" aria-label="Your profile" title={user.full_name || user.email} className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--soft)] px-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--page)]"><UserRound className="h-4 w-4" /><span className="hidden max-w-24 truncate sm:inline">{user.full_name || "Profile"}</span></Link></> : <Link to="/signup" aria-label="Create an account" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#d6ff57] px-2.5 text-xs font-bold text-[#11110f] hover:bg-[#ecffad] sm:px-4"><UserRound className="h-4 w-4" /><span>Create account</span></Link>}<button onClick={onThemeChange} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] text-[var(--accent-ink)] transition-colors hover:bg-[var(--page)]" aria-label={"Switch to " + (dark ? "light" : "dark") + " theme"}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button></div>
    </div>
  </header>;
}

function StoreCard({ vendor, featured = false }: { vendor: Vendor; featured?: boolean }) {
  const imageCandidates = [vendor.storefront_cover_url, vendor.cover_image_url, vendor.image_url].filter((url, index, all): url is string => Boolean(url) && all.indexOf(url) === index);
  const [imageIndex, setImageIndex] = useState(0);
  const cover = imageCandidates[imageIndex] || null;
  return <Link to={"/store/" + vendor.slug} className="group block min-w-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] transition-colors hover:border-[#9abf31]/60">
    <div className={"relative h-36 overflow-hidden " + (cover ? "bg-black/10" : cardTones[vendor.business_name.length % cardTones.length])}>
      {cover ? <img src={cover} alt={vendor.business_name + " storefront"} loading="lazy" onError={() => setImageIndex((index) => Math.min(index + 1, imageCandidates.length))} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" /> : vendor.logo_url ? <div className="grid h-full place-items-center bg-[var(--soft)]"><img src={vendor.logo_url} alt={vendor.business_name + " logo"} loading="lazy" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} className="h-20 w-20 rounded-2xl object-cover shadow-sm" /></div> : <div className="grid h-full place-items-center font-display text-6xl font-semibold text-black/20">{vendor.business_name.charAt(0)}</div>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      {featured && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#d6ff57] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#11110f]"><Sparkles className="h-3 w-3" />Featured</span>}
      {cover && vendor.logo_url && <img src={vendor.logo_url} alt="" loading="lazy" className="absolute bottom-3 left-3 h-11 w-11 rounded-xl border-2 border-white object-cover shadow-lg" />}
      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"><MapPin className="h-3 w-3" />{[vendor.city, vendor.state].filter(Boolean).join(", ") || "Nigeria"}</span>
    </div>
    <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-display text-lg font-semibold tracking-[-.03em]">{vendor.business_name}</h3>{vendor.category_name && <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-ink)]">{vendor.category_name}</p>}</div><ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div>
      {vendor.description && <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-relaxed text-[var(--muted)]">{vendor.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[var(--line)] pt-3"><SignboardTag color={vendor.verification_status === "unverified" ? "signal" : "gold"}>{vendor.verification_status === "unverified" ? "New" : "Verified"}</SignboardTag>{vendor.avg_rating !== null && <div className="flex items-center gap-1"><StarRating value={vendor.avg_rating} size="sm" /><span className="text-[11px] text-[var(--muted)]">{vendor.avg_rating.toFixed(1)} ({vendor.review_count})</span></div>}{vendor.distance_km != null && <span className="text-[11px] text-[var(--muted)]">{vendor.distance_km < 1 ? "<1 km" : vendor.distance_km + " km"}</span>}</div>
    </div>
  </Link>;
}
export function Explore() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const routeParams = useParams();
  const { theme, toggleTheme } = useBridgeTheme();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [suggestions, setSuggestions] = useState<VendorSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [city, setCity] = useState(() => searchParams.get("city") ?? "");
  const [activeCategory, setActiveCategory] = useState(() => routeParams.slug ?? searchParams.get("category") ?? "");
  const [browseFilter, setBrowseFilter] = useState<BrowseFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const themeStyle = (theme === "dark"
    ? { "--page": "#11110f", "--panel": "#171714", "--text": "#f1eee7", "--muted": "rgba(255,255,255,.68)", "--placeholder": "rgba(255,255,255,.64)", "--accent-ink": "#bce55c", "--line": "rgba(255,255,255,.18)", "--soft": "#262720", "--softText": "#f1eee7" }
    : { "--page": "#ffffff", "--panel": "#ffffff", "--text": "#11110f", "--muted": "#545a56", "--placeholder": "#707771", "--accent-ink": "#526b0c", "--line": "#d5dad6", "--soft": "#f2f5f3", "--softText": "#11110f" }) as CSSProperties;

  useEffect(() => { apiFetch("/categories").then((data) => setCategories(data.categories)); }, []);
  useEffect(() => { setQ(searchParams.get("q") ?? ""); setCity(searchParams.get("city") ?? ""); setActiveCategory(routeParams.slug ?? ""); }, [location.pathname, location.search, routeParams.slug, searchParams]);
  useEffect(() => {
    const trimmedQuery = q.trim();
    if (trimmedQuery.length < 1) { setSuggestions([]); return; }
    let active = true;
    const params = new URLSearchParams({ q: trimmedQuery });
    if (city.trim()) params.set("city", city.trim());
    apiFetch("/search/suggestions?" + params.toString()).then((data) => { if (active) setSuggestions(data.vendors); }).catch(() => { if (active) setSuggestions([]); });
    return () => { active = false; };
  }, [q, city]);

  function search() {
    setLoading(true); setError("");
    const params = new URLSearchParams();
    const query = searchParams.get("q") ?? "";
    const searchCity = searchParams.get("city") ?? "";
    const category = routeParams.slug ?? searchParams.get("category") ?? "";
    if (query) params.set("q", query);
    if (searchCity) params.set("city", searchCity);
    if (category) params.set("category", category);
    if (userLocation) { params.set("lat", String(userLocation.lat)); params.set("lng", String(userLocation.lng)); }
    apiFetch("/search?" + params.toString()).then((data) => setVendors(data.vendors)).catch((err) => { setVendors([]); setError(err.message || "Could not load businesses. Please try again."); }).finally(() => setLoading(false));
  }
  useEffect(() => { if (location.pathname !== "/explore") search(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [location.pathname, location.search, userLocation]);
  function handleSubmit(event: FormEvent) {
    event.preventDefault(); setSuggestionsOpen(false);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (city.trim()) params.set("city", city.trim());
    const category = routeParams.slug ?? searchParams.get("category") ?? "";
    const destination = category ? "/category/" + category : "/stores";
    navigate(destination + (params.size ? "?" + params.toString() : ""));
  }
  function selectSuggestion(vendor: VendorSuggestion) { setQ(vendor.business_name); if (vendor.city) setCity(vendor.city); setSuggestionsOpen(false); }
  function findNearby() {
    if (!navigator.geolocation) { setLocationMessage("Your browser does not support location services."); return; }
    setLocationMessage("Finding businesses near you.");
    navigator.geolocation.getCurrentPosition((position) => {
      setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      setLocationMessage("Showing businesses nearest to you.");
    }, () => setLocationMessage("We could not access your location. Allow access and try again."), { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 });
  }

  const desktopCategoryHub = location.pathname === "/explore";
  const filteredVendors = vendors.filter((vendor) => browseFilter !== "featured" || Boolean(vendor.is_promoted)).slice().sort((a, b) => browseFilter === "rated" ? (b.avg_rating ?? -1) - (a.avg_rating ?? -1) : 0);
  const filterChip = (filter: BrowseFilter, label: string, icon: ReactNode) => <button type="button" onClick={() => setBrowseFilter(filter)} aria-pressed={browseFilter === filter} className={"inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors " + (browseFilter === filter ? "border-[#d6ff57] bg-[#d6ff57] text-[#11110f]" : "border-[var(--line)] bg-[var(--panel)] text-[var(--text)] hover:border-[#9abf31]")}>{icon}{label}</button>;

  return <div style={themeStyle} className="min-h-screen bg-[var(--page)] font-body text-[var(--text)] transition-colors duration-300">
    <ExploreNavigation theme={theme} onThemeChange={toggleTheme} query={q} onQueryChange={setQ} city={city} onCityChange={setCity} onSubmit={handleSubmit} suggestions={suggestions} suggestionsOpen={suggestionsOpen} onSuggestionsOpenChange={setSuggestionsOpen} onSuggestionSelect={selectSuggestion} />
    {desktopCategoryHub && <main className="mx-auto min-h-[calc(100vh-5rem)] max-w-[1440px] px-8 pb-16 pt-32 lg:px-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-[#d6ff57]/10 blur-3xl" />
        <p className="relative text-xs font-bold uppercase tracking-[.22em] text-[var(--accent-ink)]">BRIDGE · Explore</p>
        <h1 className="relative mt-4 max-w-3xl font-display text-5xl font-semibold leading-[.98] tracking-[-.065em] sm:text-7xl">Find the people<br />who do the work.</h1>
        <p className="relative mt-5 max-w-xl text-base leading-relaxed text-[var(--muted)]">Choose a category to discover trusted local stores, independent makers, and services near you.</p>
      </section>
      <section className="py-10">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--accent-ink)]">Start with what you need</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Browse categories</h2></div><span className="hidden text-sm text-[var(--muted)] sm:block">{categories.length} ways to find a local business</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{categories.map((category) => <Link key={category.id} to={"/category/" + category.slug} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-5 py-4 transition-colors hover:border-[#9abf31]/70 hover:bg-[var(--soft)]"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#d6ff57]/20 text-[var(--accent-ink)]"><CategoryIcon category={category} /></span><span className="min-w-0 flex-1"><span className="block font-display text-lg font-semibold">{category.name}</span><span className="mt-1 block text-xs text-[var(--muted)]">Explore local {category.name.toLowerCase()}</span></span><ArrowUpRight className="h-4 w-4 text-[var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>)}</div>
      </section>
      <section className="grid gap-6 rounded-[2rem] bg-[#d6ff57] p-7 text-[#11110f] sm:grid-cols-[1fr_auto] sm:items-center sm:p-10"><div><p className="text-xs font-bold uppercase tracking-[.2em]">For business owners</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Let’s build your storefront.</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#11110f]/75">Put your business in front of people looking for the work you do. Start with a free BRIDGE account and add your store details when you are ready.</p></div><div className="flex flex-col gap-3 sm:flex-row"><Link to="/stores" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#11110f]/20 px-6 font-semibold text-[#11110f] hover:bg-white/30"><Search className="h-4 w-4" />Browse all stores</Link><Link to="/become-vendor" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#11110f] px-6 font-semibold text-white hover:bg-[#2b2b27]"><Store className="h-4 w-4" />Become a vendor<ArrowUpRight className="h-4 w-4" /></Link></div></section>
    </main>}
    <main className={"mx-auto max-w-[1440px] px-4 pb-16 pt-32 sm:px-6 sm:pt-28 lg:px-10 " + (desktopCategoryHub ? "hidden" : "")}>
      <header className="mb-7">
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-sm text-[var(--muted)]"><Link to="/explore" className="font-semibold text-[var(--accent-ink)] hover:underline">{city || "Explore"}</Link><span aria-hidden="true">›</span><span className="text-[var(--text)]">{categories.find((category) => category.slug === activeCategory)?.name || "Stores"}</span></nav>
        <h1 className="font-display text-3xl font-semibold tracking-[-.05em] sm:text-4xl">{categories.find((category) => category.slug === activeCategory)?.name || "All stores"}</h1>
      </header>
      <nav aria-label="Browse by category" className="mb-7 flex snap-x gap-5 overflow-x-auto scrollbar-hide pb-2">
        <Link to="/stores" className="group flex w-[74px] shrink-0 snap-start flex-col items-center gap-2 text-center text-xs font-semibold text-[var(--text)]"><span className={"grid h-14 w-14 place-items-center rounded-full transition-colors " + (!activeCategory ? "bg-[#d6ff57] text-[#11110f]" : "bg-[var(--soft)] text-[var(--accent-ink)] group-hover:bg-[#d6ff57]/30")}><Store className="h-6 w-6" /></span><span>All stores</span></Link>
        {categories.map((category) => <Link key={category.id} to={"/category/" + category.slug} aria-current={activeCategory === category.slug ? "page" : undefined} className="group flex w-[88px] shrink-0 snap-start flex-col items-center gap-2 text-center text-xs font-semibold text-[var(--text)]"><span className={"grid h-14 w-14 place-items-center rounded-full transition-colors " + (activeCategory === category.slug ? "bg-[#d6ff57] text-[#11110f]" : "bg-[var(--soft)] text-[var(--accent-ink)] group-hover:bg-[#d6ff57]/30")}><CategoryIcon category={category} large /></span><span className="line-clamp-2">{category.name}</span></Link>)}
      </nav>
      <section aria-label="Store filters" className="mb-8 border-y border-[var(--line)] bg-[var(--panel)] py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide"><span className="mr-1 hidden shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] sm:inline-flex"><SlidersHorizontal className="h-3.5 w-3.5" />Filter</span>{filterChip("all", "All businesses", <SlidersHorizontal className="h-3.5 w-3.5" />)}{filterChip("featured", "Featured", <Sparkles className="h-3.5 w-3.5" />)}{filterChip("rated", "Top rated", <Star className="h-3.5 w-3.5" />)}<button type="button" onClick={findNearby} aria-pressed={Boolean(userLocation)} className={"inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors " + (userLocation ? "border-[#d6ff57] bg-[#d6ff57]/10 text-[var(--accent-ink)]" : "border-[var(--line)] bg-[var(--panel)] text-[var(--text)] hover:border-[#9abf31]")}><Navigation className="h-3.5 w-3.5" />Nearby</button>{locationMessage && <span className="hidden text-xs text-[var(--muted)] md:inline">{locationMessage}</span>}</div>
      </section>
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--accent-ink)]">Available storefronts</p><h2 className="mt-1 font-display text-2xl font-semibold tracking-[-.04em] sm:text-3xl">All stores</h2></div><p className="text-sm text-[var(--muted)]">{loading ? "Finding stores…" : filteredVendors.length + " stores"}</p></div>
        {loading ? <div className="rounded-2xl border border-[var(--line)]"><BridgeLoader label="Finding businesses for you" /></div> : error ? <div role="alert" className="rounded-2xl border border-[var(--line)] px-5 py-16 text-center"><p className="font-display text-2xl font-semibold">Could not load businesses.</p><p className="mx-auto mt-3 max-w-lg text-sm text-[var(--muted)]">{error}</p><button type="button" onClick={search} className="mt-5 rounded-full bg-[#d6ff57] px-5 py-2.5 text-sm font-semibold text-[#11110f] hover:bg-[#ecffad]">Try again</button></div> : filteredVendors.length === 0 ? <div className="rounded-2xl border border-[var(--line)] px-5 py-16 text-center"><Search className="mx-auto h-7 w-7 text-[var(--accent-ink)]" /><p className="mt-4 font-display text-2xl font-semibold">{browseFilter === "featured" ? "No featured stores in these results" : "Nothing here yet."}</p><p className="mt-2 text-sm text-[var(--muted)]">Try another category, service, or location.</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredVendors.map((vendor) => <StoreCard key={vendor.id} vendor={vendor} featured={Boolean(vendor.is_promoted)} />)}</div>}
      </section>
      <footer className="mt-10 border-t border-[var(--line)] py-6 text-center text-xs text-[var(--muted)]">Made for discovering the businesses around you.</footer>
    </main>
  </div>;
}
