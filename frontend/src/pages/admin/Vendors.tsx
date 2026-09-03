import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { AdminLayout } from "../../components/AdminLayout";
import { SignboardTag } from "../../components/SignboardTag";
import { Eye, Power, Store, MapPin, Loader2 } from "lucide-react";

interface Vendor {
  id: string;
  business_name: string;
  slug: string;
  city: string | null;
  state: string | null;
  verification_status: string;
  subscription_tier: string;
  is_published: boolean;
  logo_url: string | null;
}

export function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    apiFetch("/admin/vendors")
      .then((data) => setVendors(data.vendors))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function togglePublish(id: string) {
    await apiFetch(`/admin/vendors/${id}/publish`, { method: "PATCH" });
    load();
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Admin</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink tracking-tight leading-[0.95]">
                All vendors.
              </h1>
              <p className="mt-3 text-ink/40 max-w-md text-base sm:text-lg">
                Manage and review every storefront on BRIDGE.
              </p>
            </div>
            <span className="text-sm text-ink/30 font-mono">{vendors.length} vendor{vendors.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-6 h-6 text-ink/20 animate-spin mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-ink/30 text-sm">Loading vendors...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-ink/5">
            <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-4">
              <Store className="w-6 h-6 text-ink/20" strokeWidth={1.5} />
            </div>
            <p className="text-ink/40 font-medium mb-1">No vendors yet</p>
            <p className="text-ink/30 text-sm">Stores will appear here once vendors sign up.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4">
            {vendors.map((v) => (
              <div
                key={v.id}
                className="group bg-white rounded-2xl border border-ink/5 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                  {/* Avatar */}
                  <div className="shrink-0">
                    {v.logo_url ? (
                      <img
                        src={v.logo_url}
                        alt={v.business_name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-ink/5"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-ink/5 border border-ink/5 flex items-center justify-center">
                        <span className="font-display text-xl font-bold text-ink/30">
                          {v.business_name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link
                        to={`/store/${v.slug}`}
                        target="_blank"
                        className="font-display text-lg sm:text-xl font-semibold text-ink hover:text-signal transition-colors truncate"
                      >
                        {v.business_name}
                      </Link>
                      <SignboardTag color={v.verification_status === "unverified" ? "signal" : "gold"}>
                        {v.verification_status.replace("_", " ")}
                      </SignboardTag>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/35">
                      {(v.city || v.state) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" strokeWidth={2} />
                          {[v.city, v.state].filter(Boolean).join(", ")}
                        </span>
                      )}
                      <span className="font-mono text-xs uppercase tracking-wider">{v.subscription_tier}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/store/${v.slug}`}
                      target="_blank"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-ink/10 text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors"
                      title="View storefront"
                    >
                      <Eye className="w-4 h-4" strokeWidth={2} />
                    </Link>

                    <button
                      onClick={() => togglePublish(v.id)}
                      className={`inline-flex items-center gap-1.5 font-medium px-4 py-2 rounded-full text-xs sm:text-sm transition-colors ${
                        v.is_published
                          ? "bg-ink/5 text-ink border border-ink/10 hover:bg-ink/10"
                          : "bg-signal text-ink hover:bg-signal/90"
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" strokeWidth={2} />
                      {v.is_published ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}