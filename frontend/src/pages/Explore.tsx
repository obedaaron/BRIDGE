import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { SignboardTag } from "../components/SignboardTag";
import { StarRating } from "../components/StarRating";
import { useAuth } from "../context/AuthContext";
import { Search, MapPin, ArrowUpRight, Store, LogOut, MessageCircle } from "lucide-react";

interface Vendor {
  id: string;
  business_name: string;
  slug: string;
  description: string | null;
  city: string | null;
  state: string | null;
  verification_status: string;
  logo_url: string | null;
  avg_rating: number | null;
  review_count: number;
  is_promoted?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function Explore() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/categories").then((data) => setCategories(data.categories));
  }, []);

  function search() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (activeCategory) params.set("category", activeCategory);

    apiFetch(`/search?${params.toString()}`)
      .then((data) => setVendors(data.vendors))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    search();
  }

  function NavAuth() {
    const { user, logout } = useAuth();

    if (!user) {
      return (
        <div className="flex items-center gap-2 md:gap-3">
          <Link to="/login" className="text-sm font-medium text-ink/60 hover:text-ink px-3 py-2 transition-colors hidden sm:block">
            Log in
          </Link>
          <Link to="/signup" className="text-sm font-medium bg-ink text-paper px-4 md:px-5 py-2.5 rounded-full hover:bg-ink/90 transition-colors">
            Get Started
          </Link>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 md:gap-4">
        <Link to="/dashboard" className="text-sm font-medium text-ink/70 hover:text-ink p-2 sm:px-3 sm:py-2 transition-colors flex items-center gap-1.5" title={user.role === "vendor" ? "My Store" : "List Your Business"}>
          <Store className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden md:inline">{user.role === "vendor" ? "My Store" : "List Your Business"}</span>
        </Link>
        <Link to="/messages" className="text-sm font-medium text-ink/70 hover:text-ink p-2 transition-colors flex items-center gap-1.5" title="Messages">
          <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden md:inline">Messages</span>
        </Link>
        <button onClick={logout} className="text-sm text-ink/40 hover:text-signal transition-colors flex items-center gap-1.5 px-3 py-2">
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-md border-b border-ink/5">
        <div className="flex items-center justify-between px-5 sm:px-6 md:px-12 py-4 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-7 md:h-8" />
            <span className="font-display text-xl md:text-2xl font-bold text-ink tracking-tight">BRIDGE</span>
          </Link>
          <NavAuth />
        </div>
      </nav>

      {/* HERO SEARCH */}
      <div className="px-5 sm:px-6 md:px-12 pt-10 sm:pt-14 pb-8 max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Marketplace</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-ink tracking-tight leading-[0.95]">
            Find a vendor.
          </h1>
          <p className="mt-3 text-ink/40 max-w-md text-base sm:text-lg">
            Search verified businesses across Nigeria. Filter by city or category.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-white rounded-2xl border border-ink/10 p-2 shadow-sm flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 py-2.5 gap-3">
              <Search className="w-4 h-4 text-ink/30 shrink-0" strokeWidth={2} />
              <input
                className="w-full bg-transparent outline-none text-ink placeholder:text-ink/25 text-sm"
                placeholder="Search businesses..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="h-px sm:h-auto sm:w-px bg-ink/10 mx-2 sm:mx-0" />
            <div className="sm:w-44 flex items-center px-4 py-2.5 gap-3">
              <MapPin className="w-4 h-4 text-ink/30 shrink-0" strokeWidth={2} />
              <input
                className="w-full bg-transparent outline-none text-ink placeholder:text-ink/25 text-sm"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-ink text-paper font-medium px-6 py-3 rounded-xl hover:bg-ink/90 transition-colors text-sm flex items-center justify-center gap-2"
            >
              Search <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </form>

        {/* CATEGORY FILTERS */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <button onClick={() => setActiveCategory("")} className="shrink-0">
            <SignboardTag color={activeCategory === "" ? "signal" : "ink"}>All</SignboardTag>
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCategory(c.slug)} className="shrink-0">
              <SignboardTag color={activeCategory === c.slug ? "signal" : "gold"}>{c.name}</SignboardTag>
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS */}
      <div className="px-5 sm:px-6 md:px-12 pb-16 sm:pb-20 max-w-7xl mx-auto">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-ink/10 border-t-signal rounded-full animate-spin mx-auto mb-4" />
            <p className="text-ink/40 text-sm">Loading vendors...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-ink/20" strokeWidth={1.5} />
            </div>
            <p className="text-ink/40 font-medium mb-1">No vendors found</p>
            <p className="text-ink/30 text-sm">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {vendors.map((v) => (
              <Link
                key={v.id}
                to={`/store/${v.slug}`}
                className="group bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 hover:-translate-y-1 hover:shadow-xl hover:border-ink/10 transition-all duration-300 block"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {v.logo_url ? (
                      <img
                        src={v.logo_url}
                        alt={v.business_name}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-ink/5 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-ink/5 flex items-center justify-center text-ink font-display font-bold text-lg shrink-0">
                        {v.business_name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-ink text-base sm:text-lg leading-tight truncate">
                        {v.business_name}
                      </h3>
                      {(v.city || v.state) && (
                        <p className="text-[11px] text-ink/35 mt-0.5 font-mono uppercase tracking-wider truncate">
                          {[v.city, v.state].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  {v.is_promoted && <span className="text-[10px] font-semibold uppercase tracking-wider text-signal">Featured</span>}
                  <SignboardTag color={v.verification_status === "unverified" ? "signal" : "gold"}>
                    {v.verification_status === "unverified" ? "New" : "Verified"}
                  </SignboardTag>
                </div>

                {v.avg_rating !== null && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <StarRating value={v.avg_rating} size="sm" />
                    <span className="text-xs text-ink/30 font-mono">
                      {v.avg_rating} ({v.review_count})
                    </span>
                  </div>
                )}

                {v.description && (
                  <p className="text-sm text-ink/50 line-clamp-2 leading-relaxed mb-4">
                    {v.description}
                  </p>
                )}

                <div className="flex items-center gap-1 text-xs text-signal font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View storefront <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
