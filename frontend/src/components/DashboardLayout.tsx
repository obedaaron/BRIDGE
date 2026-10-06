import type { CSSProperties, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BarChart3, CreditCard, FileCheck2, LayoutDashboard, List, LogOut, Megaphone, MessageCircle, Moon, PackageCheck, Search, Settings, Sun, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { BrandLink } from "./BrandLink";
import { useBridgeTheme } from "../lib/theme";
import { BottomNavIllustration } from "./BottomNavIllustration";
import { NotificationCenter } from "./NotificationCenter";

const navItems = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard }, { label: "Listings", path: "/dashboard/listings", icon: List },
  { label: "Orders", path: "/dashboard/orders", icon: PackageCheck }, { label: "Plans & billing", path: "/dashboard/plans", icon: CreditCard },
  { label: "Wallet", path: "/dashboard/wallet", icon: Wallet }, { label: "Analytics", path: "/dashboard/analytics", icon: BarChart3 }, { label: "Promotions", path: "/dashboard/promotions", icon: Megaphone },
  { label: "Messages", path: "/messages", icon: MessageCircle }, { label: "Verification", path: "/dashboard/verification", icon: FileCheck2 }, { label: "Settings", path: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useBridgeTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dark = theme === "dark";
  const style = (dark ? { "--color-ink": "#f1eee7", "--color-paper": "#171714", "--dashboard-shell": "#11110f" } : { "--color-ink": "#1a1a17", "--color-paper": "#fbf7f1", "--dashboard-shell": "#f4ede2" }) as CSSProperties;
  const sidebar = dark ? "bg-[#171714] text-[#f1eee7] border-white/15" : "bg-[#e9e4da] text-[#11110f] border-[#11110f]/15";

  useEffect(() => { const loadUnread = () => apiFetch("/messages/unread-count").then((data) => setUnreadCount(data.unreadCount)).catch(() => undefined); loadUnread(); const timer = window.setInterval(loadUnread, 30_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { setSettingsOpen(false); }, [location.pathname]);

  const isCurrent = (path: string) => path === "/dashboard" ? location.pathname === path : location.pathname === path || location.pathname.startsWith(path + "/");
  const currentTitle = navItems.find((item) => isCurrent(item.path))?.label || "Dashboard";
  const navLink = (path: string) => isCurrent(path) ? (dark ? "bg-[#d6ff57] text-[#11110f]" : "bg-[#11110f] text-[#f1eee7]") : (dark ? "text-white/60 hover:bg-white/8 hover:text-white" : "text-[#11110f]/60 hover:bg-[#11110f]/5 hover:text-[#11110f]");

  return <div data-dashboard-theme={theme} style={style} className={`dashboard-theme min-h-screen bg-[var(--dashboard-shell)] text-ink font-body ${dark ? "dashboard-theme-dark" : "dashboard-theme-light"}`}>
    <style>{`
      .dashboard-theme { transition: background-color .25s ease, color .25s ease; }
.dashboard-theme main [class~="rounded-none"] { border-radius: 1.25rem; }
      .dashboard-theme main [class*="bg-paper"][class*="border-ink/"], .dashboard-theme main [class*="bg-white"][class*="border-ink/"] { border-radius: 1.25rem; box-shadow: 0 12px 32px rgba(17,17,15,.055); }
      .dashboard-theme [class*="text-ink/20"], .dashboard-theme [class*="text-ink/30"], .dashboard-theme [class*="text-ink/35"], .dashboard-theme [class*="text-ink/40"], .dashboard-theme [class*="text-ink/45"] { color: color-mix(in srgb, var(--color-ink) 68%, transparent) !important; }
      .dashboard-theme input::placeholder, .dashboard-theme textarea::placeholder { color: color-mix(in srgb, var(--color-ink) 48%, transparent); }
      .dashboard-theme-dark [class*="text-[#2E8B72]"], .dashboard-theme-dark [class*="text-[#206653]"] { color: #d6ff57 !important; }
      .dashboard-theme-light [class*="text-[#2E8B72]"] { color: #206653 !important; }
      .dashboard-theme-dark [class*="text-[#C94F36]"], .dashboard-theme-dark [class*="text-[#ca5b42]"] { color: #ff9b83 !important; }
      .dashboard-theme-light [class*="text-[#C94F36]"] { color: #a43b27 !important; }
      .dashboard-theme-dark [class*="bg-[#2E8B72]"] { background-color: #1f684f !important; }
      .dashboard-theme :is(button, a) { -webkit-tap-highlight-color: transparent; }
.dashboard-theme main section[class*="border-t"] { margin-top: 1.5rem; padding: 1.5rem; border: 1px solid color-mix(in srgb, var(--color-ink) 12%, transparent); border-radius: 1.5rem; background: var(--color-paper); box-shadow: 0 12px 32px rgba(17,17,15,.045); }
      .dashboard-theme-dark [class*="hover:bg-black/5"]:hover { background-color: rgba(255,255,255,.08); }
      @media (max-width: 1023px) {
        .dashboard-theme main[class~="lg:hidden"] h1 { font-size: clamp(2.1rem, 9vw, 3rem); line-height: 1.02; letter-spacing: -.035em; }
        .dashboard-theme main[class~="lg:hidden"] [class~="rounded-none"] { border-radius: 1.25rem; }
        .dashboard-theme main[class~="lg:hidden"] [class*="border-ink/15"][class*="bg-paper"], .dashboard-theme main[class~="lg:hidden"] [class*="border-ink/15"][class*="bg-white"] { border-radius: 1.25rem; box-shadow: 0 8px 24px rgba(17,17,15,.045); }
      }
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
      .dashboard-theme-dark input::placeholder, .dashboard-theme-dark textarea::placeholder { color: rgba(255,255,255,.58); }
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
      <div className="flex items-center gap-3"><span className="text-xs font-semibold opacity-70">{currentTitle}</span><NotificationCenter /></div>
    </div>
    <div className="hidden min-h-screen lg:flex"><aside className={`dashboard-sidebar-scroll sticky top-0 flex h-screen w-72 flex-col overflow-y-auto overscroll-contain border-r px-7 py-8 ${sidebar}`}><BrandLink tone={dark ? "paper" : "ink"} /><Link to="/explore" className="mt-2 text-xs opacity-55 hover:opacity-100">Browse marketplace</Link><nav className="mt-12 flex flex-col border-y border-current/15">{navItems.filter((item) => ["/dashboard", "/dashboard/listings", "/dashboard/orders", "/messages"].includes(item.path)).map((item) => <Link key={item.path} to={item.path} aria-current={isCurrent(item.path) ? "page" : undefined} className={`flex items-center justify-between border-b border-current/15 px-4 py-3 text-sm font-semibold last:border-0 ${navLink(item.path)}`}><span className="inline-flex items-center gap-2"><item.icon className="h-4 w-4" />{item.label}</span>{item.path === "/messages" && unreadCount > 0 && <span className="text-xs">{unreadCount > 99 ? "99+" : unreadCount}</span>}</Link>)}</nav><nav className="mt-6 flex flex-col border-b border-current/15 pb-4"><p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[.16em] opacity-45">Settings & account</p>{navItems.filter((item) => !["/dashboard", "/dashboard/listings", "/dashboard/orders", "/messages"].includes(item.path)).map((item) => <Link key={item.path} to={item.path} aria-current={isCurrent(item.path) ? "page" : undefined} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${navLink(item.path)}`}><item.icon className="h-4 w-4 opacity-65" />{item.label}</Link>)}</nav><div className="mt-auto border-t border-current/15 pt-5"><p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[.16em] opacity-45">Account actions</p><button onClick={toggleTheme} className="flex w-full items-center justify-between border border-current/15 px-4 py-3 text-sm font-semibold"><span>{dark ? "Dark mode" : "Light mode"}</span>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button><p className="mt-5 truncate text-sm opacity-55">{user?.email}</p><button onClick={logout} className="mt-3 inline-flex items-center gap-2 text-sm opacity-60 hover:opacity-100"><LogOut className="h-4 w-4" />Log out</button></div></aside><main className="min-w-0 flex-1 px-8 py-12 xl:px-14"><div className="mx-auto max-w-5xl"><div className="mb-5 flex justify-end"><NotificationCenter /></div>{children}</div></main></div>
    <main className="px-5 py-7 pb-28 lg:hidden"><div className="mb-5 flex justify-end"><Link to="/explore" className="inline-flex items-center gap-1.5 rounded-full border border-current/15 px-3 py-2 text-xs font-semibold"><Search className="h-3.5 w-3.5" />Explore marketplace</Link></div>{children}</main>
        <nav aria-label="Dashboard navigation" className={"fixed inset-x-0 bottom-0 z-50 border-t px-2 pt-2 backdrop-blur-xl lg:hidden " + (dark ? "border-white/10 bg-[#171714]/95 text-white" : "border-black/10 bg-[#fbf7f1]/95 text-[#11110f]")} style={{ paddingBottom: "max(.5rem, env(safe-area-inset-bottom))" }}>
      {settingsOpen && <div className="absolute inset-x-3 bottom-[calc(100%+0.75rem)] max-h-[min(70dvh,32rem)] overflow-y-auto rounded-2xl border border-current/10 bg-[var(--color-paper)] p-2 shadow-2xl">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold opacity-60">Settings & account</p>
        {navItems.filter((item) => !["/dashboard", "/dashboard/listings", "/dashboard/orders", "/messages"].includes(item.path)).map((item) => <Link key={item.path} to={item.path} aria-current={isCurrent(item.path) ? "page" : undefined} className="flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-medium hover:bg-black/5"><span className="inline-flex items-center gap-2"><item.icon className="h-4 w-4 opacity-60" />{item.label}</span></Link>)}
        <button type="button" onClick={toggleTheme} className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-medium hover:bg-black/5"><span className="inline-flex items-center gap-2">{dark ? <Sun className="h-4 w-4 opacity-60" /> : <Moon className="h-4 w-4 opacity-60" />}{dark ? "Light mode" : "Dark mode"}</span></button>
        <button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium text-[#c94f36] hover:bg-black/5"><LogOut className="h-4 w-4" />Log out</button>
      </div>}
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        <Link to="/dashboard" aria-current={isCurrent("/dashboard") ? "page" : undefined} className={"flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold " + (isCurrent("/dashboard") ? "text-current" : "opacity-60")}><BottomNavIllustration name="home" active={isCurrent("/dashboard")} /><span className="leading-none">Home</span></Link>
        <Link to="/dashboard/listings" aria-current={isCurrent("/dashboard/listings") ? "page" : undefined} className={"flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold " + (isCurrent("/dashboard/listings") ? "text-current" : "opacity-60")}><BottomNavIllustration name="store" active={isCurrent("/dashboard/listings")} /><span className="leading-none">Listings</span></Link>
        <Link to="/dashboard/orders" aria-current={isCurrent("/dashboard/orders") ? "page" : undefined} className={"relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold " + (isCurrent("/dashboard/orders") ? "text-current" : "opacity-60")}><BottomNavIllustration name="cart" active={isCurrent("/dashboard/orders")} /><span className="leading-none">Orders</span></Link>
        <Link to="/messages" aria-current={isCurrent("/messages") ? "page" : undefined} className={"relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold " + (isCurrent("/messages") ? "text-current" : "opacity-60")}><BottomNavIllustration name="messages" active={isCurrent("/messages")} />{unreadCount > 0 && <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-[#d6ff57]" />}<span className="leading-none">Messages</span></Link>
        <button type="button" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)} className={"flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold " + (settingsOpen || ["/dashboard/settings", "/dashboard/verification", "/dashboard/wallet", "/dashboard/analytics", "/dashboard/promotions", "/dashboard/plans"].some((path) => isCurrent(path)) ? "text-current" : "opacity-60")}><BottomNavIllustration name="profile" active={settingsOpen || ["/dashboard/settings", "/dashboard/verification", "/dashboard/wallet", "/dashboard/analytics", "/dashboard/promotions", "/dashboard/plans"].some((path) => isCurrent(path))} /><span className="leading-none">Settings</span></button>
      </div>
    </nav>
  </div>;
}
