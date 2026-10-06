import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { SignboardTag } from "../components/SignboardTag";
import { useAuth } from "../context/AuthContext";
import { ArrowUpRight, MapPin, MessageCircle, Moon, Navigation, Search, SlidersHorizontal, Sparkles, Star, Sun, UserRound } from "lucide-react";
import { useBridgeTheme } from "../lib/theme";
import { BridgeLoader } from "../components/BridgeLoader";
import { BottomNavIllustration } from "../components/BottomNavIllustration";
import { useCart } from "../context/CartContext";

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

/* Photos: hand-picked Pexels shots where noted, keyword-matched Flickr photos elsewhere.
   To swap any image, replace its `photo` value with your own URL. Broken images fall back to the emoji gradient. */
const pexels = (id: number) => "https://images.pexels.com/photos/" + id + "/pexels-photo-" + id + ".jpeg?auto=compress&cs=tinysrgb&w=900";
const flickr = (tags: string, lock: number) => "https://loremflickr.com/900/1100/" + tags + "?lock=" + lock;

/* Every category is a market stall: its own photo, emoji sign and awning colour. */
const categoryVisuals = [
  { match: /tailor|alteration|sewing/, emoji: "🧵", tint: "#d9593b", photo: pexels(3814588) },
  { match: /fashion|accessor|cloth|wear/, emoji: "👗", tint: "#d9593b", photo: flickr("fashion,boutique", 11) },
  { match: /electronic|tech/, emoji: "📱", tint: "#2f7fa8", photo: flickr("smartphone,electronics", 12) },
  { match: /food|cater|beverage|restaurant/, emoji: "🍲", tint: "#e08a1e", photo: flickr("rice,stew,food", 13) },
  { match: /hair/, emoji: "💇", tint: "#c9437f", photo: flickr("hairsalon,hairstylist", 14) },
  { match: /beauty|personal/, emoji: "💄", tint: "#c9437f", photo: flickr("makeup,beauty", 15) },
  { match: /home|living|furniture/, emoji: "🏠", tint: "#5f8f3a", photo: flickr("interior,livingroom", 16) },
  { match: /repair|maintenance|plumb|electric/, emoji: "🛠️", tint: "#6a5bc4", photo: flickr("tools,workshop", 17) },
  { match: /logistic|delivery|transport/, emoji: "🛵", tint: "#1f8f78", photo: flickr("delivery,motorcycle", 18) },
  { match: /digital/, emoji: "💻", tint: "#3f6fc0", photo: flickr("laptop,coding", 19) },
  { match: /event|media|photo/, emoji: "🎉", tint: "#c99a14", photo: flickr("party,celebration", 20) },
  { match: /education|training|school/, emoji: "📚", tint: "#1f8a70", photo: flickr("classroom,students", 21) },
  { match: /auto|mobility|vehicle/, emoji: "🚗", tint: "#c4453f", photo: pexels(10490611) },
  { match: /health|wellness|medical/, emoji: "🩺", tint: "#c93a58", photo: flickr("doctor,stethoscope", 22) },
  { match: /other services/, emoji: "🧰", tint: "#8a6a38", photo: flickr("toolbox,handyman", 23) },
  { match: /service/, emoji: "✨", tint: "#6f8a2c", photo: flickr("small,business", 24) },
];
function categoryVisual(category: Category) {
  const label = (category.name + " " + category.slug).toLowerCase();
  return categoryVisuals.find((visual) => visual.match.test(label)) || { emoji: "🏪", tint: "#7a7458", photo: flickr("market,shop", 25) };
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


function ExploreBottomNav() {
  const location = useLocation();
  const { items } = useCart();
  const [openMenu, setOpenMenu] = useState<"store" | "cart" | "profile" | null>(null);
  useEffect(() => setOpenMenu(null), [location.pathname]);

  const isActive = (paths: string[]) => paths.some((path) => location.pathname === path || location.pathname.startsWith(path + "/"));
  const menuItems = openMenu === "store"
    ? [{ label: "Vendor dashboard", to: "/dashboard" }, { label: "Create a storefront", to: "/become-vendor" }, { label: "Manage listings", to: "/dashboard/listings" }]
    : openMenu === "cart"
      ? [{ label: "Shopping cart", to: "/cart" }, { label: "My orders", to: "/orders" }]
      : [{ label: "Profile", to: "/profile" }, { label: "Wallet", to: "/dashboard/wallet" }, { label: "Verification", to: "/dashboard/verification" }, { label: "Account settings", to: "/dashboard/settings" }];

  const actionClass = "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-colors";
  const inactiveClass = "text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--text)]";
  const activeClass = "text-[var(--text)]";
  const toggleMenu = (menu: "store" | "cart" | "profile") => setOpenMenu((current) => current === menu ? null : menu);

  return <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--panel)]/95 px-2 pt-2 shadow-[0_-12px_32px_rgba(0,0,0,.12)] backdrop-blur-xl lg:hidden" style={{ paddingBottom: "max(.5rem, env(safe-area-inset-bottom))" }}>
    {openMenu && <div className="absolute inset-x-3 bottom-[calc(100%+0.75rem)] rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-2 shadow-2xl">
      <div className="flex items-center justify-between px-3 pb-2 pt-1"><p className="text-xs font-semibold text-[var(--muted)]">{openMenu === "store" ? "Your storefront" : openMenu === "cart" ? "Cart & orders" : "Your account"}</p><button type="button" onClick={() => setOpenMenu(null)} aria-label="Close navigation menu" className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--soft)]"><span aria-hidden="true">×</span></button></div>
      {menuItems.map((item) => <Link key={item.to} to={item.to} className="flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-medium hover:bg-[var(--soft)]"><span>{item.label}</span><ArrowUpRight className="h-4 w-4 text-[var(--muted)]" /></Link>)}
    </div>}
    <div className="mx-auto grid max-w-xl grid-cols-6 gap-1">
      <Link to="/" aria-current={location.pathname === "/" ? "page" : undefined} className={actionClass + " " + (location.pathname === "/" ? activeClass : inactiveClass)}><BottomNavIllustration name="home" active={location.pathname === "/"} /><span className="text-[10px] leading-none">Home</span></Link>
      <Link to="/stores" aria-current={isActive(["/stores", "/category"]) ? "page" : undefined} className={actionClass + " " + (isActive(["/stores", "/category"]) ? activeClass : inactiveClass)}><BottomNavIllustration name="explore" active={isActive(["/stores", "/category"])} /><span className="text-[10px] leading-none">Explore</span></Link>
      <button type="button" aria-expanded={openMenu === "store"} onClick={() => toggleMenu("store")} className={actionClass + " " + (openMenu === "store" || isActive(["/dashboard"]) ? activeClass : inactiveClass)}><BottomNavIllustration name="store" active={openMenu === "store" || isActive(["/dashboard"])} /><span className="text-[10px] leading-none">Store</span></button>
      <button type="button" aria-expanded={openMenu === "cart"} onClick={() => toggleMenu("cart")} className={actionClass + " " + (openMenu === "cart" || isActive(["/cart", "/orders"]) ? activeClass : inactiveClass)}><BottomNavIllustration name="cart" active={openMenu === "cart" || isActive(["/cart", "/orders"])} />{items.length > 0 && <span className="absolute right-2 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#d6ff57] px-1 text-[9px] text-[#11110f]">{items.length}</span>}<span className="text-[10px] leading-none">Cart</span></button>
      <Link to="/messages" aria-current={location.pathname.startsWith("/messages") ? "page" : undefined} className={actionClass + " " + (isActive(["/messages"]) ? activeClass : inactiveClass)}><BottomNavIllustration name="messages" active={isActive(["/messages"])} /><span className="text-[10px] leading-none">Messages</span></Link>
      <button type="button" aria-expanded={openMenu === "profile"} onClick={() => toggleMenu("profile")} className={actionClass + " " + (openMenu === "profile" || isActive(["/profile"]) ? activeClass : inactiveClass)}><BottomNavIllustration name="profile" active={openMenu === "profile" || isActive(["/profile"])} /><span className="text-[10px] leading-none">Profile</span></button>
    </div>
  </nav>;
}
function ExploreNavigation({ theme, onThemeChange, query, onQueryChange, city, onCityChange, onSubmit, suggestions, suggestionsOpen, onSuggestionsOpenChange, onSuggestionSelect }: ExploreNavigationProps) {
  const { user } = useAuth();
  const dark = theme === "dark";
  return <header className="absolute inset-x-0 top-0 z-50 px-0 sm:fixed sm:inset-x-0 sm:top-3 sm:px-6">
    <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 rounded-b-[1.5rem] rounded-t-none border-x-0 border-b border-t-0 border-[var(--line)] bg-[var(--panel)]/95 px-3 pb-3 pt-[max(.5rem,env(safe-area-inset-top))] text-[var(--text)] shadow-lg shadow-black/10 backdrop-blur-xl sm:flex-nowrap sm:gap-0 sm:rounded-full sm:border sm:px-4 sm:py-2.5">
      <Link to="/" className="order-1 flex shrink-0 items-center gap-2 px-2 sm:px-3" aria-label="BRIDGE home"><img src="/logo.png" alt="" className={"h-7 w-7 object-contain " + (dark ? "invert" : "")} /><span className="font-display text-lg font-bold tracking-[-0.06em]">BRIDGE</span></Link>
      <label className="order-2 flex min-w-0 flex-1 items-center gap-2 rounded-full border border-transparent bg-[var(--soft)] px-2.5 py-2 transition-colors focus-within:bg-[var(--soft)] focus-within:ring-2 focus-within:ring-[var(--accent-ink)] sm:w-[205px] sm:flex-none sm:gap-3 sm:rounded-none sm:border-0 sm:border-l sm:border-[var(--line)] sm:bg-transparent sm:px-4 sm:py-0 sm:focus-within:bg-transparent sm:focus-within:ring-0">
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
  const hasReviews = vendor.avg_rating !== null && vendor.review_count > 0;

  return <Link to={"/store/" + vendor.slug} className={"flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] border bg-[var(--panel)] p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6ff57] sm:rounded-[1.6rem] sm:p-2 " + (featured ? "border-[#d6ff57]/60 sm:col-span-2" : "border-[var(--line)]")}>
    <div className={"relative isolate aspect-[1.9/1] overflow-hidden rounded-[1.1rem] sm:aspect-auto sm:rounded-[1.2rem] " + (featured ? "sm:h-60" : "sm:h-40")} style={cover ? undefined : { background: "linear-gradient(135deg, " + visual.tint + "40, " + visual.tint + "18)" }}>
      {cover ? <>
        <img src={cover} alt={vendor.business_name + " storefront"} loading="lazy" onError={() => setImageIndex((index) => Math.min(index + 1, imageCandidates.length))} className="h-full w-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-black/10" />
      </> : vendor.logo_url ? <div className="grid h-full place-items-center"><img src={vendor.logo_url} alt={vendor.business_name + " logo"} loading="lazy" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} className="h-20 w-20 rounded-2xl border-4 border-white/80 bg-white object-cover shadow-lg sm:h-24 sm:w-24 sm:rounded-3xl" /></div> : <div className="grid h-full place-items-center"><span aria-hidden="true" className="absolute -right-2 -top-3 text-8xl opacity-20">{visual.emoji}</span><span className="font-display text-7xl font-semibold" style={{ color: visual.tint }}>{vendor.business_name.charAt(0).toUpperCase()}</span></div>}
      {featured && <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white backdrop-blur-md"><Sparkles className="h-3 w-3 text-[#d6ff57]" />Featured</span>}
      {vendor.distance_km != null && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-[#11110f] shadow-sm"><Navigation className="h-3 w-3" />{vendor.distance_km < 1 ? "<1 km" : vendor.distance_km + " km"}</span>}
      {logoOnCover && <img src={vendor.logo_url!} alt="" loading="lazy" className="absolute bottom-3 left-3 h-12 w-12 rounded-xl border-2 border-white bg-white object-cover shadow-lg sm:h-16 sm:w-16 sm:rounded-2xl" />}
      <span className={"absolute bottom-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-md " + (logoOnCover ? "right-3 max-w-[calc(100%-5.5rem)]" : "right-3 max-w-[calc(100%-1.5rem)]")}><MapPin className="h-3 w-3 shrink-0 text-[#d6ff57]" /><span className="truncate">{place}</span></span>
    </div>

    <div className="flex min-w-0 flex-col px-2.5 pb-2.5 pt-3 sm:px-3 sm:pb-3 sm:pt-3.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[17px] font-semibold leading-tight tracking-[-.035em] sm:text-lg">{vendor.business_name}</h3>
          {vendor.category_name && <p className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate text-xs font-medium text-[var(--muted)]"><span aria-hidden="true" className="text-sm">{visual.emoji}</span><span className="truncate">{vendor.category_name}</span></p>}
        </div>
        <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--soft)] text-[var(--text)]"><ArrowUpRight className="h-4 w-4" /></span>
      </div>
      <p className="mt-2 hidden line-clamp-2 text-sm leading-relaxed text-[var(--muted)] sm:block">{vendor.description || "No description yet."}</p>
      <div className="mt-2.5 flex min-w-0 items-center gap-3 border-t border-[var(--line)]/70 pt-2.5 sm:mt-3.5 sm:pt-3.5">
        {hasReviews ? <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold"><Star className="h-4 w-4 shrink-0 fill-[#f3bd45] text-[#f3bd45]" /><span>{vendor.avg_rating!.toFixed(1)}</span><span className="truncate font-normal text-[var(--muted)]">({vendor.review_count} reviews)</span></span> : <span className="min-w-0 truncate text-xs text-[var(--muted)]">No reviews yet</span>}
        <span className="ml-auto shrink-0"><SignboardTag color={isNew ? "signal" : "gold"}>{isNew ? "New" : "Verified"}</SignboardTag></span>
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
  useEffect(() => { setQ(searchParams.get("q") ?? ""); setCity(searchParams.get("city") ?? ""); setActiveCategory(routeParams.slug ?? searchParams.get("category") ?? ""); }, [location.pathname, location.search, routeParams.slug, searchParams]);
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

  const activeName = categories.find((category) => category.slug === activeCategory)?.name;
  const filteredVendors = vendors.filter((vendor) => browseFilter !== "featured" || Boolean(vendor.is_promoted)).slice().sort((a, b) => browseFilter === "rated" ? (b.avg_rating ?? -1) - (a.avg_rating ?? -1) : (Number(Boolean(b.is_promoted)) - Number(Boolean(a.is_promoted))));
  const filterChip = (filter: BrowseFilter, label: string, icon: ReactNode) => <button type="button" onClick={() => setBrowseFilter(filter)} aria-pressed={browseFilter === filter} className={"inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:py-2.5 " + (browseFilter === filter ? "bg-[var(--text)] text-[var(--page)]" : "text-[var(--text)] hover:bg-[var(--line)]")}>{icon}{label}</button>;
  const railChip = (active: boolean, to: string, emoji: string, label: string, key?: string) => <Link key={key} to={to} aria-current={active ? "page" : undefined} className={"inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors " + (active ? "border-[#d6ff57] bg-[#d6ff57] text-[#11110f]" : "border-[var(--line)] bg-[var(--panel)] text-[var(--text)] hover:border-[#9abf31]")}><span aria-hidden="true" className="text-base leading-none">{emoji}</span>{label}</Link>;

  return <div style={themeStyle} className="min-h-screen bg-[var(--page)] font-body text-[var(--text)] transition-colors duration-300">
    <style>{`
      .bridge-blob { border-radius: var(--r1); transition: border-radius .7s ease, transform .4s ease; }
      @media (prefers-reduced-motion: reduce) { .bridge-blob { transition: none; } }
    `}</style>
    <ExploreNavigation theme={theme} onThemeChange={toggleTheme} query={q} onQueryChange={setQ} city={city} onCityChange={setCity} onSubmit={handleSubmit} suggestions={suggestions} suggestionsOpen={suggestionsOpen} onSuggestionsOpenChange={setSuggestionsOpen} onSuggestionSelect={selectSuggestion} />

    <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-[calc(9rem+env(safe-area-inset-top))] sm:px-6 sm:pt-28 lg:px-10">
      <header className="relative mb-6 overflow-hidden rounded-[2rem] bg-[#d6ff57] px-4 py-6 text-[#11110f] sm:px-10 sm:py-10">
        <span aria-hidden="true" className="bridge-blob absolute -right-10 -top-14 h-60 w-60 bg-white/40" style={blobVars(0)} />
        <span aria-hidden="true" className="bridge-blob absolute -bottom-10 right-40 hidden h-32 w-32 bg-[#11110f]/10 sm:block" style={blobVars(1)} />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-sm text-[#11110f]/70"><Link to="/explore" className="font-semibold text-[#11110f] hover:underline">{city || "Explore"}</Link><span aria-hidden="true">›</span><span>{activeName || "Stores"}</span></nav>
            <h1 className="font-display text-3xl font-semibold tracking-[-.05em] sm:text-5xl">{activeName || "All stores"}</h1>
          </div>
          <p className="rounded-full border-2 border-[#11110f] bg-white px-4 py-1.5 text-sm font-semibold">{loading ? "Finding stores…" : filteredVendors.length + (filteredVendors.length === 1 ? " store" : " stores")}</p>
        </div>
      </header>

      <nav aria-label="Browse by category" className="-mx-4 mb-5 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scrollbar-hide px-4 pb-2 sm:mx-0 sm:gap-2.5 sm:snap-none sm:overflow-visible sm:px-0">
        {railChip(!activeCategory, "/stores", "🏬", "All stores")}
        {categories.map((category) => railChip(activeCategory === category.slug, "/category/" + category.slug, categoryVisual(category).emoji, category.name, category.id))}
      </nav>

      <section aria-label="Store filters" className="-mx-4 mb-6 flex flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain scrollbar-hide px-4 pb-1 sm:mx-0 sm:mb-8 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--soft)] p-1">{filterChip("all", "All", <SlidersHorizontal className="h-3.5 w-3.5" />)}{filterChip("featured", "Featured", <Sparkles className="h-3.5 w-3.5" />)}{filterChip("rated", "Top rated", <Star className="h-3.5 w-3.5" />)}</div>
        <button type="button" onClick={findNearby} aria-pressed={Boolean(userLocation)} className={"inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors sm:py-2.5 " + (userLocation ? "border-[#d6ff57] bg-[#d6ff57] text-[#11110f]" : "border-[var(--line)] bg-[var(--panel)] text-[var(--text)] hover:border-[#9abf31]")}><Navigation className="h-3.5 w-3.5" />{userLocation ? "Sorted by distance" : "Near me"}</button>
        {locationMessage && <span className="text-xs text-[var(--muted)]" role="status">{locationMessage}</span>}
      </section>

      <section>
        {loading ? <div className="rounded-3xl border border-[var(--line)]"><BridgeLoader label="Finding businesses for you" /></div> : error ? <div role="alert" className="rounded-3xl border border-[var(--line)] px-5 py-16 text-center"><p className="font-display text-2xl font-semibold">Could not load businesses.</p><p className="mx-auto mt-3 max-w-lg text-sm text-[var(--muted)]">{error}</p><button type="button" onClick={search} className="mt-5 rounded-full bg-[#d6ff57] px-6 py-2.5 text-sm font-semibold text-[#11110f] hover:bg-[#ecffad]">Try again</button></div> : filteredVendors.length === 0 ? <div className="rounded-3xl border border-dashed border-[var(--line)] px-5 py-16 text-center"><span aria-hidden="true" className="text-4xl">🪧</span><p className="mt-4 font-display text-2xl font-semibold">{browseFilter === "featured" ? "No featured stores in these results" : "This stall is empty."}</p><p className="mt-2 text-sm text-[var(--muted)]">Try another category, a different search, or a nearby city.</p><Link to="/stores" className="mt-5 inline-flex rounded-full bg-[var(--text)] px-6 py-2.5 text-sm font-semibold text-[var(--page)]">Browse all stores</Link></div> : <div className="grid grid-flow-dense gap-7 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{filteredVendors.map((vendor) => <StoreCard key={vendor.id} vendor={vendor} featured={Boolean(vendor.is_promoted)} />)}</div>}
      </section>
    </main>
    <ExploreBottomNav />
  </div>;
}