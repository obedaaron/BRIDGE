import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ClipboardList, LogOut, Mail, MessageCircle, Moon, Phone, ShoppingCart, Store, Sun, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { useBridgeTheme } from "../lib/theme";

type AccountDetails = { full_name: string | null; email: string; phone: string | null; email_verified_at: string | null; phone_verified_at: string | null };
type VendorSummary = { id: string; business_name: string; slug: string } | null;

export function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useBridgeTheme();
  const dark = theme === "dark";
  const themeStyle = (dark
    ? { "--profile-page": "#11110f", "--profile-panel": "#171714", "--profile-text": "#f1eee7", "--profile-muted": "rgba(241,238,231,.64)", "--profile-line": "rgba(255,255,255,.15)", "--profile-accent": "#d6ff57" }
    : { "--profile-page": "#f6f2ea", "--profile-panel": "#ffffff", "--profile-text": "#171714", "--profile-muted": "rgba(23,23,20,.58)", "--profile-line": "rgba(23,23,20,.12)", "--profile-accent": "#526b0c" }) as CSSProperties;
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [vendor, setVendor] = useState<VendorSummary>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([apiFetch("/auth/me"), apiFetch("/vendors/me")])
      .then(([accountData, vendorData]) => { setAccount(accountData.user); setVendor(vendorData.vendor); })
      .catch(() => { setAccount({ full_name: user?.full_name || null, email: user?.email || "", phone: null, email_verified_at: null, phone_verified_at: null }); })
      .finally(() => setLoading(false));
  }, [user]);
  const initials = (account?.full_name || user?.email || "BRIDGE").slice(0, 1).toUpperCase();
  const links = [
    { label: "My orders", description: "Track delivery and order updates", to: "/orders", icon: ClipboardList },
    { label: "Messages", description: "Continue a conversation with a store", to: "/messages", icon: MessageCircle },
    { label: "My cart", description: "Review items before placing an order", to: "/cart", icon: ShoppingCart },
    vendor
      ? { label: "Vendor dashboard", description: "Manage your store and listings", to: "/dashboard", icon: Store }
      : { label: "Become a vendor", description: "Apply with your store name, category and logo", to: "/become-vendor", icon: Store },
  ];
  return <div style={themeStyle} className="min-h-screen bg-[var(--profile-page)] font-body text-[var(--profile-text)] transition-colors duration-300">
    <header className="sticky top-0 z-30 border-b border-[var(--profile-line)] bg-[var(--profile-page)]/95 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/explore" className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold hover:bg-[var(--profile-panel)]"><ArrowLeft className="h-4 w-4" />Explore</Link>
        <div className="flex items-center gap-3"><Link to="/explore" className="font-display text-lg font-bold">BRIDGE</Link><button type="button" onClick={toggleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} theme`} className="grid h-10 w-10 place-items-center rounded-full border border-[var(--profile-line)] text-[var(--profile-accent)] transition-colors hover:bg-[var(--profile-panel)]">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button></div>
      </nav>
    </header>
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex items-center gap-4 rounded-3xl border border-[var(--profile-line)] bg-[var(--profile-panel)] p-5 sm:p-7">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#d6ff57] text-xl font-bold">{initials}</span>
        <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--profile-accent)]">Your BRIDGE account</p><h1 className="mt-1 truncate font-display text-2xl font-semibold">{account?.full_name || user?.full_name || "Profile"}</h1><p className="mt-1 truncate text-sm text-[var(--profile-muted)]">{account?.email || user?.email}</p></div>
      </div>
      <section aria-labelledby="profile-links-title"><h2 id="profile-links-title" className="mb-3 font-display text-xl font-semibold">Your activity</h2><div className="grid gap-3 sm:grid-cols-2">{links.map((item) => <Link key={item.to} to={item.to} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-[var(--profile-line)] bg-[var(--profile-panel)] p-5 transition-colors hover:border-[#9abf31]/60 hover:bg-[var(--profile-panel)]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#d6ff57]/20 text-[var(--profile-accent)]"><item.icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-semibold">{item.label}</span><span className="mt-1 block text-xs leading-relaxed text-[var(--profile-muted)]">{item.description}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--profile-muted)] group-hover:text-[var(--profile-accent)]" /></Link>)}</div></section>
      <section className="mt-9" aria-labelledby="account-details-title"><h2 id="account-details-title" className="mb-3 font-display text-xl font-semibold">Account details</h2><div className="divide-y divide-[var(--profile-line)] overflow-hidden rounded-2xl border border-[var(--profile-line)] bg-[var(--profile-panel)]">
        <div className="flex items-center gap-4 p-4 sm:p-5"><UserRound className="h-5 w-5 shrink-0 text-[var(--profile-muted)]" /><div className="min-w-0"><p className="text-xs text-[var(--profile-muted)]">Name</p><p className="truncate font-medium">{loading ? "Loading…" : account?.full_name || "Add your name"}</p></div></div>
        <div className="flex items-center gap-4 p-4 sm:p-5"><Mail className="h-5 w-5 shrink-0 text-[var(--profile-muted)]" /><div className="min-w-0"><p className="text-xs text-[var(--profile-muted)]">Email</p><p className="truncate font-medium">{account?.email || user?.email}</p></div><span className="ml-auto shrink-0 text-xs text-[var(--profile-muted)]">{account?.email_verified_at ? "Verified" : ""}</span></div>
        <div className="flex items-center gap-4 p-4 sm:p-5"><Phone className="h-5 w-5 shrink-0 text-[var(--profile-muted)]" /><div className="min-w-0"><p className="text-xs text-[var(--profile-muted)]">Phone number</p><p className="font-medium">{account?.phone || "Add a phone number in Verification"}</p></div><Link className="ml-auto shrink-0 text-xs font-semibold text-[var(--profile-accent)]" to="/dashboard/verification">Update</Link></div>
      </div></section>
      <button onClick={logout} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--profile-line)] px-4 text-sm font-semibold hover:bg-[var(--profile-panel)]"><LogOut className="h-4 w-4" />Sign out</button>
    </main>
  </div>;
}
