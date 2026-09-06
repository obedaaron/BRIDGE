import { Link } from "react-router-dom";

export function BrandLink({ tone = "ink", to = "/", className = "" }: { tone?: "ink" | "paper"; to?: string; className?: string }) {
  const textColor = tone === "paper" ? "text-paper" : "text-ink";
  return <Link to={to} aria-label="BRIDGE home" className={`inline-flex items-center gap-2 shrink-0 ${textColor} ${className}`}>
    <img src="/logo.png" alt="" className={`h-7 w-7 object-contain ${tone === "paper" ? "invert" : ""}`} />
    <span className="font-display text-xl font-bold tracking-tight">BRIDGE</span>
  </Link>;
}
