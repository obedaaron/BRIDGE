export function SignboardTag({ children, color = "gold" }: { children: React.ReactNode; color?: "gold" | "signal" | "ink" }) {
  const dot = { gold: "bg-gold", signal: "bg-signal", ink: "bg-ink" }[color];
  const text = { gold: "text-ink/70", signal: "text-signal", ink: "text-ink/70" }[color];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink/5 text-xs font-medium ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}