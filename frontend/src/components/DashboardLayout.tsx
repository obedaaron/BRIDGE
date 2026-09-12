import type { CSSProperties, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { BrandLink } from "./BrandLink";
import { useBridgeTheme } from "../lib/theme";

const navItems = [
  { label: "Overview", path: "/dashboard" }, { label: "Listings", path: "/dashboard/listings" },
  { label: "Orders", path: "/dashboard/orders" }, { label: "Plans & billing", path: "/dashboard/plans" },
  { label: "Wallet", path: "/dashboard/wallet" }, { label: "Promotions", path: "/dashboard/promotions" },
  { label: "Messages", path: "/messages" }, { label: "Verification", path: "/dashboard/verification" }, { label: "Settings", path: "/dashboard/settings" },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useBridgeTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dark = theme === "dark";
  const style = (dark ? { "--color-ink": "#f1eee7", "--color-paper": "#171714", "--dashboard-shell": "#11110f" } : { "--color-ink": "#1a1a17", "--color-paper": "#fbf7f1", "--dashboard-shell": "#f4ede2" }) as CSSProperties;
  const sidebar = dark ? "bg-[#171714] text-[#f1eee7] border-white/15" : "bg-[#e9e4da] text-[#11110f] border-[#11110f]/15";

  useEffect(() => { const loadUnread = () => apiFetch("/messages/unread-count").then((data) => setUnreadCount(data.unreadCount)).catch(() => undefined); loadUnread(); const timer = window.setInterval(loadUnread, 30_000); return () => window.clearInterval(timer); }, []);

  const navLink = (path: string) => location.pathname === path ? (dark ? "bg-[#d6ff57] text-[#11110f]" : "bg-[#11110f] text-[#f1eee7]") : (dark ? "text-white/60 hover:bg-white/8 hover:text-white" : "text-[#11110f]/60 hover:bg-[#11110f]/5 hover:text-[#11110f]");

  return <div data-dashboard-theme={theme} style={style} className={`dashboard-theme min-h-screen bg-[var(--dashboard-shell)] text-ink font-body ${dark ? "dashboard-theme-dark" : "dashboard-theme-light"}`}>
    <style>{`
      .dashboard-theme { transition: background-color .25s ease, color .25s ease; }
      .dashboard-theme :is(button, a, input, select, textarea) { transition: background-color .2s ease, border-color .2s ease, color .2s ease, box-shadow .2s ease; }
      .dashboard-theme :is(input, select, textarea):focus-visible, .dashboard-theme button:focus-visible, .dashboard-theme a:focus-visible { outline: 2px solid #d6ff57; outline-offset: 3px; }
      .dashboard-theme-dark .bg-paper { background-color: #171714; }
      .dashboard-theme-dark .bg-white { background-color: #1b1b18; }
      .dashboard-theme-dark .bg-\[\#f4ede2\] { background-color: #11110f; }
      .dashboard-theme-dark .bg-\[\#dce9df\] { background-color: #25251f; }
      .dashboard-theme-dark .text-paper { color: #f1eee7; }
      .dashboard-theme-dark .bg-ink { background-color: #d6ff57; }
      .dashboard-theme-dark .bg-ink.text-paper { color: #11110f; }
      .dashboard-theme-dark .input-field { background-color: rgba(255,255,255,.06); border-color: rgba(255,255,255,.16); color: #f1eee7; }
      .dashboard-theme-dark input::placeholder, .dashboard-theme-dark textarea::placeholder { color: rgba(255,255,255,.35); }
      .dashboard-theme-dark select option { background: #171714; color: #f1eee7; }
      .dashboard-theme-light .input-field { background-color: #fff; border-color: rgba(17,17,15,.15); }
      .dashboard-theme-light .bg-white { background-color: #fff; }
      .dashboard-theme-light [class*="shadow"] { box-shadow: 0 10px 30px rgba(17,17,15,.06); }
      .dashboard-sidebar-scroll { scrollbar-width: thin; scrollbar-color: rgba(214,255,87,.45) transparent; }
      .dashboard-sidebar-scroll::-webkit-scrollbar { width: 8px; }
      .dashboard-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
      .dashboard-sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(214,255,87,.38); border: 2px solid transparent; background-clip: content-box; }
      .dashboard-theme-light .dashboard-sidebar-scroll { scrollbar-color: rgba(17,17,15,.28) transparent; }
      .dashboard-theme-light .dashboard-sidebar-scroll::-webkit-scrollbar-thumb { background-color: rgba(17,17,15,.28); }
    `}</style>
    <div className={`sticky top-0 z-40 flex items-center justify-between border-b px-5 py-4 backdrop-blur-md lg:hidden ${sidebar}`}>
      <BrandLink tone={dark ? "paper" : "ink"} />
      <div className="flex items-center gap-2"><button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center border border-current/15" aria-label={`Switch to ${dark ? "light" : "dark"} theme`}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button><button onClick={() => setMobileOpen((open) => !open)} className="flex h-9 w-9 items-center justify-center border border-current/15" aria-label="Toggle dashboard menu">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
    </div>
    {mobileOpen && <div className={`fixed inset-0 z-30 px-5 pb-8 pt-24 lg:hidden ${sidebar}`}><nav className="flex flex-col border-y border-current/15">{navItems.map((item) => <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={`flex items-center justify-between border-b border-current/15 px-4 py-4 text-sm font-semibold last:border-0 ${navLink(item.path)}`}><span>{item.label}</span>{item.path === "/messages" && unreadCount > 0 && <span className="text-xs">{unreadCount > 99 ? "99+" : unreadCount}</span>}</Link>)}</nav><div className="mt-8 border-t border-current/15 pt-5"><p className="truncate text-sm opacity-60">{user?.email}</p><button onClick={logout} className="mt-4 inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100"><LogOut className="h-4 w-4" />Log out</button></div></div>}
    <div className="hidden min-h-screen lg:flex"><aside className={`dashboard-sidebar-scroll sticky top-0 flex h-screen w-72 flex-col overflow-y-auto overscroll-contain border-r px-7 py-8 ${sidebar}`}><BrandLink tone={dark ? "paper" : "ink"} /><Link to="/explore" className="mt-2 text-xs opacity-55 hover:opacity-100">Browse marketplace</Link><nav className="mt-12 flex flex-col border-y border-current/15">{navItems.map((item) => <Link key={item.path} to={item.path} className={`flex items-center justify-between border-b border-current/15 px-4 py-3 text-sm font-semibold last:border-0 ${navLink(item.path)}`}><span>{item.label}</span>{item.path === "/messages" && unreadCount > 0 && <span className="text-xs">{unreadCount > 99 ? "99+" : unreadCount}</span>}</Link>)}</nav><div className="mt-auto border-t border-current/15 pt-5"><button onClick={toggleTheme} className="flex w-full items-center justify-between border border-current/15 px-4 py-3 text-sm font-semibold"><span>{dark ? "Dark mode" : "Light mode"}</span>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button><p className="mt-5 truncate text-sm opacity-55">{user?.email}</p><button onClick={logout} className="mt-3 inline-flex items-center gap-2 text-sm opacity-60 hover:opacity-100"><LogOut className="h-4 w-4" />Log out</button></div></aside><main className="min-w-0 flex-1 px-8 py-12 xl:px-14"><div className="mx-auto max-w-5xl">{children}</div></main></div>
    <main className="px-5 py-8 pb-24 lg:hidden">{children}</main>
  </div>;
}