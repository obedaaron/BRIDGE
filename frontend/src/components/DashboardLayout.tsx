import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, LogOut, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { BrandLink } from "./BrandLink";

const navItems = [
  { label: "Overview", path: "/dashboard" },
  { label: "Listings", path: "/dashboard/listings" },
  { label: "Orders", path: "/dashboard/orders" },
  { label: "Plans & billing", path: "/dashboard/plans" },
  { label: "Wallet", path: "/dashboard/wallet" },
  { label: "Promotions", path: "/dashboard/promotions" },
  { label: "Messages", path: "/messages" },
  { label: "Verification", path: "/dashboard/verification" },
  { label: "Settings", path: "/dashboard/settings" },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnread = () => apiFetch("/messages/unread-count").then((data) => setUnreadCount(data.unreadCount)).catch(() => undefined);
    loadUnread();
    const timer = window.setInterval(loadUnread, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-ink/5 bg-paper sticky top-0 z-40">
        <BrandLink />
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-ink/60">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-ink text-paper pt-20 px-6 pb-8">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-xl text-base font-medium transition flex items-center gap-2 ${
                  location.pathname === item.path ? "bg-signal text-paper font-semibold" : "text-paper/60 hover:text-paper hover:bg-white/5"
                }`}
              >
                <span>{item.label}</span>{item.path === "/messages" && unreadCount > 0 && <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-signal text-ink text-[10px] flex items-center justify-center">{unreadCount > 99 ? "99+" : unreadCount}</span>}
              </Link>
            ))}
          </nav>
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-sm text-paper/40 truncate">{user?.email}</p>
            <button onClick={logout} className="mt-3 inline-flex items-center gap-2 text-sm text-paper/40 hover:text-paper transition-colors">
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
              Log out
            </button>
          </div>
        </div>
      )}

      <div className="hidden lg:flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-ink text-paper flex flex-col px-6 py-8 sticky top-0 h-screen">
          <style>{`
            .sidebar-grain {
              background: transparent url('data:image/svg+xml,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.03"/></svg>');
            }
          `}</style>
          <div className="sidebar-grain absolute inset-0 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            <BrandLink tone="paper" className="mb-1 opacity-90" />
            <Link to="/explore" className="text-xs text-paper/40 hover:text-paper mb-10 inline-flex items-center gap-1 transition-colors">
              <ArrowUpRight className="w-3 h-3 rotate-[-135deg]" strokeWidth={2} />
              Browse marketplace
            </Link>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? "bg-signal text-paper font-semibold"
                        : "text-paper/50 hover:text-paper hover:bg-white/5"
                    }`}
                  >
                    <span>{item.label}</span>{item.path === "/messages" && unreadCount > 0 && <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-signal text-ink text-[10px] flex items-center justify-center">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/10">
              <p className="text-sm text-paper/30 truncate">{user?.email}</p>
              <button onClick={logout} className="mt-3 inline-flex items-center gap-2 text-sm text-paper/30 hover:text-paper transition-colors">
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                Log out
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-10 xl:p-14 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <main className="lg:hidden px-5 py-8">
        {children}
      </main>
    </div>
  );
}
