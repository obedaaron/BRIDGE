import { Link } from "react-router-dom";
import { ArrowUpRight, ClipboardList } from "lucide-react";

export interface MarketplaceOrder {
  id: string;
  conversation_id: string;
  title: string;
  description: string | null;
  amount_kobo: number;
  buyer_total_kobo?: number;
  platform_fee_kobo?: number;
  processing_fee_kobo?: number;
  currency: string;
  status: string;
  created_at: string;
  vendor_name: string;
  buyer_name: string | null;
}

const statusClasses: Record<string, string> = {
  proposed: "bg-gold/15 text-ink",
  accepted: "bg-signal/15 text-ink",
  payment_pending: "bg-gold/15 text-ink",
  paid: "bg-signal/15 text-ink",
  in_progress: "bg-ink/10 text-ink",
  delivered: "bg-signal/15 text-ink",
  completed: "bg-signal/20 text-ink",
  refunded: "bg-ink/5 text-ink/70",
  rejected: "bg-ink/5 text-ink/70",
  cancelled: "bg-ink/5 text-ink/70",
  disputed: "bg-[#C94F36]/15 text-[#9f3826]",
};
const darkStatusClasses: Record<string, string> = {
  proposed: "bg-[#C99A3C]/20 text-[#f1d28f]",
  accepted: "bg-[#2E8B72]/25 text-[#9de0c4]",
  payment_pending: "bg-[#C99A3C]/20 text-[#f1d28f]",
  paid: "bg-[#2E8B72]/25 text-[#9de0c4]",
  in_progress: "bg-white/10 text-white/85",
  delivered: "bg-[#2E8B72]/25 text-[#9de0c4]",
  completed: "bg-[#2E8B72]/30 text-[#a9ebce]",
  refunded: "bg-white/10 text-white/65",
  rejected: "bg-white/10 text-white/65",
  cancelled: "bg-white/10 text-white/65",
  disputed: "bg-[#C94F36]/25 text-[#ffb19e]",
};
function formatStatus(status: string) { return status.replaceAll("_", " "); }

export function OrderCards({ orders, vendorView, dark }: { orders: MarketplaceOrder[]; vendorView: boolean; dark?: boolean }) {
  const card = dark === true ? "border-white/15 bg-[#171714]" : "border-ink/15 bg-white";
  const muted = dark === true ? "text-white/65" : "text-ink/65";
  const faint = dark === true ? "text-white/55" : "text-ink/55";
  if (orders.length === 0) return <div className={`rounded-2xl border p-8 text-center sm:py-16 ${card}`}><ClipboardList className={`mx-auto mb-3 h-7 w-7 ${dark === true ? "text-white/40" : "text-ink/35"}`} strokeWidth={1.5} /><p className={`font-medium ${muted}`}>No BRIDGE orders yet.</p><p className={`mt-1 text-sm ${faint}`}>Accepted deals from chat will appear here.</p></div>;

  return <div className="grid gap-3 sm:gap-4">
    {orders.map((order) => <Link key={order.id} to={`/messages/${order.conversation_id}`} className={`group rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-6 ${card} ${dark ? "hover:border-white/25 hover:bg-[#1b1b18]" : "hover:border-ink/25"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0"><p className={`mb-2 text-[10px] uppercase tracking-[0.18em] ${faint}`}>{vendorView ? order.buyer_name || "Customer" : order.vendor_name}</p><h2 className={`truncate font-display text-lg font-semibold sm:text-xl ${dark === true ? "text-[#f1eee7]" : dark === false ? "text-[#11110f]" : "text-ink"}`}>{order.title}</h2>{order.description && <p className={`mt-1 line-clamp-1 text-sm ${muted}`}>{order.description}</p>}</div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${ (dark ? darkStatusClasses : statusClasses)[order.status] || (dark ? "bg-white/10 text-white/70" : "bg-ink/5 text-ink/70")}`}>{formatStatus(order.status)}</span>
      </div>
      <div className={`mt-5 flex items-center justify-between gap-3 border-t pt-4 ${dark === true ? "border-white/15" : "border-ink/10"}`}><div><p className={`font-mono font-medium ${dark === true ? "text-[#f1eee7]" : dark === false ? "text-[#11110f]" : "text-ink"}`}>{order.currency === "NGN" ? "₦" : ""}{((vendorView ? Number(order.amount_kobo) : Number(order.buyer_total_kobo || order.amount_kobo)) / 100).toLocaleString()}</p><p className={`mt-1 text-xs ${faint}`}>{vendorView ? "Your protected payout" : "Buyer total"} · Created {new Date(order.created_at).toLocaleDateString()}</p></div><span className={`inline-flex shrink-0 items-center gap-1 text-xs transition-colors ${dark === true ? "text-white/60 group-hover:text-[#d6ff57]" : "text-ink/60 group-hover:text-signal"}`}>Open chat <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} /></span></div>
    </Link>)}
  </div>;
}

