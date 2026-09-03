import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { StarRating } from "./StarRating";
import { Loader2, MessageSquare } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  customer_name: string | null;
}

export function ReviewsSection({ slug, isOwner }: { slug: string; isOwner: boolean }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function load() {
    setLoading(true);
    apiFetch(`/reviews/${slug}`)
      .then((data) => setReviews(data.reviews))
      .finally(() => setLoading(false));
  }

  useEffect(load, [slug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Pick a star rating first.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await apiFetch(`/reviews/${slug}`, {
        method: "POST",
        body: JSON.stringify({ rating, body: body.trim() || null }),
      });
      setSuccess(true);
      setBody("");
      load();
    } catch (err: any) {
      // Backend returns this exact message when the message-first gate blocks the review
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-6 md:px-12 py-10 sm:py-14">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Feedback</p>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
          Reviews
        </h2>
      </div>

      {user && !isOwner && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 mb-8">
          {success ? (
            <p className="text-sm text-ink/60">Thanks — your review is up.</p>
          ) : (
            <>
              <p className="text-sm font-medium text-ink mb-3">Leave a review</p>
              <StarRating value={rating} onChange={setRating} size="lg" />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share how it went (optional)"
                rows={3}
                className="w-full mt-4 bg-paper border border-ink/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-ink/30 transition-colors resize-none"
              />
              {error && <p className="text-signal text-sm mt-2">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="mt-3 inline-flex items-center gap-2 bg-ink text-paper font-medium px-5 py-2.5 rounded-full text-sm hover:bg-ink/90 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                Submit review
              </button>
            </>
          )}
        </form>
      )}

      {loading ? (
        <div className="py-10 text-center">
          <div className="w-6 h-6 border-2 border-ink/10 border-t-signal rounded-full animate-spin mx-auto" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-ink/5">
          <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-5 h-5 text-ink/20" strokeWidth={1.5} />
          </div>
          <p className="text-ink/40 text-sm">No reviews yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-ink/5 p-5">
              <div className="flex items-center justify-between mb-2">
                <StarRating value={r.rating} size="sm" />
                <span className="text-xs text-ink/30 font-mono">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              {r.body && <p className="text-sm text-ink/60 leading-relaxed mb-2">{r.body}</p>}
              <p className="text-xs text-ink/30">— {r.customer_name || "Anonymous"}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}