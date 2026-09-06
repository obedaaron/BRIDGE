import { useEffect, useState } from "react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { apiFetch } from "../../lib/api";
import { Loader2, Sparkles } from "lucide-react";

type Listing = { id: string; title: string; is_active: boolean };
type Promotion = { id: string; listing_id: string; title: string; ends_at: string };
export function Promotions() {
  const [listings, setListings] = useState<Listing[]>([]); const [promotions, setPromotions] = useState<Promotion[]>([]); const [plan, setPlan] = useState<{ label: string; promotionLimit: number | null } | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState<string | null>(null);
  function load() { Promise.all([apiFetch("/listings/mine"), apiFetch("/promotions/mine")]).then(([l, p]) => { setListings(l.listings); setPromotions(p.promotions); setPlan(p.plan); }).catch((err) => setError(err.message)); }
  useEffect(() => { load(); }, []);
  async function promote(listingId: string) { setBusy(listingId); setError(""); try { await apiFetch("/promotions", { method: "POST", body: JSON.stringify({ listingId }) }); load(); } catch (err: any) { setError(err.message); } finally { setBusy(null); } }
  async function end(id: string) { setBusy(id); try { await apiFetch(`/promotions/${id}`, { method: "DELETE" }); load(); } catch (err: any) { setError(err.message); } finally { setBusy(null); } }
  return <DashboardLayout><div className="max-w-4xl mx-auto"><p className="text-xs uppercase tracking-[0.2em] text-signal font-semibold mb-3">Plan benefit</p><h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">Promotions.</h1><p className="mt-3 text-ink/45">Boost selected listings in marketplace search for 30 days. Your current plan: <strong>{plan?.label || "Loading"}</strong> · {plan?.promotionLimit === null ? "Unlimited active boosts" : `${plan?.promotionLimit || 0} active boosts`}.</p>{error && <p className="mt-5 text-sm text-signal">{error}</p>}<section className="mt-8 space-y-3">{listings.filter((l) => l.is_active).map((listing) => { const promotion = promotions.find((p) => p.listing_id === listing.id); return <div key={listing.id} className="bg-white border border-ink/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p className="font-medium">{listing.title}</p>{promotion && <p className="text-xs text-ink/40 mt-1">Promoted until {new Date(promotion.ends_at).toLocaleDateString()}</p>}</div>{promotion ? <button onClick={() => end(promotion.id)} disabled={busy !== null} className="text-sm border border-ink/15 px-4 py-2 rounded-xl">End promotion</button> : <button onClick={() => promote(listing.id)} disabled={busy !== null} className="bg-ink text-paper text-sm px-4 py-2 rounded-xl inline-flex gap-2 items-center">{busy === listing.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Promote</button>}</div>; })}</section></div></DashboardLayout>;
}
