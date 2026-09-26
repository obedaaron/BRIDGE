import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { SignboardTag } from "../components/SignboardTag";
import { StarRating } from "../components/StarRating";
import { useAuth } from "../context/AuthContext";
import { ArrowUpRight, BookOpen, Camera, Car, Crosshair, Home, Laptop, LogOut, MapPin, MessageCircle, Monitor, Moon, Navigation, Scissors, Search, Shirt, SlidersHorizontal, Sparkles, Star, Store, Sun, Truck, Utensils, Wrench } from "lucide-react";
import { useBridgeTheme } from "../lib/theme";
import { BridgeLoader } from "../components/BridgeLoader";

interface Vendor {
  id: string; business_name: string; slug: string; description: string | null; city: string | null; state: string | null;
  verification_status: string; logo_url: string | null; cover_image_url?: string | null; storefront_cover_url?: string | null;
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
const coverFor = (vendor: Vendor) => vendor.storefront_cover_url || vendor.cover_image_url || null;
function CategoryIcon({ category }: { category: Category }) {
  const label = (category.name + " " + category.slug).toLowerCase();
  const className = "mr-1 inline h-3.5 w-3.5 shrink-0";
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
  const { user, logout } = useAuth();
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
      <div className="order-3 ml-auto flex shrink-0 items-center gap-1.5 sm:order-4 sm:ml-0 sm:gap-2">{user ? <><Link to="/messages" aria-label="Messages" className="hidden h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--page)] hover:text-[var(--text)] sm:inline-flex"><MessageCircle className="h-4 w-4" /></Link><Link to="/dashboard" aria-label="Dashboard" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--page)] hover:text-[var(--text)] sm:w-auto sm:gap-2 sm:px-2"><Store className="h-4 w-4" /><span className="hidden text-xs sm:inline">Dashboard</span></Link><button onClick={logout} aria-label="Sign out" className="hidden h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--page)] hover:text-[var(--text)] sm:inline-flex"><LogOut className="h-4 w-4" /></button></> : <Link to="/signup" aria-label="Create a store" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#d6ff57] px-2.5 text-xs font-bold text-[#11110f] hover:bg-[#ecffad] sm:px-4"><Store className="h-4 w-4" /><span className="hidden sm:inline">Create a store</span></Link>}<button onClick={onThemeChange} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] text-[var(--accent-ink)] transition-colors hover:bg-[var(--page)]" aria-label={"Switch to " + (dark ? "light" : "dark") + " theme"}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button></div>
    </div>
  </header>;
}

function StoreCard({ vendor, featured = false }: { vendor: Vendor; featured?: boolean }) {
  const cover = coverFor(vendor);
  return <Link to={"/store/" + vendor.slug} className="group block min-w-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] transition-colors hover:border-[#9abf31]/60">
    <div className={"relative h-36 overflow-hidden " + (cover ? "bg-black/10" : cardTones[vendor.business_name.length % cardTones.length])}>
      {cover ? <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" /> : vendor.logo_url ? <div className="grid h-full place-items-center bg-[var(--soft)]"><img src={vendor.logo_url} alt="" loading="lazy" className="h-20 w-20 rounded-2xl object-cover shadow-sm" /></div> : <div className="grid h-full place-items-center font-display text-6xl font-semibold text-black/20">{vendor.business_name.charAt(0)}</div>}
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
  const { theme, toggleTheme } = useBridgeTheme();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [recommendations, setRecommendations] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [suggestions, setSuggestions] = useState<VendorSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [city, setCity] = useState(() => searchParams.get("city") ?? "");
  const [activeCategory, setActiveCategory] = useState(() => searchParams.get("category") ?? "");
  const [browseFilter, setBrowseFilter] = useState<BrowseFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const themeStyle = (theme === "dark"
    ? { "--page": "#11110f", "--panel": "#171714", "--text": "#f1eee7", "--muted": "rgba(255,255,255,.68)", "--placeholder": "rgba(255,255,255,.64)", "--accent-ink": "#bce55c", "--line": "rgba(255,255,255,.18)", "--soft": "#262720", "--softText": "#f1eee7" }
    : { "--page": "#ffffff", "--panel": "#ffffff", "--text": "#11110f", "--muted": "#545a56", "--placeholder": "#707771", "--accent-ink": "#526b0c", "--line": "#d5dad6", "--soft": "#f2f5f3", "--softText": "#11110f" }) as CSSProperties;

  useEffect(() => { apiFetch("/categories").then((data) => setCategories(data.categories)); apiFetch("/recommendations").then((data) => setRecommendations(data.vendors)).catch(() => undefined); }, []);
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
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (activeCategory) params.set("category", activeCategory);
    if (userLocation) { params.set("lat", String(userLocation.lat)); params.set("lng", String(userLocation.lng)); }
    apiFetch("/search?" + params.toString()).then((data) => setVendors(data.vendors)).catch((err) => { setVendors([]); setError(err.message || "Could not load businesses. Please try again."); }).finally(() => setLoading(false));
  }
  useEffect(() => { search(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [activeCategory, userLocation]);
  function handleSubmit(event: FormEvent) { event.preventDefault(); setSuggestionsOpen(false); search(); }
  function selectSuggestion(vendor: VendorSuggestion) { setQ(vendor.business_name); if (vendor.city) setCity(vendor.city); setSuggestionsOpen(false); }
  function findNearby() {
    if (!navigator.geolocation) { setLocationMessage("Your browser does not support location services."); return; }
    setLocationMessage("Finding businesses near you.");
    navigator.geolocation.getCurrentPosition((position) => {
      setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      setLocationMessage("Showing businesses nearest to you.");
    }, () => setLocationMessage("We could not access your location. Allow access and try again."), { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 });
  }

  const filteredVendors = vendors.filter((vendor) => browseFilter !== "featured" || Boolean(vendor.is_promoted)).slice().sort((a, b) => browseFilter === "rated" ? (b.avg_rating ?? -1) - (a.avg_rating ?? -1) : 0);
  const featuredStores = vendors.filter((vendor) => vendor.is_promoted);
  const spotlightStores = recommendations.filter((vendor) => Boolean(coverFor(vendor))).slice(0, 6);
  const filterChip = (filter: BrowseFilter, label: string, icon: ReactNode) => <button type="button" onClick={() => setBrowseFilter(filter)} aria-pressed={browseFilter === filter} className={"inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors " + (browseFilter === filter ? "border-[#d6ff57] bg-[#d6ff57] text-[#11110f]" : "border-[var(--line)] bg-[var(--panel)] text-[var(--text)] hover:border-[#9abf31]")}>{icon}{label}</button>;

  return <div style={themeStyle} className="min-h-screen bg-[var(--page)] font-body text-[var(--text)] transition-colors duration-300">
    <ExploreNavigation theme={theme} onThemeChange={toggleTheme} query={q} onQueryChange={setQ} city={city} onCityChange={setCity} onSubmit={handleSubmit} suggestions={suggestions} suggestionsOpen={suggestionsOpen} onSuggestionsOpenChange={setSuggestionsOpen} onSuggestionSelect={selectSuggestion} />
    <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-40 sm:px-6 sm:pt-32 lg:px-10">
      <section className="relative overflow-hidden rounded-t-[2rem] rounded-b-none border border-b-0 border-[var(--line)] bg-[var(--panel)] px-5 pb-5 pt-7 sm:px-8 sm:pb-6 sm:pt-9 lg:px-12 lg:pb-7 lg:pt-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-36 h-[28rem] w-[28rem] rounded-full bg-[#d6ff57]/[0.08] blur-3xl" />
        <div className="relative flex flex-col justify-end gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent-ink)]"><span className="h-1.5 w-1.5 rounded-full bg-[#d6ff57]" />A better way to find local</p><h1 className="mt-4 max-w-2xl font-display text-[clamp(2.8rem,6vw,5.8rem)] font-semibold leading-[.88] tracking-[-.075em]">Good finds<br className="hidden sm:block" /> start nearby.</h1><p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--muted)] sm:text-base">Find trusted storefronts, compare useful details, and connect directly with local businesses.</p></div>
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-[var(--muted)]"><Crosshair className="h-4 w-4 text-[var(--accent-ink)]" />Search stores, services and categories</p>
        </div>
        {locationMessage && <p className="relative mt-5 inline-flex border-l-2 border-[#9abf31] pl-3 text-sm text-[var(--muted)]">{locationMessage}</p>}
      </section>

      <section style={{ background: "linear-gradient(105deg, rgba(214,255,87,.08), transparent 42%), var(--panel)" }} className="sticky top-[8.75rem] z-30 -mx-4 -mt-px border-y border-[var(--line)] bg-[var(--panel)] px-4 py-3 shadow-[0_12px_32px_-28px_rgba(214,255,87,0.8)] sm:top-24 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5"><span className="mr-1 hidden shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] sm:inline-flex"><SlidersHorizontal className="h-3.5 w-3.5" />Filter</span>{filterChip("all", "All businesses", <SlidersHorizontal className="h-3.5 w-3.5" />)}{filterChip("featured", "Featured", <Sparkles className="h-3.5 w-3.5" />)}{filterChip("rated", "Top rated", <Star className="h-3.5 w-3.5" />)}<button type="button" onClick={findNearby} aria-pressed={Boolean(userLocation)} className={"inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors " + (userLocation ? "border-[#d6ff57] bg-[#d6ff57]/10 text-[var(--accent-ink)]" : "border-[var(--line)] bg-[var(--panel)] text-[var(--text)] hover:border-[#9abf31]")}><Navigation className="h-3.5 w-3.5" />Nearby</button>{locationMessage && <span className="hidden text-xs text-[var(--muted)] md:inline">{locationMessage}</span>}</div>
      </section>

      {featuredStores.length > 0 && <section className="border-b border-[var(--line)] py-9 sm:py-11"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--accent-ink)]">The ones to know</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.05em] sm:text-3xl">Featured stores</h2></div><span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">{featuredStores.length} featured</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{featuredStores.slice(0, 6).map((vendor) => <StoreCard key={vendor.id} vendor={vendor} featured />)}</div></section>}

      {spotlightStores.length > 0 && <section className="border-b border-[var(--line)] py-9 sm:py-11"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--accent-ink)]">A good place to start</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.05em] sm:text-3xl">Handpicked for you</h2></div><span className="hidden text-xs text-[var(--muted)] sm:inline">Stores worth a closer look</span></div><div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide pb-3">{spotlightStores.map((vendor) => <div key={vendor.id} className="w-[82%] shrink-0 snap-start sm:w-[48%] lg:w-[32%]"><StoreCard vendor={vendor} /></div>)}</div></section>}

      <section className="py-9 sm:py-11">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--accent-ink)]">Explore BRIDGE</p><h2 className="mt-2 font-display text-3xl font-semibold leading-none tracking-[-.05em] sm:text-4xl">{loading ? "Finding storefronts" : browseFilter === "featured" ? "Featured businesses" : browseFilter === "rated" ? "Top rated businesses" : "All businesses"}</h2><p className="mt-2 text-sm text-[var(--muted)]">{loading ? "Looking for businesses to match your search." : filteredVendors.length + " storefront" + (filteredVendors.length === 1 ? "" : "s") + " to explore"}</p></div>
          <div className="flex max-w-full gap-2 overflow-x-auto scrollbar-hide pb-1"><button type="button" onClick={() => { setBrowseFilter("all"); setActiveCategory(""); }} className={"shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold " + (activeCategory === "" ? "border-[var(--text)] bg-[var(--text)] text-[var(--page)]" : "border-[var(--line)] text-[var(--muted)]")}><SlidersHorizontal className="mr-1 inline h-3.5 w-3.5" />All categories</button>{categories.map((category) => <button key={category.id} type="button" onClick={() => { setActiveCategory(category.slug); setBrowseFilter("all"); }} className={"shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold " + (activeCategory === category.slug ? "border-[var(--text)] bg-[var(--text)] text-[var(--page)]" : "border-[var(--line)] text-[var(--muted)]")}><CategoryIcon category={category} />{category.name}</button>)}</div>
        </div>
        {loading ? <div className="rounded-2xl border border-[var(--line)]"><BridgeLoader label="Finding businesses for you" /></div> : error ? <div role="alert" className="rounded-2xl border border-[var(--line)] px-5 py-16 text-center"><p className="font-display text-2xl font-semibold">Could not load businesses.</p><p className="mx-auto mt-3 max-w-lg text-sm text-[var(--muted)]">{error}</p><button type="button" onClick={search} className="mt-5 rounded-full bg-[#d6ff57] px-5 py-2.5 text-sm font-semibold text-[#11110f] hover:bg-[#ecffad]">Try again</button></div> : filteredVendors.length === 0 ? <div className="rounded-2xl border border-[var(--line)] px-5 py-16 text-center"><Search className="mx-auto h-7 w-7 text-[var(--accent-ink)]" /><p className="mt-4 font-display text-2xl font-semibold">{browseFilter === "featured" ? "No featured stores in these results" : "Nothing here yet."}</p><p className="mt-2 text-sm text-[var(--muted)]">Try another category, service, or location.</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredVendors.map((vendor) => <StoreCard key={vendor.id} vendor={vendor} featured={Boolean(vendor.is_promoted)} />)}</div>}
      </section>
      <footer className="border-t border-[var(--line)] py-6 text-center text-xs text-[var(--muted)]">Made for discovering the businesses around you.</footer>
    </main>
  </div>;
}
