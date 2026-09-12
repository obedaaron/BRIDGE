import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { BrandLink } from "./BrandLink";

const navItems = [
  { label: "Overview", path: "/admin" },
  { label: "Verifications", path: "/admin/verifications" },
  { label: "Vendors", path: "/admin/vendors" },
  { label: "Fraud alerts", path: "/admin/fraud-alerts" },
  { label: "Settings", path: "/admin/settings" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4ede2] text-ink font-body">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-ink/10 bg-paper/95 backdrop-blur sticky top-0 z-40">
        <BrandLink />
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-ink/60">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-[#2E8B72] text-paper pt-20 px-5 pb-8">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-xl text-base font-medium transition ${
                  location.pathname === item.path ? "bg-[#E5B35C] text-ink font-semibold" : "text-paper/60 hover:text-paper hover:bg-white/10"
                }`}
              >
                {item.label}
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

      <div className="hidden lg:flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-[#2E8B72] text-paper flex flex-col px-6 py-8 sticky top-0 h-screen">
          <style>{`
            .sidebar-grain {
              background: transparent url('data:image/svg+xml,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.03"/></svg>');
            }
          `}</style>
          <div className="sidebar-grain absolute inset-0 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            <BrandLink tone="paper" className="mb-1 opacity-90" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold mb-10">Admin</p>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#E5B35C] text-ink font-semibold"
                        : "text-paper/75 hover:text-paper hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/10">
              <button onClick={logout} className="inline-flex items-center gap-2 text-sm text-paper/55 hover:text-paper transition-colors">
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
        {children}
      </main>
    </div>
  );
}
