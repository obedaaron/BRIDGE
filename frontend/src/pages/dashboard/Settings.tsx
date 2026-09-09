import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiFetch } from "../../lib/api";
import { DashboardLayout } from "../../components/DashboardLayout";
import { CategorySelect } from "../../components/CategorySelect";
import { LogoUpload } from "../../components/LogoUpload";
import { AddressPicker } from "../../components/AddressPicker";
import { NIGERIAN_STATES } from "../../lib/states";
import { ArrowUpRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function Settings() {
  const [form, setForm] = useState({
    businessName: "", description: "", phone: "", whatsapp: "", city: "", state: "",
    address: "", categoryId: "", logoUrl: "",
  });
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [planTier, setPlanTier] = useState("free");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [storefront, setStorefront] = useState({ coverUrl: "", accentColor: "#e8d44d", layout: "classic" });
  const [savingStorefront, setSavingStorefront] = useState(false);
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [payout, setPayout] = useState({ bankCode: "", accountNumber: "" });
  const [bankSearch, setBankSearch] = useState("");
  const [savedPayout, setSavedPayout] = useState<{ bank_name: string | null; account_name: string | null; account_last4: string } | null>(null);
  const [savingPayout, setSavingPayout] = useState(false);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState("");

  function loadBanks() {
    setBanksLoading(true);
    setBanksError("");
    apiFetch("/vendors/payout-banks")
      .then((data) => setBanks(data.banks.filter((bank: { active: boolean }) => bank.active)))
      .catch((err) => setBanksError(err.message || "Could not load the bank list."))
      .finally(() => setBanksLoading(false));
  }

  useEffect(() => {
    apiFetch("/vendors/me").then((data) => {
      if (data.vendor) {
        setForm({
          businessName: data.vendor.business_name || "",
          description: data.vendor.description || "",
          phone: data.vendor.phone || "",
          whatsapp: data.vendor.whatsapp || "",
          city: data.vendor.city || "",
          state: data.vendor.state || "",
          address: data.vendor.address || "",
          categoryId: data.vendor.category_id || "",
          logoUrl: data.vendor.logo_url || "",
        });
        setDeliveryFee(String(Number(data.vendor.out_of_city_delivery_fee_kobo || 0) / 100));
        setStorefront({ coverUrl: data.vendor.storefront_cover_url || "", accentColor: data.vendor.storefront_accent_color || "#e8d44d", layout: data.vendor.storefront_layout || "classic" });
      }
    });
    apiFetch("/subscriptions/mine").then((data) => setPlanTier(data.tier || "free")).catch(() => undefined);
    apiFetch("/vendors/me/payout-account").then((data) => setSavedPayout(data.account)).catch(() => undefined);
    loadBanks();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      await apiFetch("/vendors/me", { method: "PATCH", body: JSON.stringify({ ...form, lat, lng }) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveStorefront(e: FormEvent) {
    e.preventDefault(); setError(""); setSavingStorefront(true);
    try {
      await Promise.all([
        apiFetch("/vendors/me/delivery", { method: "PATCH", body: JSON.stringify({ outOfCityDeliveryFeeNaira: Number(deliveryFee || 0) }) }),
        planTier === "free" ? Promise.resolve() : apiFetch("/vendors/me/storefront", { method: "PATCH", body: JSON.stringify(storefront) }),
      ]);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (err: any) { setError(err.message); } finally { setSavingStorefront(false); }
  }
  async function savePayoutAccount(e: FormEvent) {
    e.preventDefault(); setError("");
    if (!payout.bankCode) {
      setError("Search for and select your bank before verifying the account.");
      return;
    }
    setSavingPayout(true);
    try { const data = await apiFetch("/vendors/me/payout-account", { method: "PUT", body: JSON.stringify(payout) }); setSavedPayout(data.account); setPayout({ bankCode: "", accountNumber: "" }); setBankSearch(""); }
    catch (err: any) { setError(err.message); } finally { setSavingPayout(false); }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Settings</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink tracking-tight leading-[0.95]">
            Store settings.
          </h1>
          <p className="mt-3 text-ink/40 max-w-md text-base sm:text-lg">
            Update your business details, location, and storefront appearance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="bg-signal/10 border border-signal/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-signal shrink-0" strokeWidth={2} />
              <p className="text-signal text-sm font-medium">{error}</p>
            </div>
          )}
          {saved && (
            <div className="bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-ink shrink-0" strokeWidth={2} />
              <p className="text-ink text-sm font-medium">Changes saved successfully.</p>
            </div>
          )}

          <LogoUpload value={form.logoUrl} onChange={(url) => setForm({ ...form, logoUrl: url })} />

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Business name</label>
              <input
                className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink placeholder:text-ink/20 outline-none focus:border-signal/50 focus:bg-ink/[0.07] transition-all"
                placeholder="e.g. David's Fashion House"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
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
              <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Address & Location</label>
              <AddressPicker
                address={form.address}
                onAddressChange={(v) => setForm({ ...form, address: v })}
                lat={lat}
                lng={lng}
                onLocationChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }}
              />
              <p className="text-xs text-ink/30 mt-2">Only re-search the address above if you want to update your map pin — leaving it blank keeps your current location.</p>
            </div>
          </div>

          <button
            className="w-full sm:w-auto self-start bg-ink text-paper font-medium px-8 py-4 rounded-xl hover:bg-ink/90 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            type="submit"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                Saving...
              </>
            ) : (
              <>
                Save changes <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
              </>
            )}
          </button>
        </form>

        <section className="mt-12 pt-10 border-t border-ink/10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Delivery & storefront</p>
          <h2 className="font-display text-2xl font-semibold">Set your delivery rate and look.</h2>
          <form onSubmit={saveStorefront} className="mt-5 grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Out-of-city delivery fee (₦)</label><input type="number" min="0" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="input-field w-full" placeholder="0" /><p className="text-xs text-ink/40 mt-2">BRIDGE automatically charges ₦1,500 for delivery within your city. This fee applies outside it.</p></div>
            {planTier === "free" ? <p className="sm:col-span-2 text-sm text-ink/50 bg-ink/5 rounded-xl p-4">Your Free plan includes your logo and store details. Upgrade to Standard or Premium to add a cover, colours, and layout.</p> : <><div className="sm:col-span-2"><LogoUpload label="Store cover image" emptyLabel="No cover image" value={storefront.coverUrl} onChange={(coverUrl) => setStorefront({ ...storefront, coverUrl })} /></div><label className="text-sm text-ink/60">Accent colour<input type="color" value={storefront.accentColor} onChange={(e) => setStorefront({ ...storefront, accentColor: e.target.value })} className="block mt-2 h-11 w-full" /></label><label className="text-sm text-ink/60">Storefront layout<select value={storefront.layout} onChange={(e) => setStorefront({ ...storefront, layout: e.target.value })} className="input-field w-full mt-2"><option value="classic">Classic</option><option value="modern">Modern</option><option value="minimal">Minimal</option></select></label></>}
            <button disabled={savingStorefront} className="sm:col-span-2 w-full sm:w-auto justify-self-start bg-ink text-paper px-5 py-3 rounded-xl text-sm disabled:opacity-50">{savingStorefront ? "Saving…" : "Save delivery & storefront"}</button>
          </form>
        </section>
        <section className="mt-12 pt-10 border-t border-ink/10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Payout account</p>
          <h2 className="font-display text-2xl font-semibold">Where BRIDGE sends your earnings.</h2>
          <p className="mt-2 text-sm text-ink/45 max-w-xl">Your bank details are verified with Paystack. BRIDGE stores only the payout recipient reference and the last four account digits.</p>
          {savedPayout && <div className="mt-4 bg-ink/5 rounded-xl px-4 py-3 text-sm"><span className="font-medium">{savedPayout.bank_name || "Bank account"}</span> · {savedPayout.account_name || "Verified account"} · **** {savedPayout.account_last4}</div>}
          <form onSubmit={savePayoutAccount} className="mt-5 grid sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="sr-only" htmlFor="payout-bank-search">Search for your bank</label>
              <input
                id="payout-bank-search"
                type="text"
                autoComplete="off"
                disabled={banksLoading}
                value={bankSearch}
                onChange={(e) => { setBankSearch(e.target.value); setPayout({ ...payout, bankCode: "" }); }}
                placeholder={banksLoading ? "Loading banks…" : "Search bank (e.g. GT)"}
                className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-signal/50"
              />
              {!banksLoading && bankSearch.trim().length >= 2 && (
                <div className="absolute z-10 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-ink/10 bg-paper p-1 shadow-lg">
                  {banks.filter((bank) => bank.name.toLowerCase().includes(bankSearch.trim().toLowerCase())).slice(0, 12).map((bank) => (
                    <button key={bank.code} type="button" onClick={() => { setPayout({ ...payout, bankCode: bank.code }); setBankSearch(bank.name); }} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-ink/5 focus:bg-ink/5 focus:outline-none">
                      {bank.name}
                    </button>
                  ))}
                  {banks.filter((bank) => bank.name.toLowerCase().includes(bankSearch.trim().toLowerCase())).length === 0 && <p className="px-3 py-2.5 text-sm text-ink/45">No matching bank found.</p>}
                </div>
              )}
            </div>
            <input required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={payout.accountNumber} onChange={(e) => setPayout({ ...payout, accountNumber: e.target.value.replace(/\D/g, "") })} placeholder="10-digit account number" className="bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-signal/50" />
            {banksError && <div className="sm:col-span-2 flex flex-wrap items-center gap-3 text-sm text-signal"><p>{banksError}</p><button type="button" onClick={loadBanks} disabled={banksLoading} className="underline underline-offset-2 disabled:opacity-50">Try again</button></div>}
            <button disabled={savingPayout || banksLoading || banks.length === 0} className="sm:col-span-2 w-full sm:w-auto justify-self-start bg-ink text-paper px-5 py-3 rounded-xl text-sm disabled:opacity-50">{savingPayout ? "Verifying…" : savedPayout ? "Change payout account" : "Verify payout account"}</button>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}
