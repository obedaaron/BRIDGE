import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "../../components/DashboardLayout";
import { apiFetch } from "../../lib/api";
import { Check, Loader2 } from "lucide-react";

type Plan = { tier: "free" | "standard" | "premium"; amountKobo: number; currency?: string; label: string; listingLimit: number | null; promotionLimit: number | null; customization: string };
const fallbackPlans: Plan[] = [
  { tier: "free", amountKobo: 0, currency: "NGN", label: "Free", listingLimit: 10, promotionLimit: 0, customization: "Basic storefront" },
  { tier: "standard", amountKobo: 450000, currency: "NGN", label: "Standard", listingLimit: 50, promotionLimit: 2, customization: "Expanded storefront" },
  { tier: "premium", amountKobo: 800000, currency: "NGN", label: "Premium", listingLimit: null, promotionLimit: null, customization: "Full storefront" },
];
const planPrice = (plan: Plan) => new Intl.NumberFormat("en-US", { style: "currency", currency: plan.currency || "USD", maximumFractionDigits: 0 }).format(plan.amountKobo / 100);
export function Plans() {
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans); const [tier, setTier] = useState("free"); const [error, setError] = useState(""); const [loading, setLoading] = useState<string | null>(null); const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    apiFetch("/subscriptions/plans").then((data) => setPlans(data.plans)).catch((err) => setError(err.message));
    apiFetch("/subscriptions/mine").then((data) => setTier(data.tier || "free")).catch((err) => setError((current) => current || err.message));
  }, []);
  useEffect(() => { const reference = searchParams.get("reference"); if (reference) apiFetch(`/subscriptions/verify/${reference}`).then((data) => { setTier(data.subscription.tier); setSearchParams({}); }).catch((err) => setError(err.message)); }, [searchParams, setSearchParams]);
  async function choose(selected: "standard" | "premium") { setError(""); setLoading(selected); try { const data = await apiFetch("/subscriptions/checkout", { method: "POST", body: JSON.stringify({ tier: selected }) }); window.location.assign(data.authorizationUrl); } catch (err: any) { setError(err.message); setLoading(null); } }
  return <DashboardLayout><div className="max-w-5xl mx-auto"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Store plan</p><h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">Grow on BRIDGE.</h1><p className="mt-3 text-ink/45 max-w-2xl">All prices are in naira and billed monthly through Paystack. Paid plans renew automatically using Paystack’s supported recurring-payment methods.</p>{error && <p className="mt-5 text-sm text-signal">{error}</p>}<div className="grid md:grid-cols-3 gap-5 mt-9">{plans.map((plan) => <div key={plan.tier} className={`bg-white rounded-2xl border p-6 ${tier === plan.tier ? "border-signal ring-1 ring-signal/20" : "border-ink/10"}`}><p className="font-display text-2xl font-semibold">{plan.label}</p><p className="font-mono text-2xl mt-4">{planPrice(plan)}</p><p className="text-xs text-ink/40 mt-1">per month</p><ul className="mt-6 space-y-3 text-sm text-ink/60"><li className="flex gap-2"><Check className="w-4 h-4 text-signal" />{plan.listingLimit === null ? "Unlimited product listings" : `Up to ${plan.listingLimit} listings`}</li><li className="flex gap-2"><Check className="w-4 h-4 text-signal" />{plan.promotionLimit === null ? "Unlimited active marketplace boosts" : plan.promotionLimit ? `${plan.promotionLimit} active marketplace boosts` : "No marketplace boosts"}</li><li className="flex gap-2"><Check className="w-4 h-4 text-signal" />{plan.customization}</li><li className="flex gap-2"><Check className="w-4 h-4 text-signal" />Protected BRIDGE payments</li></ul>{plan.tier === "free" ? <p className="mt-7 text-sm text-ink/40">{tier === "free" ? "Current plan" : "Available after cancelling paid plan"}</p> : <button onClick={() => choose(plan.tier as "standard" | "premium")} disabled={loading !== null || tier === plan.tier} className="mt-7 w-full bg-ink text-paper rounded-xl py-3 text-sm disabled:opacity-50">{loading === plan.tier ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : tier === plan.tier ? "Current plan" : `Choose ${plan.label}`}</button>}</div>)}</div></div></DashboardLayout>;
}
