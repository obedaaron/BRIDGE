import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { OrderCards } from "../../components/OrderCards";
import type { MarketplaceOrder } from "../../components/OrderCards";
import { apiFetch } from "../../lib/api";

export function Orders() {
  const [orders, setOrders] = useState<MarketplaceOrder[] | undefined>(undefined);
  const [filter, setFilter] = useState("all");
  useEffect(() => { apiFetch("/orders/mine").then((data) => setOrders(data.orders)).catch(() => setOrders([])); }, []);
  const visibleOrders = useMemo(() => orders?.filter((order) => filter === "all" || order.status === filter) || [], [orders, filter]);
  const filters = ["all", "proposed", "accepted", "completed"];

  return <DashboardLayout><div className="max-w-5xl mx-auto">
    <div className="mb-8 sm:mb-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Transactions</p><h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink tracking-tight leading-[0.95]">Your orders.</h1><p className="mt-3 text-ink/40 max-w-lg">Track every agreed deal created through BRIDGE chat. Payment and delivery protection will appear here when enabled.</p></div>
    <div className="flex flex-wrap gap-2 mb-6">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`text-xs px-3 py-2 rounded-full capitalize transition-colors ${filter === item ? "bg-ink text-paper" : "bg-white border border-ink/10 text-ink/50 hover:text-ink"}`}>{item}</button>)}</div>
    {orders === undefined ? <p className="text-sm text-ink/40">Loading orders...</p> : <OrderCards orders={visibleOrders} vendorView />}
  </div></DashboardLayout>;
}
