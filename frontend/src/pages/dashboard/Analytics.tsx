import { useEffect, useState } from "react";
import { DashboardLayout } from "../../components/DashboardLayout";
import { apiFetch } from "../../lib/api";
import { BridgeLoader } from "../../components/BridgeLoader";

type Data = { summary: { views: number; orders: number; revenueKobo: number; newReviews: number; conversionRate: number }; trend: { label: string; views: number }[] };
const naira = (kobo: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);
export function Analytics() {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => { apiFetch("/analytics/vendor").then(setData).catch(() => setData(null)); }, []);
  const peak = Math.max(1, ...(data?.trend.map((item) => item.views) ?? [1]));
  return <DashboardLayout><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#2E8B72]">Store intelligence</p><h1 className="mt-3 font-display text-4xl font-semibold">Analytics.</h1><p className="mt-3 text-ink/55">Last 30 days. Store views are aggregated and do not identify visitors.</p>{!data ? <BridgeLoader label="Loading your store analytics" className="mt-6" /> : <><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["Store views", data.summary.views], ["Orders", data.summary.orders], ["Completed revenue", naira(data.summary.revenueKobo)], ["Conversion", `${data.summary.conversionRate}%`], ["New reviews", data.summary.newReviews]].map(([label, value]) => <div key={String(label)} className="border border-ink/15 bg-white p-5"><p className="text-xs uppercase tracking-[.16em] text-ink/45">{label}</p><p className="mt-3 font-display text-3xl font-semibold">{value}</p></div>)}</div><section className="mt-8 border border-ink/15 bg-white p-6"><h2 className="font-display text-2xl font-semibold">Daily storefront views</h2><div className="mt-7 flex h-44 items-end gap-2">{data.trend.map((item) => <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2"><span className="text-xs text-ink/55">{item.views}</span><div className="w-full bg-[#2E8B72]" style={{ height: `${Math.max(5, Math.round(item.views / peak * 120))}px` }} /><span className="text-[10px] text-ink/45">{item.label}</span></div>)}</div></section></>}</div></DashboardLayout>;
}