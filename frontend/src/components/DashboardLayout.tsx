import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, LogOut, ArrowUpRight } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Overview", path: "/dashboard" },
  { label: "Listings", path: "/dashboard/listings" },
  { label: "Messages", path: "/messages" },
  { label: "Verification", path: "/dashboard/verification" },
  { label: "Settings", path: "/dashboard/settings" },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-ink/5 bg-paper sticky top-0 z-40">
        <Link to="/" className="font-display text-xl font-bold text-ink tracking-tight">BRIDGE</Link>
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
                className={`px-4 py-3 rounded-xl text-base font-medium transition ${
                  location.pathname === item.path ? "bg-signal text-paper font-semibold" : "text-paper/60 hover:text-paper hover:bg-white/5"
                }`}
              >
                {item.label}
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
            <Link to="/" className="mb-1 inline-block">
              <img src="/logo.png" alt="BRIDGE" className="h-8 invert opacity-90" />
            </Link>
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
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-signal text-paper font-semibold"
                        : "text-paper/50 hover:text-paper hover:bg-white/5"
                    }`}
                  >
                    {item.label}
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