export function SignboardTag({ children, color = "gold", tone = "light" }: { children: React.ReactNode; color?: "gold" | "signal" | "ink"; tone?: "light" | "dark" }) {
  const dot = { gold: "bg-gold", signal: "bg-signal", ink: "bg-ink" }[color];
  const text = tone === "dark"
    ? { gold: "text-[#f5d787]", signal: "text-[#82d8bf]", ink: "text-white/80" }[color]
    : { gold: "text-ink/70", signal: "text-signal", ink: "text-ink/70" }[color];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${tone === "dark" ? "bg-white/10" : "bg-ink/5"} text-xs font-medium ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}