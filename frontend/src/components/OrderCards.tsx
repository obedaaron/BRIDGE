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
  refunded: "bg-ink/5 text-ink/50",
  rejected: "bg-ink/5 text-ink/50",
  cancelled: "bg-ink/5 text-ink/50",
  disputed: "bg-signal/20 text-ink",
};

function formatStatus(status: string) { return status.replaceAll("_", " "); }

export function OrderCards({ orders, vendorView }: { orders: MarketplaceOrder[]; vendorView: boolean }) {
  if (orders.length === 0) return <div className="text-center py-16 border border-ink/10 rounded-2xl bg-white"><ClipboardList className="w-7 h-7 text-ink/20 mx-auto mb-3" strokeWidth={1.5} /><p className="text-ink/50 font-medium">No BRIDGE orders yet.</p><p className="text-ink/30 text-sm mt-1">Accepted deals from chat will appear here.</p></div>;

  return <div className="grid gap-3 sm:gap-4">
    {orders.map((order) => <Link key={order.id} to={`/messages/${order.conversation_id}`} className="group bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-lg hover:border-ink/10 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.18em] text-ink/35 mb-2">{vendorView ? order.buyer_name || "Customer" : order.vendor_name}</p><h2 className="font-display text-lg sm:text-xl font-semibold text-ink truncate">{order.title}</h2>{order.description && <p className="text-sm text-ink/45 mt-1 line-clamp-1">{order.description}</p>}</div>
        <span className={`shrink-0 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${statusClasses[order.status] || "bg-ink/5 text-ink/50"}`}>{formatStatus(order.status)}</span>
      </div>
      <div className="mt-5 pt-4 border-t border-ink/5 flex items-center justify-between gap-3"><div><p className="font-mono font-medium text-ink">{order.currency === "NGN" ? "₦" : ""}{((vendorView ? Number(order.amount_kobo) : Number(order.buyer_total_kobo || order.amount_kobo)) / 100).toLocaleString()}</p><p className="text-xs text-ink/30 mt-1">{vendorView ? "Your protected payout" : "Buyer total"} · Created {new Date(order.created_at).toLocaleDateString()}</p></div><span className="text-xs text-ink/35 group-hover:text-signal transition-colors inline-flex items-center gap-1">Open chat <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} /></span></div>
    </Link>)}
  </div>;
}
