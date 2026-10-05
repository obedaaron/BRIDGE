import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ClipboardList, LogOut, Mail, MessageCircle, Phone, ShoppingCart, Store, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

type AccountDetails = { full_name: string | null; email: string; phone: string | null; email_verified_at: string | null; phone_verified_at: string | null };
type VendorSummary = { id: string; business_name: string; slug: string } | null;

export function Profile() {
  const { user, logout } = useAuth();
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
  return <div className="min-h-screen bg-[#f6f2ea] font-body text-[#171714]">
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f6f2ea]/95 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/explore" className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold hover:bg-black/5"><ArrowLeft className="h-4 w-4" />Explore</Link>
        <Link to="/explore" className="font-display text-lg font-bold">BRIDGE</Link>
      </nav>
    </header>
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex items-center gap-4 rounded-3xl border border-black/10 bg-white p-5 sm:p-7">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#d6ff57] text-xl font-bold">{initials}</span>
        <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#526b0c]">Your BRIDGE account</p><h1 className="mt-1 truncate font-display text-2xl font-semibold">{account?.full_name || user?.full_name || "Profile"}</h1><p className="mt-1 truncate text-sm text-black/60">{account?.email || user?.email}</p></div>
      </div>
      <section aria-labelledby="profile-links-title"><h2 id="profile-links-title" className="mb-3 font-display text-xl font-semibold">Your activity</h2><div className="grid gap-3 sm:grid-cols-2">{links.map((item) => <Link key={item.to} to={item.to} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-[#9abf31]/60 hover:bg-white/80"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#d6ff57]/25 text-[#526b0c]"><item.icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-semibold">{item.label}</span><span className="mt-1 block text-xs leading-relaxed text-black/55">{item.description}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-black/40 group-hover:text-[#526b0c]" /></Link>)}</div></section>
      <section className="mt-9" aria-labelledby="account-details-title"><h2 id="account-details-title" className="mb-3 font-display text-xl font-semibold">Account details</h2><div className="divide-y divide-black/10 overflow-hidden rounded-2xl border border-black/10 bg-white">
        <div className="flex items-center gap-4 p-4 sm:p-5"><UserRound className="h-5 w-5 shrink-0 text-black/55" /><div className="min-w-0"><p className="text-xs text-black/55">Name</p><p className="truncate font-medium">{loading ? "Loading…" : account?.full_name || "Add your name"}</p></div></div>
        <div className="flex items-center gap-4 p-4 sm:p-5"><Mail className="h-5 w-5 shrink-0 text-black/55" /><div className="min-w-0"><p className="text-xs text-black/55">Email</p><p className="truncate font-medium">{account?.email || user?.email}</p></div><span className="ml-auto shrink-0 text-xs text-black/50">{account?.email_verified_at ? "Verified" : ""}</span></div>
        <div className="flex items-center gap-4 p-4 sm:p-5"><Phone className="h-5 w-5 shrink-0 text-black/55" /><div className="min-w-0"><p className="text-xs text-black/55">Phone number</p><p className="font-medium">{account?.phone || "Add a phone number in Verification"}</p></div><Link className="ml-auto shrink-0 text-xs font-semibold text-[#526b0c]" to="/dashboard/verification">Update</Link></div>
      </div></section>
      <button onClick={logout} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-black/15 px-4 text-sm font-semibold hover:bg-white"><LogOut className="h-4 w-4" />Sign out</button>
    </main>
  </div>;
}
