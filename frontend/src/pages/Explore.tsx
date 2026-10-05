import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { SignboardTag } from "../components/SignboardTag";
import { StarRating } from "../components/StarRating";
import { useAuth } from "../context/AuthContext";
import { ArrowUpRight, MapPin, MessageCircle, Moon, Navigation, Search, SlidersHorizontal, Sparkles, Star, Store, Sun, UserRound } from "lucide-react";
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

/* Every category is a market stall: its own emoji sign and awning colour. */
const categoryVisuals = [
  { match: /fashion|accessor|tailor|cloth|wear|alteration|sewing/, emoji: "👗", tint: "#d9593b" },
  { match: /electronic|tech/, emoji: "📱", tint: "#2f7fa8" },
  { match: /food|cater|beverage|restaurant/, emoji: "🍲", tint: "#e08a1e" },
  { match: /beauty|hair|personal/, emoji: "💄", tint: "#c9437f" },
  { match: /home|living|furniture/, emoji: "🏠", tint: "#5f8f3a" },
  { match: /repair|maintenance|plumb|electric/, emoji: "🛠️", tint: "#6a5bc4" },
  { match: /logistic|delivery|transport/, emoji: "🛵", tint: "#1f8f78" },
  { match: /digital/, emoji: "💻", tint: "#3f6fc0" },
  { match: /event|media|photo/, emoji: "🎉", tint: "#c99a14" },
  { match: /education|training|school/, emoji: "📚", tint: "#1f8a70" },
  { match: /auto|mobility|vehicle/, emoji: "🚗", tint: "#c4453f" },
  { match: /health|wellness|medical/, emoji: "🩺", tint: "#c93a58" },
  { match: /other services/, emoji: "🧰", tint: "#8a6a38" },
  { match: /service/, emoji: "✨", tint: "#6f8a2c" },
];
function categoryVisual(category: Category) {
  const label = (category.name + " " + category.slug).toLowerCase();
  return categoryVisuals.find((visual) => visual.match.test(label)) || { emoji: "🏪", tint: "#7a7458" };
}

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
  return parts.slice(0, 2).join(", ") || "Nigeria";
}

const blobRadii = ["58% 42% 55% 45% / 48% 56% 44% 52%", "45% 55% 42% 58% / 55% 45% 55% 45%", "52% 48% 60% 40% / 42% 58% 42% 58%", "40% 60% 48% 52% / 56% 44% 58% 42%"];
const blobVars = (i: number, j = i + 2) => ({ "--r1": blobRadii[i % 4], "--r2": blobRadii[j % 4] }) as CSSProperties;

function Wave({ fill, flip = false, className = "" }: { fill: string; flip?: boolean; className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 1440 120" preserveAspectRatio="none" className={"block h-12 w-full sm:h-24 " + className} style={flip ? { transform: "scaleY(-1)" } : undefined}><path d="M0 120V58C220 10 470 0 720 0s500 10 720 58v62z" style={{ fill }} /></svg>;
}

function CategoryBubble({ category, index }: { category: Category; index: number }) {
  const visual = categoryVisual(category);
  return <Link to={"/category/" + category.slug} className="bridge-bubble group relative flex w-[112px] flex-col items-center focus-visible:outline-none sm:w-[132px]" style={{ animationDelay: index * 55 + "ms" }}>
    <span className="relative grid h-[100px] w-[100px] place-items-center sm:h-[116px] sm:w-[116px]">
      <span aria-hidden="true" className="bridge-blob absolute -inset-2.5 bg-white/40" style={blobVars(index + 2, index)} />
      <span className="bridge-blob relative grid h-full w-full place-items-center border-[3px] border-[#11110f] group-focus-visible:ring-4 group-focus-visible:ring-white" style={{ ...blobVars(index), backgroundColor: visual.tint + "30" }}>
        <span aria-hidden="true" className="text-5xl leading-none sm:text-6xl">{visual.emoji}</span>
      </span>
    </span>
    <span className="relative -mt-4 max-w-full rounded-full border-2 border-[#11110f] bg-white px-3 py-1 text-center text-xs font-semibold leading-tight text-[#11110f] sm:text-sm">{category.name}</span>
  </Link>;
}

function BlobFeature({ emoji, back, front, title, text, to, cta, index }: { emoji: string; back: string; front: string; title: string; text: string; to: string; cta: string; index: number }) {
  return <div className="flex flex-col items-center text-center">
    <div className="relative h-60 w-60">
      <span aria-hidden="true" className="bridge-blob absolute inset-0 rotate-[16deg]" style={{ ...blobVars(index + 1, index + 3), background: back }} />
      <span aria-hidden="true" className="bridge-blob absolute inset-3 grid place-items-center text-[5.5rem] leading-none" style={{ ...blobVars(index, index + 2), background: front }}>{emoji}</span>
    </div>
    <h3 className="mt-7 font-display text-2xl font-semibold tracking-[-.04em]">{title}</h3>
    <p className="mt-3 max-w-xs text-base leading-relaxed text-[var(--muted)]">{text}</p>
    <Link to={to} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#0b6b53] px-7 text-sm font-bold text-white transition-colors hover:bg-[#09533f]">{cta}<ArrowUpRight className="h-4 w-4" /></Link>
  </div>;
}

function ExploreNavigation({ theme, onThemeChange, query, onQueryChange, city, onCityChange, onSubmit, suggestions, suggestionsOpen, onSuggestionsOpenChange, onSuggestionSelect }: ExploreNavigationProps) {
  const { user } = useAuth();
  const dark = theme === "dark";
  return <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-6">
    <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel)]/90 p-2.5 text-[var(--text)] shadow-xl shadow-black/10 backdrop-blur-xl sm:flex-nowrap sm:gap-0 sm:rounded-full sm:px-4 sm:py-2.5">
      <Link to="/" className="order-1 flex shrink-0 items-center gap-2 px-2 sm:px-3" aria-label="BRIDGE home"><img src="/logo.png" alt="" className={"h-7 w-7 object-contain " + (dark ? "invert" : "")} /><span className="font-display text-lg font-bold tracking-[-0.06em]">BRIDGE</span></Link>
      <label className="order-2 flex min-w-0 flex-1 items-center gap-2 rounded-xl border-l border-[var(--line)] px-2.5 transition-colors focus-within:bg-[var(--soft)] focus-within:ring-2 focus-within:ring-[var(--accent-ink)] sm:w-[205px] sm:flex-none sm:gap-3 sm:px-4 sm:focus-within:bg-transparent sm:focus-within:ring-0">
        <MapPin className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" /><span className="min-w-0 flex-1"><span className="hidden text-[10px] font-semibold text-[var(--muted)] sm:block">Searching in</span><input aria-label="City or state" className="w-full min-w-0 truncate bg-transparent text-xs font-medium text-[var(--text)] outline-none placeholder:text-[var(--placeholder)] sm:text-sm" placeholder="City or state" value={city} onChange={(event) => onCityChange(event.target.value)} /></span>
      </label>
      <div className="order-4 relative w-full border-t border-[var(--line)] pt-2 sm:order-3 sm:w-auto sm:min-w-[220px] sm:flex-1 sm:border-l sm:border-t-0 sm:px-3 sm:pt-0">
        <form onSubmit={onSubmit} className="flex items-center gap-2 rounded-xl border border-transparent bg-[var(--soft)] px-3 py-2 transition-colors focus-within:border-[var(--accent-ink)] sm:rounded-full sm:px-4">
          <Search className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" /><input aria-label="Search businesses or services" className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--placeholder)] sm:text-base" placeholder="Try “tailor”, “jollof”, “phone repair”" value={query} onChange={(event) => { onQueryChange(event.target.value); onSuggestionsOpenChange(true); }} onFocus={() => onSuggestionsOpenChange(true)} onBlur={() => window.setTimeout(() => onSuggestionsOpenChange(false), 120)} onKeyDown={(event) => { if (event.key === "Escape") onSuggestionsOpenChange(false); }} aria-autocomplete="list" aria-expanded={suggestionsOpen && suggestions.length > 0} />
          <button type="submit" aria-label="Search" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#d6ff57] text-[#11110f] transition-colors hover:bg-[#ecffad] sm:hidden"><ArrowUpRight className="h-4 w-4" /></button>
          <button type="submit" className="hidden shrink-0 rounded-full bg-[#d6ff57] px-5 py-2 text-xs font-bold text-[#11110f] transition-colors hover:bg-[#ecffad] sm:inline-flex">Search</button>
        </form>
        {suggestionsOpen && query.trim().length >= 1 && suggestions.length > 0 && <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto scrollbar-hide rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-1.5 shadow-2xl sm:left-3 sm:right-3">{suggestions.map((vendor) => <button key={vendor.id} type="button" role="option" aria-selected="false" onMouseDown={(event) => event.preventDefault()} onClick={() => onSuggestionSelect(vendor)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[var(--soft)]"><span className="shrink-0">{vendor.logo_url ? <img src={vendor.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#d6ff57]/25 text-sm font-semibold text-[var(--accent-ink)]">{vendor.business_name.charAt(0)}</span>}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{vendor.business_name}</span><span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{[formatPlace(vendor.city, vendor.state) === "Nigeria" && !vendor.city && !vendor.state ? "" : formatPlace(vendor.city, vendor.state), vendor.category_name].filter(Boolean).join(" · ") || "Location not listed"}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 opacity-45" /></button>)}</div>}
      </div>
      <div className="order-3 ml-auto flex shrink-0 items-center gap-1.5 sm:order-4 sm:ml-0 sm:gap-2">{user ? <><Link to="/messages" aria-label="Messages" className="hidden h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--text)] sm:inline-flex"><MessageCircle className="h-4 w-4" /></Link><Link to="/profile" aria-label="Your profile" title={user.full_name || user.email} className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--soft)] px-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--line)]"><UserRound className="h-4 w-4" /><span className="hidden max-w-24 truncate sm:inline">{user.full_name || "Profile"}</span></Link></> : <Link to="/signup" aria-label="Create an account" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#d6ff57] px-2.5 text-xs font-bold text-[#11110f] hover:bg-[#ecffad] sm:px-4"><UserRound className="h-4 w-4" /><span>Create account</span></Link>}<button onClick={onThemeChange} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] text-[var(--accent-ink)] transition-colors hover:bg-[var(--soft)]" aria-label={"Switch to " + (dark ? "light" : "dark") + " theme"}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button></div>
    </div>
  </header>;
}

function StoreCard({ vendor, featured = false }: { vendor: Vendor; featured?: boolean }) {
  const imageCandidates = [vendor.storefront_cover_url, vendor.cover_image_url, vendor.image_url].filter((url, index, all): url is string => Boolean(url) && all.indexOf(url) === index);
  const [imageIndex, setImageIndex] = useState(0);
  const cover = imageCandidates[imageIndex] || null;
  const place = formatPlace(vendor.city, vendor.state);
  const visual = categoryVisual({ id: "", name: vendor.category_name || "", slug: "" });
  const isNew = vendor.verification_status === "unverified";
  const logoOnCover = Boolean(cover && vendor.logo_url);

  return <Link to={"/store/" + vendor.slug} className={"group flex min-w-0 flex-col overflow-hidden rounded-[1.6rem] border bg-[var(--panel)] p-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ff57] " + (featured ? "border-[#d6ff57] sm:col-span-2" : "border-[var(--line)] hover:border-[#9abf31]/60")}>
    <div className={"relative isolate overflow-hidden rounded-[1.2rem] " + (featured ? "h-48 sm:h-60" : "h-40")} style={cover ? undefined : { background: "linear-gradient(135deg, " + visual.tint + "40, " + visual.tint + "18)" }}>
      {cover ? (
        <>
          <img src={cover} alt={vendor.business_name + " storefront"} loading="lazy" onError={() => setImageIndex((index) => Math.min(index + 1, imageCandidates.length))} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
        </>
      ) : vendor.logo_url ? (
        <div className="grid h-full place-items-center">
          <img src={vendor.logo_url} alt={vendor.business_name + " logo"} loading="lazy" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} className="h-24 w-24 rounded-3xl border-4 border-white/80 bg-white object-cover shadow-lg transition-transform duration-500 group-hover:scale-105" />
        </div>
      ) : (
        <div className="grid h-full place-items-center">
          <span aria-hidden="true" className="absolute -right-2 -top-3 text-8xl opacity-20">{visual.emoji}</span>
          <span className="font-display text-7xl font-semibold" style={{ color: visual.tint }}>{vendor.business_name.charAt(0).toUpperCase()}</span>
        </div>
      )}

      {featured && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#d6ff57] px-3 py-1 text-xs font-bold text-[#11110f] shadow-sm"><Sparkles className="h-3 w-3" />Featured</span>}
      {vendor.distance_km != null && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#11110f] shadow-sm"><Navigation className="h-3 w-3" />{vendor.distance_km < 1 ? "<1 km" : vendor.distance_km + " km"}</span>}
      {logoOnCover && <img src={vendor.logo_url!} alt="" loading="lazy" className="absolute bottom-3 left-3 h-16 w-16 rounded-2xl border-[3px] border-white bg-white object-cover shadow-lg" />}
      <span className={"absolute bottom-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-md " + (logoOnCover ? "right-3 max-w-[calc(100%-6.5rem)] " : "right-3 max-w-[calc(100%-1.5rem)] ") + (cover ? "bg-black/40 text-white" : "bg-white/80 text-[#11110f]")}><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{place}</span></span>
    </div>

    <div className="flex flex-1 flex-col px-3 pb-3 pt-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-semibold leading-tight tracking-[-.03em]">{vendor.business_name}</h3>
          {vendor.category_name && <p className="mt-1 inline-flex items-center gap-1.5 truncate text-xs font-semibold text-[var(--accent-ink)]"><span aria-hidden="true">{visual.emoji}</span>{vendor.category_name}</p>}
        </div>
        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>

      <p className="mt-3 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-[var(--muted)]">{vendor.description || "No description yet."}</p>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[var(--line)] pt-3.5">
        <SignboardTag color={isNew ? "signal" : "gold"}>{isNew ? "New" : "Verified"}</SignboardTag>
        {vendor.avg_rating !== null && vendor.review_count > 0
          ? <div className="flex items-center gap-1.5"><StarRating value={vendor.avg_rating} size="sm" /><span className="text-xs text-[var(--muted)]">{vendor.avg_rating.toFixed(1)} ({vendor.review_count})</span></div>
          : <span className="text-xs text-[var(--muted)]">No reviews yet</span>}
      </div>
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
    ? { "--page": "#0f0f0d", "--panel": "#181815", "--text": "#f4f0e6", "--muted": "rgba(255,255,255,.66)", "--placeholder": "rgba(255,255,255,.55)", "--accent-ink": "#c4ee66", "--line": "rgba(255,255,255,.14)", "--soft": "#24241f", "--softText": "#f4f0e6", "--mint": "#15231f" }
    : { "--page": "#fbf8f0", "--panel": "#ffffff", "--text": "#11110f", "--muted": "#575d58", "--placeholder": "#707771", "--accent-ink": "#4f670b", "--line": "#e3dfd2", "--soft": "#f3efe3", "--softText": "#11110f", "--mint": "#dff0ea" }) as CSSProperties;

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
  const activeName = categories.find((category) => category.slug === activeCategory)?.name;
  const filteredVendors = vendors.filter((vendor) => browseFilter !== "featured" || Boolean(vendor.is_promoted)).slice().sort((a, b) => browseFilter === "rated" ? (b.avg_rating ?? -1) - (a.avg_rating ?? -1) : (Number(Boolean(b.is_promoted)) - Number(Boolean(a.is_promoted))));
  const filterChip = (filter: BrowseFilter, label: string, icon: ReactNode) => <button type="button" onClick={() => setBrowseFilter(filter)} aria-pressed={browseFilter === filter} className={"inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors " + (browseFilter === filter ? "bg-[var(--text)] text-[var(--page)]" : "text-[var(--text)] hover:bg-[var(--line)]")}>{icon}{label}</button>;
  const railChip = (active: boolean, to: string, emoji: string, label: string, key?: string) => <Link key={key} to={to} aria-current={active ? "page" : undefined} className={"inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors " + (active ? "border-[#d6ff57] bg-[#d6ff57] text-[#11110f]" : "border-[var(--line)] bg-[var(--panel)] text-[var(--text)] hover:border-[#9abf31]")}><span aria-hidden="true" className="text-base leading-none">{emoji}</span>{label}</Link>;

  return <div style={themeStyle} className="min-h-screen bg-[var(--page)] font-body text-[var(--text)] transition-colors duration-300">
    <style>{`
      @keyframes bridge-pop { from { opacity: 0; transform: translateY(18px) scale(.6); } to { opacity: 1; transform: none; } }
      .bridge-bubble { animation: bridge-pop .55s cubic-bezier(.3,1.4,.5,1) both; }
      .bridge-blob { border-radius: var(--r1); transition: border-radius .7s ease, transform .4s ease; }
      .bridge-bubble:hover .bridge-blob, .bridge-bubble:focus-visible .bridge-blob { border-radius: var(--r2); transform: rotate(-5deg) scale(1.06); }
      @media (prefers-reduced-motion: reduce) { .bridge-bubble { animation: none; } .bridge-blob { transition: none; } .bridge-bubble:hover .bridge-blob { transform: none; } }
    `}</style>
    <ExploreNavigation theme={theme} onThemeChange={toggleTheme} query={q} onQueryChange={setQ} city={city} onCityChange={setCity} onSubmit={handleSubmit} suggestions={suggestions} suggestionsOpen={suggestionsOpen} onSuggestionsOpenChange={setSuggestionsOpen} onSuggestionSelect={selectSuggestion} />

    {desktopCategoryHub && <main className="min-h-[calc(100vh-5rem)]">
      <section className="relative bg-[#d6ff57] text-[#11110f]">
        <div className="mx-auto max-w-[1100px] px-4 pb-6 pt-32 text-center sm:px-8 sm:pt-36">
          <h1 className="mx-auto max-w-3xl font-display text-5xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl xl:text-7xl">Find the people who do the work.</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#11110f]/75 sm:text-lg">Tailors, caterers, fixers and makers near you. Pick what you need.</p>
          <div className="mt-14 flex flex-wrap justify-center gap-x-3 gap-y-10 sm:gap-x-7">{categories.map((category, index) => <CategoryBubble key={category.id} category={category} index={index} />)}</div>
          <Link to="/stores" className="mt-12 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#11110f] px-7 text-sm font-bold text-white hover:bg-[#2b2b27]"><Store className="h-4 w-4" />Browse all stores</Link>
        </div>
        <Wave fill="var(--page)" className="mt-4 -mb-px" />
      </section>

      <section className="relative">
        <Wave fill="var(--mint)" className="-mb-px -mt-6 sm:-mt-10" />
        <div className="bg-[var(--mint)] px-4 pb-20 sm:px-8">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center"><span aria-hidden="true" className="bridge-blob mx-auto grid h-20 w-20 place-items-center bg-[#0b6b53] text-4xl" style={blobVars(0)}>🤝</span><h2 className="mt-6 font-display text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Let’s grow local together</h2></div>
            <div className="mt-14 grid gap-14 md:grid-cols-3">
              <BlobFeature index={0} emoji="🧭" back="#0b6b53" front="#d6ff57" title="Find a store" text="Search by what you need or where you are, and see who’s nearby." to="/stores" cta="Browse stores" />
              <BlobFeature index={1} emoji="🏪" back="#0b6b53" front="#f7bd4a" title="Sell on BRIDGE" text="Open a free storefront and put your work in front of people searching for it." to="/become-vendor" cta="Become a vendor" />
              <BlobFeature index={2} emoji="💬" back="#0b6b53" front="#f6cbd0" title="See how it works" text="Message a business, agree the job, and leave a review when it’s done." to="/how-it-works" cta="Learn more" />
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div><Link to="/explore" className="font-display text-xl font-bold tracking-[-.06em]">BRIDGE</Link><p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted)]">Good work deserves to be found. Find local businesses and the people behind them.</p></div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[var(--muted)]"><Link className="transition-colors hover:text-[var(--text)]" to="/explore">Explore</Link><Link className="transition-colors hover:text-[var(--text)]" to="/how-it-works">How it works</Link><Link className="transition-colors hover:text-[var(--text)]" to="/about">About BRIDGE</Link><Link className="transition-colors hover:text-[var(--text)]" to="/privacy">Privacy &amp; terms</Link></nav>
        </div>
        <p className="mt-7 border-t border-[var(--line)] pt-5 text-xs text-[var(--muted)]">© {new Date().getFullYear()} BRIDGE. Supporting local businesses across Nigeria.</p>
      </footer>
    </main>}

    <main className={"mx-auto max-w-[1440px] px-4 pb-16 pt-32 sm:px-6 sm:pt-28 lg:px-10 " + (desktopCategoryHub ? "hidden" : "")}>
      <header className="relative mb-6 overflow-hidden rounded-[2rem] bg-[#d6ff57] px-6 py-8 text-[#11110f] sm:px-10 sm:py-10">
        <span aria-hidden="true" className="bridge-blob absolute -right-10 -top-14 h-60 w-60 bg-white/40" style={blobVars(0)} />
        <span aria-hidden="true" className="bridge-blob absolute -bottom-10 right-40 hidden h-32 w-32 bg-[#11110f]/10 sm:block" style={blobVars(1)} />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-sm text-[#11110f]/70"><Link to="/explore" className="font-semibold text-[#11110f] hover:underline">{city || "Explore"}</Link><span aria-hidden="true">›</span><span>{activeName || "Stores"}</span></nav>
            <h1 className="font-display text-4xl font-semibold tracking-[-.05em] sm:text-5xl">{activeName || "All stores"}</h1>
          </div>
          <p className="rounded-full border-2 border-[#11110f] bg-white px-4 py-1.5 text-sm font-semibold">{loading ? "Finding stores…" : filteredVendors.length + (filteredVendors.length === 1 ? " store" : " stores")}</p>
        </div>
      </header>

      <nav aria-label="Browse by category" className="-mx-4 mb-5 flex snap-x gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-2 sm:mx-0 sm:px-0">
        {railChip(!activeCategory, "/stores", "🏬", "All stores")}
        {categories.map((category) => railChip(activeCategory === category.slug, "/category/" + category.slug, categoryVisual(category).emoji, category.name, category.id))}
      </nav>

      <section aria-label="Store filters" className="mb-8 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide rounded-full bg-[var(--soft)] p-1">{filterChip("all", "All", <SlidersHorizontal className="h-3.5 w-3.5" />)}{filterChip("featured", "Featured", <Sparkles className="h-3.5 w-3.5" />)}{filterChip("rated", "Top rated", <Star className="h-3.5 w-3.5" />)}</div>
        <button type="button" onClick={findNearby} aria-pressed={Boolean(userLocation)} className={"inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors " + (userLocation ? "border-[#d6ff57] bg-[#d6ff57] text-[#11110f]" : "border-[var(--line)] bg-[var(--panel)] text-[var(--text)] hover:border-[#9abf31]")}><Navigation className="h-3.5 w-3.5" />{userLocation ? "Sorted by distance" : "Near me"}</button>
        {locationMessage && <span className="text-xs text-[var(--muted)]" role="status">{locationMessage}</span>}
      </section>

      <section>
        {loading ? <div className="rounded-3xl border border-[var(--line)]"><BridgeLoader label="Finding businesses for you" /></div> : error ? <div role="alert" className="rounded-3xl border border-[var(--line)] px-5 py-16 text-center"><p className="font-display text-2xl font-semibold">Could not load businesses.</p><p className="mx-auto mt-3 max-w-lg text-sm text-[var(--muted)]">{error}</p><button type="button" onClick={search} className="mt-5 rounded-full bg-[#d6ff57] px-6 py-2.5 text-sm font-semibold text-[#11110f] hover:bg-[#ecffad]">Try again</button></div> : filteredVendors.length === 0 ? <div className="rounded-3xl border border-dashed border-[var(--line)] px-5 py-16 text-center"><span aria-hidden="true" className="text-4xl">🪧</span><p className="mt-4 font-display text-2xl font-semibold">{browseFilter === "featured" ? "No featured stores in these results" : "This stall is empty."}</p><p className="mt-2 text-sm text-[var(--muted)]">Try another category, a different search, or a nearby city.</p><Link to="/stores" className="mt-5 inline-flex rounded-full bg-[var(--text)] px-6 py-2.5 text-sm font-semibold text-[var(--page)]">Browse all stores</Link></div> : <div className="grid grid-flow-dense gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredVendors.map((vendor) => <StoreCard key={vendor.id} vendor={vendor} featured={Boolean(vendor.is_promoted)} />)}</div>}
      </section>
      <footer className="mt-12 border-t border-[var(--line)] py-6 text-center text-xs text-[var(--muted)]">Made for discovering the businesses around you.</footer>
    </main>
  </div>;
}