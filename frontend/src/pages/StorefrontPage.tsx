import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { SignboardTag } from "../components/SignboardTag";
import { StarRating } from "../components/StarRating";
import { ReviewsSection } from "../components/ReviewsSection";
import {
  Phone, MessageCircle, MapPin, ArrowUpRight,
  Package, Share2, Loader2, Store
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description: string | null;
  type: string;
  price: number | null;
  currency: string;
}

interface Vendor {
  user_id: string;
  business_name: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  verification_status: string;
  logo_url: string | null;
  avg_rating: number | null;
  review_count: number;
}

export function StorefrontPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null | undefined>(undefined);
  const [listings, setListings] = useState<Listing[]>([]);
  const [copied, setCopied] = useState(false);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    apiFetch(`/store/${slug}`)
      .then((data) => {
        setVendor(data.vendor);
        setListings(data.listings);
      })
      .catch(() => setVendor(null));
  }, [slug]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleMessage() {
    if (!user) {
      navigate("/login");
      return;
    }
    setMessaging(true);
    try {
      const data = await apiFetch("/messages/conversations", {
        method: "POST",
        body: JSON.stringify({ vendorSlug: slug }),
      });
      navigate(`/messages/${data.conversation.id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMessaging(false);
    }
  }

  if (vendor === undefined) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-ink/20 animate-spin" strokeWidth={1.5} />
          <p className="text-ink/30 text-sm">Loading store...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-ink text-paper flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-paper/5 flex items-center justify-center mb-2">
          <Store className="w-7 h-7 text-paper/20" strokeWidth={1.5} />
        </div>
        <p className="font-display text-2xl sm:text-3xl font-semibold">Store not found</p>
        <p className="text-paper/40 text-sm max-w-xs text-center">This BRIDGE link doesn't lead to an active storefront.</p>
        <Link to="/explore" className="mt-2 inline-flex items-center gap-2 bg-paper text-ink font-medium px-6 py-3 rounded-full text-sm hover:bg-paper/90 transition-colors">
          Browse marketplace <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-md border-b border-ink/5">
        <div className="flex items-center justify-between px-5 sm:px-6 md:px-12 py-4 max-w-6xl mx-auto">
          <Link to="/" className="font-display text-xl font-bold text-ink tracking-tight">BRIDGE</Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink px-3 py-2 transition-colors"
            >
              <Share2 className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
            </button>
            <Link to="/explore" className="text-sm font-medium bg-ink text-paper px-4 sm:px-5 py-2.5 rounded-full hover:bg-ink/90 transition-colors">
              Explore
            </Link>
          </div>
        </div>
      </nav>

      <header className="relative bg-ink text-paper overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-signal/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-gold/15 rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-8">
            <div className="shrink-0">
              {vendor.logo_url ? (
                <img
                  src={vendor.logo_url}
                  alt={vendor.business_name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-paper/10"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-paper/10 border border-paper/10 flex items-center justify-center">
                  <span className="font-display text-3xl sm:text-4xl font-bold text-paper/40">
                    {vendor.business_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
                  {vendor.business_name}
                </h1>
                <SignboardTag color={vendor.verification_status === "unverified" ? "signal" : "gold"}>
                  {vendor.verification_status.replace("_", " ")}
                </SignboardTag>
                {vendor.avg_rating !== null && (
                  <div className="flex items-center gap-1.5">
                    <StarRating value={vendor.avg_rating} size="sm" />
                    <span className="text-paper/50 text-xs font-mono">
                      {vendor.avg_rating} ({vendor.review_count})
                    </span>
                  </div>
                )}
              </div>

              {(vendor.city || vendor.state) && (
                <div className="flex items-center gap-1.5 text-paper/40 text-sm mb-4">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{[vendor.city, vendor.state].filter(Boolean).join(", ")}</span>
                </div>
              )}

              {vendor.description && (
                <p className="text-paper/50 text-base sm:text-lg max-w-xl leading-relaxed mb-6">
                  {vendor.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 sm:gap-3">
                {vendor.phone && (
                  <a
                    href={`tel:${vendor.phone}`}
                    className="inline-flex items-center gap-1.5 sm:gap-2 bg-paper text-ink font-medium px-4 sm:px-5 py-2.5 rounded-full text-sm hover:bg-paper/90 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
                    Call
                  </a>
                )}
                {vendor.whatsapp && (
                  <a
                    href={`https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 sm:gap-2 bg-signal text-ink font-medium px-4 sm:px-5 py-2.5 rounded-full text-sm hover:bg-signal/90 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
                    WhatsApp
                  </a>
                )}
                <button
                  onClick={handleMessage}
                  disabled={messaging}
                  className="inline-flex items-center gap-1.5 sm:gap-2 border border-paper/20 text-paper font-medium px-4 sm:px-5 py-2.5 rounded-full text-sm hover:bg-paper/5 transition-colors disabled:opacity-50"
                >
                  {messaging ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
                  )}
                  Message
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 sm:gap-2 border border-paper/20 text-paper font-medium px-4 sm:px-5 py-2.5 rounded-full text-sm hover:bg-paper/5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
                  {copied ? "Copied!" : "Share"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 sm:px-6 md:px-12 py-10 sm:py-14 md:py-16">
        <div className="flex items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Inventory</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
              Products &amp; Services
            </h2>
          </div>
          <span className="text-sm text-ink/30 font-mono">{listings.length} item{listings.length !== 1 ? "s" : ""}</span>
        </div>

        {listings.length === 0 ? (
          <div className="py-16 sm:py-20 text-center bg-white rounded-2xl border border-ink/5">
            <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 text-ink/20" strokeWidth={1.5} />
            </div>
            <p className="text-ink/40 font-medium mb-1">Nothing listed yet</p>
            <p className="text-ink/30 text-sm">Check back soon for new products and services.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {listings.map((l, i) => (
              <div
                key={l.id}
                className="group bg-white rounded-2xl border border-ink/5 overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:border-ink/10 transition-all duration-300"
              >
                <div className={`w-full h-40 sm:h-48 flex items-center justify-center ${
                  i % 3 === 0 ? "bg-signal/5" : i % 3 === 1 ? "bg-gold/5" : "bg-ink/5"
                }`}>
                  <Package className={`w-8 h-8 ${
                    i % 3 === 0 ? "text-signal/20" : i % 3 === 1 ? "text-gold/20" : "text-ink/10"
                  }`} strokeWidth={1.5} />
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-display text-lg font-bold text-ink leading-tight">{l.title}</h3>
                    <SignboardTag color={l.type === "service" ? "gold" : "signal"}>{l.type}</SignboardTag>
                  </div>

                  {l.description && (
                    <p className="text-sm text-ink/50 line-clamp-2 leading-relaxed mb-3">
                      {l.description}
                    </p>
                  )}

                  {l.price ? (
                    <p className="font-mono text-base font-medium text-ink">
                      {l.currency === "USD" ? "$" : "₦"}{l.price.toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-sm text-ink/30">Price on request</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ReviewsSection slug={slug!} isOwner={user?.id === vendor.user_id} />

      <footer className="border-t border-ink/5 bg-ink/[0.02]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink/30">
            Powered by <span className="font-display font-semibold text-ink/50">BRIDGE</span>
          </p>
          <Link to="/explore" className="text-xs text-ink/30 hover:text-signal transition-colors inline-flex items-center gap-1">
            Find more vendors <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
          </Link>
        </div>
      </footer>
    </div>
  );
}