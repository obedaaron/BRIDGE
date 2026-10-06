import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { FormEvent } from "react";
import { apiFetch } from "../lib/api";
import { DashboardLayout } from "../components/DashboardLayout";
import { SignboardTag } from "../components/SignboardTag";
import { CategorySelect } from "../components/CategorySelect";
import { LogoUpload } from "../components/LogoUpload";
import { AddressPicker } from "../components/AddressPicker";
import { SearchSelect } from "../components/SearchSelect";
import { BridgeLoader } from "../components/BridgeLoader";
import { NIGERIAN_STATES } from "../lib/states";
import {
  ArrowUpRight, Check, CheckCircle2, Circle, Copy, Eye, Globe, Loader2, Package,
  Power, Settings, ShieldCheck, Sparkles, AlertCircle, Share2
} from "lucide-react";

interface Vendor {
  id: string;
  business_name: string;
  logo_url: string | null;
  slug: string;
  verification_status: string;
  subscription_tier: string;
  is_published: boolean;
}

interface PublishReadiness {
  canPublish: boolean;
  missing: string[];
}

const inputCls =
  "w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink placeholder:text-ink/20 outline-none focus:border-signal/50 focus:bg-ink/[0.07] transition-all";
const labelCls = "block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2";

export function VendorDashboard() {
  const [vendor, setVendor] = useState<Vendor | null | undefined>(undefined);
  const [listingCount, setListingCount] = useState(0);
  const [form, setForm] = useState({
    businessName: "", description: "", phone: "", city: "", state: "",
    address: "", categoryId: "", logoUrl: "",
  });
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acceptedVendorTerms, setAcceptedVendorTerms] = useState(false);
  const [publishReadiness, setPublishReadiness] = useState<PublishReadiness | null>(null);

  function loadVendor() {
    apiFetch("/vendors/me").then((data) => setVendor(data.vendor)).catch(() => setVendor(null));
  }

  function loadPublishReadiness() {
    apiFetch("/verifications/publish-readiness").then((data) => setPublishReadiness(data)).catch(() => setPublishReadiness(null));
  }

  useEffect(() => {
    loadVendor();
    loadPublishReadiness();
    apiFetch("/listings/mine").then((data) => setListingCount(data.listings.length)).catch(() => {});
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch("/vendors", { method: "POST", body: JSON.stringify({ ...form, lat, lng, acceptedVendorTerms }) });
      window.location.assign("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    setError("");
    setToggling(true);
    try {
      const data = await apiFetch("/vendors/me/publish", { method: "PATCH" });
      setVendor(data.vendor);
      loadPublishReadiness();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setToggling(false);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/store/${vendor?.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (vendor === undefined) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <BridgeLoader label="Loading your store" />
        </div>
      </DashboardLayout>
    );
  }

  /* ───────────── Onboarding (no vendor yet) ───────────── */
  if (!vendor) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-5 sm:px-6 pt-6 sm:pt-10 pb-20">
          <div className="mb-8 sm:mb-10">
            <p className="inline-flex items-center gap-2 rounded-full bg-signal/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-4">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />Onboarding
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-ink tracking-tight leading-[0.95]">
              Become a BRIDGE vendor.
            </h1>
            <p className="mt-4 text-ink/50 max-w-md text-base sm:text-lg">
              Add your business details and apply. Once submitted, you can finish setting up your dashboard.
            </p>
          </div>

          <form onSubmit={handleCreate} className="flex flex-col gap-5 rounded-3xl border border-ink/10 bg-ink/[0.02] p-5 sm:p-8">
            {error && (
              <div className="bg-signal/10 border border-signal/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-signal shrink-0" strokeWidth={2} />
                <p className="text-signal text-sm font-medium">{error}</p>
              </div>
            )}

            <LogoUpload value={form.logoUrl} onChange={(url) => setForm({ ...form, logoUrl: url })} />

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="sm:col-span-2">
                <label className={labelCls}>Business name</label>
                <input className={inputCls} placeholder="e.g. David's Fashion House" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} required />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea className={inputCls + " resize-none"} placeholder="Tell customers what you do..." rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Category</label>
                <CategorySelect value={form.categoryId} onChange={(id) => setForm({ ...form, categoryId: id })} />
              </div>

              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} placeholder="080..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>

              <div>
                <label className={labelCls}>City</label>
                <input className={inputCls} placeholder="e.g. Lagos" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>State</label>
                <SearchSelect value={form.state} onChange={(state) => setForm({ ...form, state })} options={NIGERIAN_STATES.map((state) => ({ value: state, label: state }))} placeholder="Search for a state" />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Location</label>
                <AddressPicker
                  address={form.address}
                  onAddressChange={(v) => setForm({ ...form, address: v })}
                  lat={lat}
                  lng={lng}
                  onLocationChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }}
                />
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-ink/60 cursor-pointer"><input type="checkbox" checked={acceptedVendorTerms} onChange={(e) => setAcceptedVendorTerms(e.target.checked)} className="mt-1" /><span>I agree to the <Link to="/terms" className="text-signal underline">Seller Terms</Link> and <Link to="/buyer-protection" className="text-signal underline">Buyer Protection & Disputes Policy</Link>.</span></label>

            <button
              className="w-full sm:w-auto self-start bg-ink text-paper font-medium px-8 py-4 rounded-xl hover:bg-ink/90 transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              type="submit"
              disabled={saving || !acceptedVendorTerms}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  Submitting application...
                </>
              ) : (
                <>
                  Apply and open dashboard <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        </div>
      </DashboardLayout>
    );
  }

  /* ───────────── Dashboard ───────────── */
  const verificationDone = vendor.is_published || publishReadiness?.canPublish === true;
  const steps = [
    { key: "profile", label: "Create your store profile", hint: "Your business details are saved.", done: true, to: "/dashboard/settings" },
    { key: "listings", label: "Add your first listing", hint: "Show customers what they can buy or book.", done: listingCount > 0, to: "/dashboard/listings" },
    { key: "verify", label: "Complete verification", hint: "Build trust with buyers.", done: verificationDone, to: "/dashboard/verification" },
    { key: "publish", label: "Publish your store", hint: "Make your storefront visible to customers.", done: vendor.is_published, to: "" },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);
  const missing = publishReadiness && !publishReadiness.canPublish
    ? publishReadiness.missing.map((item) => item.replace(/\b\w/g, (letter) => letter.toUpperCase()))
    : [];

  const quickActions = [
    { to: "/dashboard/listings", icon: Package, title: "Listings", text: "Add or update what you sell.", tint: "bg-[#2E8B72]/12 text-[#2E8B72]" },
    { to: "/dashboard/verification", icon: ShieldCheck, title: "Verification", text: "Keep your trust details complete.", tint: "bg-[#C94F36]/12 text-[#C94F36]" },
    { to: "/dashboard/settings", icon: Settings, title: "Store details", text: "Location, contact and delivery info.", tint: "bg-ink/8 text-ink" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-5 pb-10">
        {error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-signal/20 bg-signal/10 px-4 py-3 text-sm text-signal sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 font-medium"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>
            <Link to="/dashboard/verification" className="shrink-0 font-semibold underline underline-offset-2">Complete verification</Link>
          </div>
        )}

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-ink text-paper">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#9fbea8]/12 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#2E8B72]/18 blur-3xl" />
          <div className="relative p-6 sm:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${vendor.is_published ? "bg-[#dce9df] text-[#214b3b]" : "bg-paper/12 text-paper"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${vendor.is_published ? "bg-[#2E8B72]" : "bg-paper/60"}`} />
                {vendor.is_published ? "Live" : "Draft"}
              </span>
              <SignboardTag color={vendor.verification_status === "unverified" ? "signal" : "gold"}>{vendor.verification_status.replace("_", " ")}</SignboardTag>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-paper/15 bg-paper/10 text-paper/80 shadow-inner sm:h-16 sm:w-16">{vendor.logo_url ? <img src={vendor.logo_url} alt={vendor.business_name + ' logo'} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="font-display text-2xl font-semibold sm:text-3xl">{vendor.business_name.charAt(0).toUpperCase()}</span>}</div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-paper/55">Store control centre</p>
                <h1 className="break-words font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{vendor.business_name}</h1>
              </div>
            </div>

            <button onClick={handleCopyLink} className="group mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-paper/15 bg-paper/8 py-2 pl-4 pr-3 text-sm text-paper/80 transition-colors hover:bg-paper/14">
              <Globe className="h-4 w-4 shrink-0" />
              <span className="truncate">bridge.com/store/{vendor.slug}</span>
              <span className="ml-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper/15">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</span>
            </button>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={handleTogglePublish} disabled={toggling} className={`inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors disabled:opacity-50 ${vendor.is_published ? "border border-paper/25 text-paper hover:bg-paper/10" : "bg-[#c5d9c8] text-[#17251d] hover:bg-[#d5e4d7]"}`}>
                {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                {toggling ? "Updating" : vendor.is_published ? "Unpublish" : "Publish store"}
              </button>
              {vendor.is_published && (
                <a href={`/store/${vendor.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-6 text-sm font-semibold text-ink transition-colors hover:bg-paper/90"><Eye className="h-4 w-4" />View store</a>
              )}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink/10 bg-paper p-5">
            <div className="flex items-center justify-between"><p className="text-sm font-medium text-ink/55">Store status</p><span className={`grid h-9 w-9 place-items-center rounded-xl ${vendor.is_published ? "bg-[#2E8B72]/12 text-[#2E8B72]" : "bg-ink/8 text-ink/50"}`}><Globe className="h-4 w-4" /></span></div>
            <p className="mt-3 font-display text-3xl font-semibold">{vendor.is_published ? "Live" : "Draft"}</p>
            <p className="mt-1 text-sm text-ink/55">{vendor.is_published ? "Customers can find your storefront." : "Complete the steps below to publish."}</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-paper p-5">
            <div className="flex items-center justify-between"><p className="text-sm font-medium text-ink/55">Listings</p><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#C94F36]/12 text-[#C94F36]"><Package className="h-4 w-4" /></span></div>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{listingCount}</p>
            <Link to="/dashboard/listings" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#2E8B72] hover:underline">Manage listings <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-paper p-5">
            <div className="flex items-center justify-between"><p className="text-sm font-medium text-ink/55">Current plan</p><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#d6ff57]/60 text-[#11110f]"><Sparkles className="h-4 w-4" /></span></div>
            <p className="mt-3 font-display text-3xl font-semibold capitalize">{vendor.subscription_tier}</p>
            <Link to="/dashboard/plans" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#2E8B72] hover:underline">View plan options <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
        </section>

        {/* Setup checklist (only until the store is live) */}
        {!vendor.is_published && (
          <section className="rounded-3xl border border-ink/10 bg-paper p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Get your store ready</h2>
                <p className="mt-1 text-sm text-ink/55">{doneCount} of {steps.length} steps done</p>
              </div>
              <span className="font-display text-3xl font-semibold tabular-nums text-[#2E8B72]">{progress}%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/8"><div className="h-full rounded-full bg-[#2E8B72] transition-all duration-500" style={{ width: `${progress}%` }} /></div>

            <ul className="mt-5 divide-y divide-ink/10">
              {steps.map((step) => {
                const body = (
                  <>
                    {step.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2E8B72]" /> : <Circle className="h-5 w-5 shrink-0 text-ink/25" />}
                    <span className="min-w-0 flex-1"><strong className={`block text-sm ${step.done ? "text-ink/45 line-through decoration-ink/20" : ""}`}>{step.label}</strong><span className="mt-0.5 block text-sm text-ink/50">{step.hint}</span></span>
                    {!step.done && step.to && <ArrowUpRight className="h-4 w-4 shrink-0 text-[#2E8B72]" />}
                  </>
                );
                return <li key={step.key}>{!step.done && step.to ? <Link to={step.to} className="flex items-center gap-3 py-4 transition-colors hover:bg-ink/[0.02]">{body}</Link> : <div className="flex items-center gap-3 py-4">{body}</div>}</li>;
              })}
            </ul>

            {missing.length > 0 && (
              <div className="mt-2 flex flex-col gap-3 rounded-2xl bg-ink/[0.04] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-ink/65">Still needed to publish: <span className="font-semibold text-ink">{missing.join(", ")}</span></p>
                <Link to="/dashboard/verification" className="shrink-0 font-semibold text-[#2E8B72] underline underline-offset-2">Open verification</Link>
              </div>
            )}
          </section>
        )}

        {/* Quick actions + share */}
        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-ink/10 bg-paper p-6 sm:p-7">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Quick actions</h2>
            <p className="mt-1 text-sm text-ink/55">Keep your storefront ready for customers.</p>
            <div className="mt-5 grid gap-3">
              {quickActions.map((action) => (
                <Link key={action.to} to={action.to} className="group flex items-center gap-4 rounded-2xl border border-ink/10 p-4 transition-all hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-md hover:shadow-black/5">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${action.tint}`}><action.icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><strong className="block text-sm">{action.title}</strong><span className="mt-0.5 block text-sm text-ink/55">{action.text}</span></span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-ink/30 transition-colors group-hover:text-[#2E8B72]" />
                </Link>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-[#dce8dd] p-6 text-[#18241c] sm:p-7">
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-white/45 blur-2xl" />
            <div className="relative flex h-full flex-col">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#294a3a] text-[#e4eee5]"><Share2 className="h-5 w-5" /></span>
              <h2 className="mt-6 font-display text-2xl font-semibold leading-tight tracking-tight">Share one clear address.</h2>
              <p className="mt-3 break-all rounded-xl bg-[#294a3a]/8 px-3 py-2 text-sm font-medium">bridge.com/store/{vendor.slug}</p>
              <button onClick={handleCopyLink} className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#294a3a] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#203b2e]" style={{ marginTop: "1.75rem" }}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Link copied" : "Copy store link"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}