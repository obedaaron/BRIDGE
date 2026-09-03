import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}

const SIZES = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-7 h-7" };

// Read-only when onChange is omitted (e.g. showing an average rating).
// Interactive click-to-rate when onChange is passed (the review form).
export function StarRating({ value, onChange, size = "md" }: StarRatingProps) {
  const interactive = Boolean(onChange);
  const cls = SIZES[size];

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
        >
          <Star
            className={`${cls} ${n <= Math.round(value) ? "text-gold" : "text-ink/15"}`}
            strokeWidth={1.5}
            fill={n <= Math.round(value) ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}