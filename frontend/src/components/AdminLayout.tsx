import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FileCheck2, LayoutDashboard, LogOut, Menu, Search, Settings, ShieldAlert, Store, X, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLink } from "./BrandLink";

const navItems = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Verifications", path: "/admin/verifications", icon: FileCheck2 },
  { label: "Vendors", path: "/admin/vendors", icon: Store },
  { label: "Fraud alerts", path: "/admin/fraud-alerts", icon: ShieldAlert },
  { label: "Returns & refunds", path: "/admin/returns", icon: RotateCcw },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCurrent = (path: string) => path === "/admin" ? location.pathname === path || location.pathname === "/admin/overview" : location.pathname === path || location.pathname.startsWith(path + "/");
  const currentTitle = navItems.find((item) => isCurrent(item.path))?.label || "Admin";
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="admin-theme min-h-screen bg-[#11110f] text-[#f1eee7] font-body">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-ink/10 bg-[#171714]/95 backdrop-blur sticky top-0 z-40">
        <BrandLink />
        <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle admin menu" aria-expanded={mobileOpen} className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-ink/60">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 overflow-y-auto bg-[#171714] text-[#f1eee7] pt-20 px-5 pb-8">
          <Link to="/explore" onClick={() => setMobileOpen(false)} className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold"><Search className="h-4 w-4" />Open marketplace</Link><nav aria-label="Admin navigation" className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isCurrent(item.path) ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-xl text-base font-medium transition ${
                  isCurrent(item.path) ? "bg-[#d6ff57] text-[#11110f] font-semibold" : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="inline-flex items-center gap-3"><item.icon className="h-4 w-4 shrink-0" />{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-8 pt-6 border-t border-white/10">
            <button onClick={logout} className="inline-flex items-center gap-2 text-sm text-paper/65 hover:text-paper transition-colors">
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
              Log out
            </button>
          </div>
        </div>
      )}

      <style>{`.admin-theme .bg-paper,.admin-theme .bg-white{background:#171714}.admin-theme .text-ink{color:#f1eee7}.admin-theme [class*="text-ink/"]{color:rgba(241,238,231,.6)}.admin-theme [class*="border-ink/"]{border-color:rgba(255,255,255,.15)}.admin-theme .input-field{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.16);color:#f1eee7}`}</style><div className="hidden lg:flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-72 bg-[#171714] text-[#f1eee7] border-r border-white/15 flex flex-col px-6 py-8 sticky top-0 h-screen">
          <style>{`
            .sidebar-grain {
              background: transparent url('data:image/svg+xml,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.03"/></svg>');
            }
          `}</style>
          <div className="sidebar-grain absolute inset-0 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            <BrandLink tone="paper" className="mb-1 opacity-90" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold mb-3">Admin</p><Link to="/explore" className="mb-7 inline-flex items-center gap-2 text-xs text-white/45 transition-colors hover:text-[#d6ff57]"><Search className="h-3.5 w-3.5" />Open marketplace</Link>

            <nav aria-label="Admin navigation" className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = isCurrent(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={isActive ? "page" : undefined}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#d6ff57] text-[#11110f] font-semibold"
                        : "text-white/65 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="inline-flex items-center gap-3"><item.icon className="h-4 w-4 shrink-0" />{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/10">
              <button onClick={logout} className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                Log out
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 sm:p-8 xl:p-12 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile main */}
      <main className="lg:hidden px-5 py-6 pb-24">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/45">BRIDGE · Admin</p><p className="mt-1 truncate text-sm font-semibold">{currentTitle}</p></div>
          <Link to="/explore" className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold"><Search className="h-3.5 w-3.5" />Explore</Link>
        </div>
        {children}
      </main>
    </div>
  );
}
