import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiFetch } from "../../lib/api";
import { DashboardLayout } from "../../components/DashboardLayout";
import { SignboardTag } from "../../components/SignboardTag";
import { ArrowUpRight, Package, Trash2, Plus, X, Loader2 } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description: string | null;
  type: string;
  price: number | null;
  is_active: boolean;
  image_url: string | null;
  stock_quantity: number | null;
}

interface Category {
  id: string;
  name: string;
}

export function Listings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "product", price: "", categoryId: "", imageUrl: "", stockQuantity: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function loadListings() {
    apiFetch("/listings/mine").then((data) => setListings(data.listings)).catch(() => setListings([]));
  }

  useEffect(() => {
    loadListings();
    apiFetch("/categories").then((data) => setCategories(data.categories));
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch("/listings", {
        method: "POST",
      body: JSON.stringify({ ...form, price: form.price ? Number(form.price) : null, stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : null }),
      });
      setForm({ title: "", description: "", type: "product", price: "", categoryId: "", imageUrl: "", stockQuantity: "" });
      setShowForm(false);
      loadListings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this listing?")) return;
    await apiFetch(`/listings/${id}`, { method: "DELETE" });
    loadListings();
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Inventory</p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink tracking-tight leading-[0.95]">
              Listings.
            </h1>
            <p className="mt-3 text-ink/40 max-w-md">
              Manage what you sell. Add products or services to your storefront.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className={`inline-flex items-center gap-2 font-medium px-5 py-2.5 rounded-full text-sm transition-colors shrink-0 ${
              showForm
                ? "bg-ink/5 text-ink border border-ink/10 hover:bg-ink/10"
                : "bg-ink text-paper hover:bg-ink/90"
            }`}
          >
            {showForm ? (
              <>
                <X className="w-4 h-4" strokeWidth={2} />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" strokeWidth={2} />
                Add listing
              </>
            )}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-ink/5 p-6 sm:p-8 mb-8 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-ink mb-5">New listing</h3>
            {error && (
              <div className="bg-signal/10 border border-signal/20 rounded-xl px-4 py-3 mb-5">
                <p className="text-signal text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Title</label>
                <input
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink placeholder:text-ink/20 outline-none focus:border-signal/50 focus:bg-ink/[0.07] transition-all"
                  placeholder="e.g. Ankara Gown"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Product image URL</label>
                <input className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink placeholder:text-ink/20 outline-none focus:border-signal/50" placeholder="https://…" type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Stock quantity</label>
                <input className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink placeholder:text-ink/20 outline-none focus:border-signal/50" placeholder="Leave blank for services" type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Description</label>
                <textarea
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink placeholder:text-ink/20 outline-none focus:border-signal/50 focus:bg-ink/[0.07] transition-all resize-none"
                  placeholder="Describe what you're offering..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Type</label>
                <select
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink outline-none focus:border-signal/50 focus:bg-ink/[0.07] transition-all appearance-none"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Price (NGN)</label>
                <input
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink placeholder:text-ink/20 outline-none focus:border-signal/50 focus:bg-ink/[0.07] transition-all"
                  placeholder="25000"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.2em] text-ink/40 mb-2">Category</label>
                <select
                  className="w-full bg-ink/5 border border-ink/10 rounded-xl px-5 py-4 text-ink outline-none focus:border-signal/50 focus:bg-ink/[0.07] transition-all appearance-none"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="mt-6 bg-ink text-paper font-medium px-6 py-3 rounded-xl hover:bg-ink/90 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
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
                  Save listing <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Listings grid */}
        {listings.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 text-ink/20" strokeWidth={1.5} />
            </div>
            <p className="text-ink/40 font-medium mb-1">No listings yet</p>
            <p className="text-ink/30 text-sm">Add your first product or service above.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {listings.map((l) => (
              <div key={l.id} className="bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold text-ink truncate">{l.title}</h3>
                    {l.price && (
                      <p className="font-mono text-sm text-ink/60 mt-1">₦{l.price.toLocaleString()}</p>
                    )}
                  </div>
                  <SignboardTag color={l.type === "service" ? "gold" : "signal"}>{l.type}</SignboardTag>
                </div>

                {l.stock_quantity !== null && <p className="text-xs text-ink/35 mb-3">{l.stock_quantity} in stock</p>}

                {l.description && (
                  <p className="text-sm text-ink/50 line-clamp-2 leading-relaxed mb-4">{l.description}</p>
                )}

                <button
                  onClick={() => handleDelete(l.id)}
                  className="inline-flex items-center gap-1.5 text-xs text-ink/30 hover:text-signal transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
