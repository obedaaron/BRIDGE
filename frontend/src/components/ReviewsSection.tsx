import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useBridgeTheme } from "../lib/theme";
import { StarRating } from "./StarRating";
import { Loader2, MessageSquare, Star } from "lucide-react";

interface Review { id: string; rating: number; body: string | null; created_at: string; customer_name: string | null; }

export function ReviewsSection({ slug, isOwner }: { slug: string; isOwner: boolean }) {
  const { user } = useAuth();
  const { theme } = useBridgeTheme();
  const dark = theme === "dark";
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch("/reviews/" + slug);
      setReviews(data.reviews);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load reviews.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [slug]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!rating) { setError("Choose a star rating before submitting."); return; }
    setError(""); setSuccess(false); setSubmitting(true);
    try {
      await apiFetch("/reviews/" + slug, { method: "POST", body: JSON.stringify({ rating, body: body.trim() || null }) });
      setSuccess(true); setBody(""); setRating(0);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your review.");
    } finally { setSubmitting(false); }
  }

  return <section id="reviews" className="border-t border-[var(--store-line)] bg-[var(--store-page)] px-4 py-10 sm:px-8 sm:py-14">
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--store-accent-ink)]">Customer feedback</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.04em]">Reviews</h2></div><span className="rounded-full border border-[var(--store-line)] px-3 py-1.5 text-sm text-[var(--store-muted)]">{reviews.length} review{reviews.length === 1 ? "" : "s"}</span></div>

      {user && !isOwner && <form onSubmit={handleSubmit} className="mb-7 rounded-2xl border border-[var(--store-line)] bg-[var(--store-panel)] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h3 className="font-display text-xl font-semibold">Share your experience</h3><p className="mt-1 text-sm text-[var(--store-muted)]">Reviews are available to customers with a completed BRIDGE order.</p></div><StarRating value={rating} onChange={setRating} size="lg" tone={dark ? "dark" : "light"} /></div>
        <label className="mt-4 block"><span className="sr-only">Your review</span><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="What should other customers know? (optional)" rows={3} maxLength={1500} className="w-full resize-y rounded-xl border border-[var(--store-line)] bg-[var(--store-soft)] px-4 py-3 text-sm leading-relaxed text-[var(--store-text)] placeholder:text-[var(--store-muted)] outline-none transition focus:border-[var(--store-accent-ink)] focus:ring-2 focus:ring-[var(--store-accent-ink)]/20" /></label>
        {error && <p role="alert" className="mt-3 text-sm font-medium text-[var(--store-danger)]">{error}</p>}
        {success && <p role="status" className="mt-3 text-sm font-medium text-emerald-700">Thanks — your review has been posted.</p>}
        <button type="submit" disabled={submitting} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#d6ff57] px-5 py-2.5 text-sm font-bold text-[#11110f] transition-colors hover:bg-[#eaff9e] disabled:cursor-not-allowed disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}{submitting ? "Submitting…" : "Submit review"}</button>
      </form>}
      {!user && <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--store-line)] bg-[var(--store-panel)] p-5"><p className="text-sm text-[var(--store-muted)]">Bought from this store? Sign in to leave a review after your order is complete.</p><Link to="/login" className="rounded-full border border-[var(--store-line)] px-4 py-2 text-sm font-semibold hover:bg-[var(--store-soft)]">Sign in to review</Link></div>}
      {isOwner && <p className="mb-7 rounded-2xl border border-[var(--store-line)] bg-[var(--store-panel)] p-5 text-sm text-[var(--store-muted)]">Store owners can’t review their own storefront.</p>}

      {loading ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--store-muted)]"><Loader2 className="h-4 w-4 animate-spin" />Loading reviews</div> : error && reviews.length === 0 ? <div role="alert" className="rounded-2xl border border-[var(--store-line)] px-5 py-10 text-center text-sm text-[var(--store-muted)]">{error}</div> : reviews.length === 0 ? <div className="rounded-2xl border border-[var(--store-line)] bg-[var(--store-panel)] px-5 py-10 text-center"><MessageSquare className="mx-auto h-6 w-6 text-[var(--store-muted)]" /><p className="mt-3 font-semibold">No reviews yet</p><p className="mt-1 text-sm text-[var(--store-muted)]">Be the first customer to share feedback.</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reviews.map((review) => <article key={review.id} className="rounded-2xl border border-[var(--store-line)] bg-[var(--store-panel)] p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Star className="h-4 w-4 fill-amber-400 text-amber-500" /><strong className="text-sm">{review.rating}.0</strong><StarRating value={review.rating} size="sm" tone={dark ? "dark" : "light"} /></div><time className="text-xs text-[var(--store-muted)]">{new Date(review.created_at).toLocaleDateString()}</time></div>{review.body && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--store-text)]">{review.body}</p>}<p className="mt-4 border-t border-[var(--store-line)] pt-3 text-xs text-[var(--store-muted)]">{review.customer_name || "BRIDGE customer"}</p></article>)}</div>}
    </div>
  </section>;
}