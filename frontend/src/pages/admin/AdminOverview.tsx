import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/AdminLayout";
import { apiFetch } from "../../lib/api";
import {
  Store, Users, TrendingUp, Eye, Clock,
  ArrowUpRight, CheckCircle2, AlertCircle
} from "lucide-react";

interface OverviewStats {
  totalVendors: number;
  totalUsers: number;
  publishedStores: number;
  draftStores: number;
  pendingVerifications: number;
  approvedVerifications: number;
  totalListings: number;
  totalOrders: number;
  openFraudAlerts: number;
  pendingWithdrawals: number;
  completedVolumeKobo: number;
  signupsByMonth: { month: string; count: number }[];
  vendorsByCategory: { name: string; count: number }[];
  recentVendors: { id: string; business_name: string; slug: string; created_at: string; is_published: boolean }[];
}

export function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/admin/overview")
      .then((data) => setStats({
        totalVendors: Number(data.total_vendors || 0), totalUsers: Number(data.total_users || 0),
        publishedStores: Number(data.published_stores || 0), draftStores: Number(data.draft_stores || 0),
        pendingVerifications: Number(data.pending_verifications || 0), approvedVerifications: Number(data.approved_verifications || 0),
        totalListings: Number(data.total_listings || 0), totalOrders: Number(data.total_orders || 0),
        openFraudAlerts: Number(data.open_fraud_alerts || 0), pendingWithdrawals: Number(data.pending_withdrawals || 0),
        completedVolumeKobo: Number(data.completedVolumeKobo || 0), signupsByMonth: data.signupsByMonth || [],
        vendorsByCategory: data.vendorsByCategory || [], recentVendors: data.recentVendors || [],
      }))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-ink/10 border-t-signal rounded-full animate-spin" />
            <p className="text-ink/30 text-sm">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const maxSignups = Math.max(...stats.signupsByMonth.map((s) => s.count));
  const maxCategory = Math.max(...stats.vendorsByCategory.map((c) => c.count));
  const verificationRate = Math.round((stats.approvedVerifications / (stats.approvedVerifications + stats.pendingVerifications)) * 100) || 0;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2E8B72] mb-3">Overview</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink tracking-tight leading-[0.95]">
            Platform metrics.
          </h1>
          <p className="mt-3 text-ink/40 max-w-md text-base sm:text-lg">
            Real-time snapshot of how BRIDGE is performing.
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <KpiCard label="Total vendors" value={stats.totalVendors} icon={Store} color="signal" />
          <KpiCard label="Total users" value={stats.totalUsers} icon={Users} color="ink" />
          <KpiCard label="Published stores" value={stats.publishedStores} icon={Eye} color="gold" />
          <KpiCard label="Total listings" value={stats.totalListings} icon={TrendingUp} color="signal" />
          <KpiCard label="Marketplace orders" value={stats.totalOrders} icon={Clock} color="ink" />
          <KpiCard label="Sales volume" value={stats.completedVolumeKobo / 100} prefix="₦" icon={TrendingUp} color="gold" />
        </div>

        <section className="mb-8 sm:mb-10 grid sm:grid-cols-2 gap-3 sm:gap-4">
          <Link to="/admin/verifications" className="group border border-ink/10 bg-paper p-5 hover:border-[#2E8B72]/40 transition-colors"><p className="text-xs uppercase tracking-[.16em] text-ink/40">Review queue</p><div className="mt-3 flex items-end justify-between gap-4"><div><p className="font-display text-3xl font-semibold">{stats.pendingVerifications}</p><p className="text-sm text-ink/50">verification{stats.pendingVerifications === 1 ? "" : "s"} waiting</p></div><ArrowUpRight className="w-5 h-5 text-[#2E8B72] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></div></Link>
          <Link to="/admin/fraud-alerts" className="group border border-ink/10 bg-paper p-5 hover:border-[#C99A3C]/60 transition-colors"><p className="text-xs uppercase tracking-[.16em] text-ink/40">Trust & safety</p><div className="mt-3 flex items-end justify-between gap-4"><div><p className="font-display text-3xl font-semibold">{stats.openFraudAlerts}</p><p className="text-sm text-ink/50">open fraud alert{stats.openFraudAlerts === 1 ? "" : "s"}</p></div><ArrowUpRight className="w-5 h-5 text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></div></Link>
        </section>
        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {/* Signups line chart */}
          <div className="lg:col-span-2 bg-paper border border-ink/15 rounded-none border border-ink/5 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Vendor signups</h3>
                <p className="text-xs text-ink/30 mt-0.5">Monthly growth over the last 12 months</p>
              </div>
              <span className="text-xs font-mono text-ink/25 uppercase tracking-wider">Last 12 mo</span>
            </div>

            <div className="h-48 sm:h-56 relative">
              <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line key={i} x1="0" y1={i * 50} x2="800" y2={i * 50} stroke="#1A1A17" strokeOpacity="0.06" strokeWidth="1" />
                ))}

                {/* Area fill */}
                <path
                  d={`M0,200 ${stats.signupsByMonth.map((s, i) => {
                    const x = (i / (stats.signupsByMonth.length - 1)) * 800;
                    const y = 200 - (s.count / maxSignups) * 180;
                    return `L${x},${y}`;
                  }).join(" ")} L800,200 Z`}
                  fill="#33478C"
                  fillOpacity="0.08"
                />

                {/* Line */}
                <path
                  d={`M0,200 ${stats.signupsByMonth.map((s, i) => {
                    const x = (i / (stats.signupsByMonth.length - 1)) * 800;
                    const y = 200 - (s.count / maxSignups) * 180;
                    return `L${x},${y}`;
                  }).join(" ")}`}
                  fill="none"
                  stroke="#33478C"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Dots */}
                {stats.signupsByMonth.map((s, i) => {
                  const x = (i / (stats.signupsByMonth.length - 1)) * 800;
                  const y = 200 - (s.count / maxSignups) * 180;
                  return <circle key={i} cx={x} cy={y} r="4" fill="#33478C" />;
                })}
              </svg>

              {/* X-axis labels */}
              <div className="flex justify-between mt-2 px-1">
                {stats.signupsByMonth.map((s, i) => (
                  <span key={i} className="text-[10px] text-ink/25 font-mono">{s.month}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Verification donut + stats */}
          <div className="bg-paper border border-ink/15 rounded-none border border-ink/5 p-5 sm:p-6 flex flex-col">
            <h3 className="font-display text-lg font-semibold text-ink mb-1">Verification rate</h3>
            <p className="text-xs text-ink/30 mb-6">Approved vs pending documents</p>

            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-36 h-36 sm:w-40 sm:h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1A1A17" strokeOpacity="0.06" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="#C99A3C"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${verificationRate * 2.64} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl sm:text-4xl font-semibold text-ink">{verificationRate}%</span>
                  <span className="text-[10px] text-ink/30 uppercase tracking-wider mt-0.5">Approved</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-ink/5">
              <div className="text-center">
                <p className="font-display text-xl font-semibold text-ink">{stats.approvedVerifications}</p>
                <p className="text-[10px] text-ink/30 uppercase tracking-wider mt-0.5">Approved</p>
              </div>
              <div className="text-center">
                <p className="font-display text-xl font-semibold text-ink">{stats.pendingVerifications}</p>
                <p className="text-[10px] text-ink/30 uppercase tracking-wider mt-0.5">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Category bar chart */}
          <div className="bg-paper border border-ink/15 rounded-none border border-ink/5 p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold text-ink mb-1">Vendors by category</h3>
            <p className="text-xs text-ink/30 mb-6">Distribution across all business types</p>

            <div className="space-y-4">
              {stats.vendorsByCategory.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-ink/70">{cat.name}</span>
                    <span className="text-xs font-mono text-ink/40">{cat.count}</span>
                  </div>
                  <div className="w-full h-2 bg-ink/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-signal rounded-full transition-all duration-700"
                      style={{ width: `${(cat.count / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent vendors */}
          <div className="bg-paper border border-ink/15 rounded-none border border-ink/5 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Recent signups</h3>
                <p className="text-xs text-ink/30 mt-0.5">Latest stores created on the platform</p>
              </div>
              <Link
                to="/admin/vendors"
                className="text-xs text-[#2E8B72] hover:text-[#2E8B72]/80 transition-colors font-medium inline-flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
              </Link>
            </div>

            <div className="space-y-1">
              {stats.recentVendors.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between py-3 border-b border-ink/5 last:border-0 group"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/store/${v.slug}`}
                      target="_blank"
                      className="text-sm font-medium text-ink hover:text-[#2E8B72] transition-colors truncate block"
                    >
                      {v.business_name}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-ink/25" strokeWidth={2} />
                      <span className="text-[11px] text-ink/30">{v.created_at}</span>
                      {v.is_published ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#2E8B72]">
                          <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-ink/30">
                          <AlertCircle className="w-3 h-3" strokeWidth={2} />
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-ink/15 group-hover:text-[#2E8B72] transition-colors shrink-0" strokeWidth={2} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function KpiCard({ label, value, prefix = "", icon: Icon, color }: { label: string; value: number; prefix?: string; icon: any; color: "signal" | "gold" | "ink" }) {
  const bg = { signal: "bg-[#dce9df]/10", gold: "bg-gold/10", ink: "bg-ink/5" }[color];
  const text = { signal: "text-[#2E8B72]", gold: "text-gold", ink: "text-ink/60" }[color];

  return (
    <div className="bg-paper border border-ink/15 rounded-none border border-ink/5 p-5 sm:p-6 transition-colors">
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${bg} flex items-center justify-center mb-3 sm:mb-4`}>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${text}`} strokeWidth={1.5} />
      </div>
      <p className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-ink/40 mb-1">{label}</p>
      <p className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-ink">{prefix}{value.toLocaleString()}</p>
    </div>
  );
}