import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/AdminLayout";
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
  signupsByMonth: { month: string; count: number }[];
  vendorsByCategory: { name: string; count: number }[];
  recentVendors: { id: string; business_name: string; slug: string; created_at: string; is_published: boolean }[];
}

export function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fallback mock data if endpoint doesn't exist yet — swap for real API call
    const mock: OverviewStats = {
      totalVendors: 124,
      totalUsers: 342,
      publishedStores: 89,
      draftStores: 35,
      pendingVerifications: 12,
      approvedVerifications: 156,
      totalListings: 412,
      signupsByMonth: [
        { month: "Jan", count: 8 }, { month: "Feb", count: 12 },
        { month: "Mar", count: 18 }, { month: "Apr", count: 15 },
        { month: "May", count: 22 }, { month: "Jun", count: 28 },
        { month: "Jul", count: 24 }, { month: "Aug", count: 32 },
        { month: "Sep", count: 38 }, { month: "Oct", count: 45 },
        { month: "Nov", count: 41 }, { month: "Dec", count: 48 },
      ],
      vendorsByCategory: [
        { name: "Tailoring", count: 28 }, { name: "Electrical", count: 19 },
        { name: "Fashion", count: 22 }, { name: "Catering", count: 15 },
        { name: "Mechanics", count: 12 }, { name: "Photography", count: 14 },
        { name: "Hair & Beauty", count: 20 }, { name: "Home Repairs", count: 10 },
      ],
      recentVendors: [
        { id: "1", business_name: "David's Fashion House", slug: "davids-fashion", created_at: "2 hours ago", is_published: true },
        { id: "2", business_name: "Amina Catering", slug: "amina-catering", created_at: "5 hours ago", is_published: false },
        { id: "3", business_name: "Emeka Electricals", slug: "emeka-electricals", created_at: "1 day ago", is_published: true },
        { id: "4", business_name: "Chioma Tailoring", slug: "chioma-tailoring", created_at: "2 days ago", is_published: true },
      ],
    };

    // Replace with: apiFetch("/admin/overview").then((data) => setStats(data))
    setTimeout(() => {
      setStats(mock);
      setLoading(false);
    }, 600);
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Overview</p>
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
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {/* Signups line chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-ink/5 p-5 sm:p-6">
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
          <div className="bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 flex flex-col">
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
          <div className="bg-white rounded-2xl border border-ink/5 p-5 sm:p-6">
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
          <div className="bg-white rounded-2xl border border-ink/5 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">Recent signups</h3>
                <p className="text-xs text-ink/30 mt-0.5">Latest stores created on the platform</p>
              </div>
              <Link
                to="/admin/vendors"
                className="text-xs text-signal hover:text-signal/80 transition-colors font-medium inline-flex items-center gap-1"
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
                      className="text-sm font-medium text-ink hover:text-signal transition-colors truncate block"
                    >
                      {v.business_name}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-ink/25" strokeWidth={2} />
                      <span className="text-[11px] text-ink/30">{v.created_at}</span>
                      {v.is_published ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-signal">
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
                  <ArrowUpRight className="w-4 h-4 text-ink/15 group-hover:text-signal transition-colors shrink-0" strokeWidth={2} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: "signal" | "gold" | "ink" }) {
  const bg = { signal: "bg-signal/10", gold: "bg-gold/10", ink: "bg-ink/5" }[color];
  const text = { signal: "text-signal", gold: "text-gold", ink: "text-ink/60" }[color];

  return (
    <div className="bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${bg} flex items-center justify-center mb-3 sm:mb-4`}>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${text}`} strokeWidth={1.5} />
      </div>
      <p className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-ink/40 mb-1">{label}</p>
      <p className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-ink">{value.toLocaleString()}</p>
    </div>
  );
}