import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { FormEvent } from "react";
import { apiFetch } from "../lib/api";
import { DashboardLayout } from "../components/DashboardLayout";
import { SignboardTag } from "../components/SignboardTag";
import { CategorySelect } from "../components/CategorySelect";
import { LogoUpload } from "../components/LogoUpload";
import { AddressPicker } from "../components/AddressPicker";
import { NIGERIAN_STATES } from "../lib/states";
import {
  ArrowUpRight, Copy, Eye, Globe, Power, Loader2, Link2, AlertCircle
} from "lucide-react";

interface Vendor {
  id: string;
  business_name: string;
  slug: string;
  verification_status: string;
  subscription_tier: string;
  is_published: boolean;
}

interface PublishReadiness {
  canPublish: boolean;
  missing: string[];
}

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
      const data = await apiFetch("/vendors", { method: "POST", body: JSON.stringify({ ...form, lat, lng, acceptedVendorTerms }) });
      setVendor(data.vendor);
      loadPublishReadiness();
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
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-ink/20 animate-spin" strokeWidth={1.5} />
            <p className="text-ink/30 text-sm">Loading your store...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!vendor) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-5 sm:px-6 pt-6 sm:pt-10 pb-20">
          <div className="mb-8 sm:mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Onboarding</p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-ink tracking-tight leading-[0.95]">
              Create your store.
            </h1>
            <p className="mt-3 text-ink/40 max-w-md text-base sm:text-lg">
              This is what customers will see. You can edit everything later.
            </p>
          </div>

          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            {error && (
              <div className="bg-signal/10 border border-signal/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-signal shrink-0" strokeWidth={2} />
                <p className="text-signal text-sm font-medium">{error}</p>
              </div>
            )}

            <LogoUpload value={form.logoUrl} onChange={(url) => setForm({ ...form, logoUrl: url })} />

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Business name</label>
                <input
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink placeholder:text-ink/20 outline-none focus:border-signal/50 focus:bg-ink/[0.07] transition-all"
                  placeholder="e.g. David's Fashion House"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Description</label>
                <textarea
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink placeholder:text-ink/20 outline-none focus:border-signal/50 focus:bg-ink/[0.07] transition-all resize-none"
                  placeholder="Tell customers what you do..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Category</label>
                <CategorySelect value={form.categoryId} onChange={(id) => setForm({ ...form, categoryId: id })} />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Phone</label>
                <input
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink placeholder:text-ink/20 outline-none focus:border-signal/50 focus:bg-ink/[0.07] transition-all"
                  placeholder="080..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>


              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">City</label>
                <input
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink placeholder:text-ink/20 outline-none focus:border-signal/50 focus:bg-ink/[0.07] transition-all"
                  placeholder="e.g. Lagos"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">State</label>
                <select
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink outline-none focus:border-signal/50 focus:bg-ink/[0.07] transition-all appearance-none"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Location</label>
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
                  Creating...
                </>
              ) : (
                <>
                  Create store <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-signal/20 bg-signal/10 px-4 py-3 text-sm text-signal sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">{error}</p>
            <Link to="/dashboard/verification" className="shrink-0 font-semibold underline underline-offset-2">Complete verification</Link>
          </div>
        )}
        {!vendor.is_published && publishReadiness && !publishReadiness.canPublish && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-ink/10 bg-ink/[0.03] px-4 py-3 text-sm text-ink/65 sm:flex-row sm:items-center sm:justify-between">
            <p>Before publishing, complete: <span className="font-medium text-ink">{publishReadiness.missing.map((item) => item.replace(/\b\w/g, (letter) => letter.toUpperCase())).join(", ")}</span>.</p>
            <Link to="/dashboard/verification" className="shrink-0 font-semibold text-signal underline underline-offset-2">Open verification</Link>
          </div>
        )}
        <section className="border border-ink/15 bg-paper">
          <div className="grid border-b border-ink/15 md:grid-cols-[1fr_auto]">
            <div className="p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2E8B72]">Store control centre</p><div className="mt-4 flex flex-wrap items-center gap-3"><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{vendor.business_name}</h1><SignboardTag color={vendor.verification_status === "unverified" ? "signal" : "gold"}>{vendor.verification_status.replace("_", " ")}</SignboardTag></div><p className="mt-3 flex items-center gap-2 text-sm text-ink/55"><Globe className="h-4 w-4" />bridge.com/store/{vendor.slug}</p></div>
            <div className="flex flex-wrap items-center gap-2 p-6 md:border-l md:border-ink/15"><button onClick={handleTogglePublish} disabled={toggling} className={`inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold disabled:opacity-50 ${vendor.is_published ? "border border-ink/20 text-ink hover:bg-ink/5" : "bg-[#2E8B72] text-paper hover:bg-[#206653]"}`}>{toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}{toggling ? "Updating" : vendor.is_published ? "Unpublish" : "Publish store"}</button><button onClick={handleCopyLink} className="inline-flex min-h-11 items-center gap-2 border border-ink/20 px-4 text-sm font-semibold hover:bg-ink/5"><Copy className="h-4 w-4" />{copied ? "Copied" : "Copy link"}</button>{vendor.is_published && <a href={`/store/${vendor.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-[#2E8B72] hover:underline"><Eye className="h-4 w-4" />View store</a>}</div>
          </div>
          <div className="grid divide-y divide-ink/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0"><div className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">Store status</p><p className="mt-2 font-display text-2xl font-semibold">{vendor.is_published ? "Live" : "Draft"}</p><p className="mt-1 text-sm text-ink/55">{vendor.is_published ? "Customers can find your storefront." : "Complete the requirements to publish."}</p></div><div className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">Listings</p><p className="mt-2 font-display text-2xl font-semibold">{listingCount}</p><Link to="/dashboard/listings" className="mt-1 inline-flex text-sm font-semibold text-[#2E8B72] hover:underline">Manage listings</Link></div><div className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">Current plan</p><p className="mt-2 font-display text-2xl font-semibold capitalize">{vendor.subscription_tier}</p><Link to="/dashboard/plans" className="mt-1 inline-flex text-sm font-semibold text-[#2E8B72] hover:underline">View plan options</Link></div></div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border border-ink/15 bg-white p-6 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C94F36]">Next steps</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">Keep your storefront ready for customers.</h2><div className="mt-6 divide-y divide-ink/15 border-t border-ink/15"><Link to="/dashboard/listings" className="flex items-center justify-between gap-4 py-4"><span><strong className="block text-sm">Add or update listings</strong><span className="mt-1 block text-sm text-ink/55">Show customers what they can buy or book.</span></span><ArrowUpRight className="h-4 w-4 text-[#2E8B72]" /></Link><Link to="/dashboard/verification" className="flex items-center justify-between gap-4 py-4"><span><strong className="block text-sm">Review your verification</strong><span className="mt-1 block text-sm text-ink/55">Make sure your trust details are complete.</span></span><ArrowUpRight className="h-4 w-4 text-[#2E8B72]" /></Link><Link to="/dashboard/settings" className="flex items-center justify-between gap-4 py-4"><span><strong className="block text-sm">Check store details</strong><span className="mt-1 block text-sm text-ink/55">Keep your location, contact, and delivery information current.</span></span><ArrowUpRight className="h-4 w-4 text-[#2E8B72]" /></Link></div></div>
          <div className="border border-ink/15 bg-[#dce9df] p-6 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2E8B72]">Store link</p><Link2 className="mt-8 h-7 w-7 text-[#C94F36]" /><p className="mt-5 font-display text-2xl font-semibold">Share one clear address.</p><p className="mt-3 break-all text-sm leading-relaxed text-ink/65">bridge.com/store/{vendor.slug}</p><button onClick={handleCopyLink} className="mt-7 inline-flex min-h-11 items-center gap-2 bg-[#2E8B72] px-4 text-sm font-semibold text-paper hover:bg-[#206653]"><Copy className="h-4 w-4" />{copied ? "Link copied" : "Copy store link"}</button></div>
        </section>
      </div>
    </DashboardLayout>
  );
}