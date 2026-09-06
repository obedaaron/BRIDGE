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
  ArrowUpRight, Copy, Eye, Globe, Package, Power, ShieldCheck,
  Store, Loader2, TrendingUp, Link2, MapPin, AlertCircle, MessageCircle
} from "lucide-react";

interface Vendor {
  id: string;
  business_name: string;
  slug: string;
  verification_status: string;
  subscription_tier: string;
  is_published: boolean;
}

export function VendorDashboard() {
  const [vendor, setVendor] = useState<Vendor | null | undefined>(undefined);
  const [listingCount, setListingCount] = useState(0);
  const [form, setForm] = useState({
    businessName: "", description: "", phone: "", whatsapp: "", city: "", state: "",
    address: "", categoryId: "", logoUrl: "",
  });
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acceptedVendorTerms, setAcceptedVendorTerms] = useState(false);

  function loadVendor() {
    apiFetch("/vendors/me").then((data) => setVendor(data.vendor)).catch(() => setVendor(null));
  }

  useEffect(() => {
    loadVendor();
    apiFetch("/listings/mine").then((data) => setListingCount(data.listings.length)).catch(() => {});
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = await apiFetch("/vendors", { method: "POST", body: JSON.stringify({ ...form, lat, lng, acceptedVendorTerms }) });
      setVendor(data.vendor);
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
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">WhatsApp</label>
                <input
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink placeholder:text-ink/20 outline-none focus:border-signal/50 focus:bg-ink/[0.07] transition-all"
                  placeholder="080..."
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
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
        {/* Header card */}
        <div className="relative bg-ink rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 mb-6 sm:mb-8 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-signal/20 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-gold/15 rounded-full blur-3xl opacity-30" />

          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-paper tracking-tight truncate">
                    {vendor.business_name}
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-paper/40 text-sm">
                  <Globe className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">bridge.com/store/{vendor.slug}</span>
                </div>
              </div>
              <SignboardTag color={vendor.verification_status === "unverified" ? "signal" : "gold"}>
                {vendor.verification_status.replace("_", " ")}
              </SignboardTag>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={handleTogglePublish}
                disabled={toggling}
                className={`inline-flex items-center gap-1.5 sm:gap-2 font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm transition-colors disabled:opacity-50 ${
                  vendor.is_published
                    ? "bg-paper/10 text-paper border border-paper/10 hover:bg-paper/20"
                    : "bg-signal text-ink hover:bg-signal/90"
                }`}
              >
                {toggling ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.5} />
                )}
                {toggling ? "Updating..." : vendor.is_published ? "Unpublish" : "Publish store"}
              </button>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-paper text-ink font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm hover:bg-paper/90 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.5} />
                {copied ? "Copied!" : "Copy link"}
              </button>

              {vendor.is_published && (
                <a
                  href={`/store/${vendor.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 sm:gap-2 bg-transparent text-paper font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm border border-paper/20 hover:bg-paper/5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.5} />
                  View
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <div className="bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-signal/10 flex items-center justify-center mb-3 sm:mb-4">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-signal" strokeWidth={1.5} />
            </div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-ink/40 mb-1">Plan</p>
            <p className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-ink capitalize">{vendor.subscription_tier}</p>
          </div>

          <div className="bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gold/10 flex items-center justify-center mb-3 sm:mb-4">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-ink/40 mb-1">Status</p>
            <p className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-ink">{vendor.is_published ? "Live" : "Draft"}</p>
          </div>

          <div className="bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ink/5 flex items-center justify-center mb-3 sm:mb-4">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-ink/60" strokeWidth={1.5} />
            </div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-ink/40 mb-1">Listings</p>
            <p className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-ink">{listingCount}</p>
          </div>

          <div className="bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-signal/10 flex items-center justify-center mb-3 sm:mb-4">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-signal" strokeWidth={1.5} />
            </div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-ink/40 mb-1">Views</p>
            <p className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-ink">—</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          <Link
            to="/dashboard/listings"
            className="group bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ink/5 flex items-center justify-center shrink-0 group-hover:bg-signal/10 transition-colors">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-ink/40 group-hover:text-signal transition-colors" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display text-base sm:text-lg font-semibold text-ink">Manage listings</p>
                <p className="text-xs sm:text-sm text-ink/40">Add or edit products & services</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-ink/20 group-hover:text-signal group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2} />
          </Link>

          <Link
            to="/messages"
            className="group bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ink/5 flex items-center justify-center shrink-0 group-hover:bg-signal/10 transition-colors">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-ink/40 group-hover:text-signal transition-colors" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display text-base sm:text-lg font-semibold text-ink">Messages</p>
                <p className="text-xs sm:text-sm text-ink/40">Chat with customers</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-ink/20 group-hover:text-signal group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2} />
          </Link>

          <Link
            to="/dashboard/verification"
            className="group bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ink/5 flex items-center justify-center shrink-0 group-hover:bg-gold/10 transition-colors">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-ink/40 group-hover:text-gold transition-colors" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display text-base sm:text-lg font-semibold text-ink">Get verified</p>
                <p className="text-xs sm:text-sm text-ink/40">Build trust with customers</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-ink/20 group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2} />
          </Link>

          <Link
            to="/dashboard/settings"
            className="group bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ink/5 flex items-center justify-center shrink-0 group-hover:bg-ink/10 transition-colors">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-ink/40 group-hover:text-ink transition-colors" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display text-base sm:text-lg font-semibold text-ink">Store settings</p>
                <p className="text-xs sm:text-sm text-ink/40">Update details & location</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-ink/20 group-hover:text-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2} />
          </Link>

          <div className="group bg-ink rounded-2xl border border-ink/5 p-5 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-paper/10 flex items-center justify-center shrink-0">
                <Link2 className="w-5 h-5 sm:w-6 sm:h-6 text-paper/60" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display text-base sm:text-lg font-semibold text-paper">Store link</p>
                <p className="text-xs sm:text-sm text-paper/40 truncate max-w-[180px] sm:max-w-xs">bridge.com/store/{vendor.slug}</p>
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              className="text-xs sm:text-sm text-paper/40 hover:text-signal transition-colors font-medium"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
