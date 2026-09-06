import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { OrderCards } from "../components/OrderCards";
import type { MarketplaceOrder } from "../components/OrderCards";
import { apiFetch } from "../lib/api";

export function Orders() {
  const [orders, setOrders] = useState<MarketplaceOrder[] | undefined>(undefined);
  useEffect(() => { apiFetch("/orders/mine").then((data) => setOrders(data.orders)).catch(() => setOrders([])); }, []);
  return <div className="min-h-screen bg-paper text-ink font-body"><nav className="flex items-center gap-4 px-6 md:px-12 py-5 max-w-4xl mx-auto border-b border-ink/10"><Link to="/messages" className="text-ink/50 hover:text-ink"><ArrowLeft className="w-5 h-5" /></Link><Link to="/" className="font-display font-semibold">BRIDGE</Link></nav><main className="max-w-4xl mx-auto px-6 md:px-12 py-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Transactions</p><h1 className="font-display text-4xl font-semibold tracking-tight">My orders.</h1><p className="mt-3 text-ink/40 mb-8">Your BRIDGE deal history and protected checkout status.</p>{orders === undefined ? <p className="text-sm text-ink/40">Loading orders...</p> : <OrderCards orders={orders} vendorView={false} />}</main></div>;
}
