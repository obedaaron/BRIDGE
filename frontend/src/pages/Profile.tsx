import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, BadgeCheck, Check, CheckCircle2, ClipboardList, CreditCard, Cookie, LockKeyhole, LogOut, Mail, MessageCircle, Moon, Phone, ShieldCheck, ShoppingCart, Sparkles, Store, Sun, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { useBridgeTheme } from "../lib/theme";
import { openCookieSettings } from "../components/CookieConsent";

type AccountDetails = {
  full_name: string | null;
  username: string | null;
  personalized_ads_enabled: boolean;
  email: string;
  phone: string | null;
  email_verified_at: string | null;
  phone_verified_at: string | null;
};
type VendorSummary = { id: string; business_name: string; slug: string } | null;

export function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useBridgeTheme();
  const dark = theme === "dark";
  const themeStyle = (dark
    ? { "--profile-page": "#11110f", "--profile-panel": "#171714", "--profile-text": "#f1eee7", "--profile-muted": "rgba(241,238,231,.64)", "--profile-line": "rgba(255,255,255,.15)", "--profile-accent": "#d6ff57" }
    : { "--profile-page": "#f6f2ea", "--profile-panel": "#ffffff", "--profile-text": "#171714", "--profile-muted": "rgba(23,23,20,.68)", "--profile-line": "rgba(23,23,20,.14)", "--profile-accent": "#526b0c" }) as CSSProperties;
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [vendor, setVendor] = useState<VendorSummary>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    Promise.all([apiFetch("/auth/me"), apiFetch("/vendors/me")])
      .then(([accountData, vendorData]) => { setAccount(accountData.user); setVendor(vendorData.vendor); })
      .catch(() => { setAccount({ full_name: user?.full_name || null, username: null, personalized_ads_enabled: false, email: user?.email || "", phone: null, email_verified_at: null, phone_verified_at: null }); })
      .finally(() => setLoading(false));
  }, [user]);

  const initials = (account?.full_name || user?.email || "BRIDGE").slice(0, 1).toUpperCase();
  const links = [
    { label: "My orders", description: "Track delivery and order updates", to: "/orders", icon: ClipboardList, tone: "teal" },
    { label: "Messages", description: "Continue a conversation with a store", to: "/messages", icon: MessageCircle, tone: "violet" },
    { label: "My cart", description: "Review items before placing an order", to: "/cart", icon: ShoppingCart, tone: "orange" },
    vendor
      ? { label: "Vendor dashboard", description: "Manage your store and listings", to: "/dashboard", icon: Store, tone: "lime" }
      : { label: "Become a vendor", description: "Apply with your store name, category and logo", to: "/become-vendor", icon: Store, tone: "lime" },
  ];

  const activityIconStyles: Record<string, CSSProperties> = {
    teal: { backgroundColor: dark ? "#17362f" : "#e2f3ed", color: dark ? "#8ee0c7" : "#176b54" },
    violet: { backgroundColor: dark ? "#302442" : "#f0e9fb", color: dark ? "#cfb1ff" : "#7042a6" },
    orange: { backgroundColor: dark ? "#3b2c1d" : "#fff0dd", color: dark ? "#ffc37b" : "#99540e" },
    lime: { backgroundColor: dark ? "#30391a" : "#eff6d8", color: dark ? "#d6ff57" : "#526b0c" },
  };
  async function persistProfile() {
    if (!account) return;
    setSavingProfile(true); setProfileError(""); setProfileMessage("");
    try {
      const result = await apiFetch("/auth/me", { method: "PATCH", body: JSON.stringify({ fullName: account.full_name || "", username: account.username || "", personalizedAdsEnabled: account.personalized_ads_enabled }) });
      setAccount(result.user); updateUser({ full_name: result.user.full_name }); setProfileMessage("Your account details have been saved.");
    } catch (error) { setProfileError(error instanceof Error ? error.message : "Could not save your account details."); }
    finally { setSavingProfile(false); }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persistProfile();
  }
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPasswordError(""); setPasswordMessage("");
    if (password.newPassword !== password.confirmPassword) { setPasswordError("The new passwords do not match."); return; }
    setSavingPassword(true);
    try {
      const result = await apiFetch("/auth/me/password", { method: "PATCH", body: JSON.stringify({ currentPassword: password.currentPassword, newPassword: password.newPassword }) });
      setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" }); setPasswordMessage(result.message || "Password updated successfully.");
    } catch (error) { setPasswordError(error instanceof Error ? error.message : "Could not update your password."); }
    finally { setSavingPassword(false); }
  }

  return <div style={themeStyle} className="min-h-screen bg-[var(--profile-page)] font-body text-[var(--profile-text)] transition-colors duration-300">
    <header className="sticky top-0 z-30 border-b border-[var(--profile-line)] bg-[var(--profile-page)]/95 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/explore" className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold hover:bg-[var(--profile-panel)]"><ArrowLeft className="h-4 w-4" />Explore</Link>
        <div className="flex items-center gap-3"><Link to="/explore" className="font-display text-lg font-bold">BRIDGE</Link><button type="button" onClick={toggleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} theme`} className="grid h-10 w-10 place-items-center rounded-full border border-[var(--profile-line)] text-[var(--profile-accent)] transition-colors hover:bg-[var(--profile-panel)]">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button></div>
      </nav>
    </header>
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:px-6 sm:py-10">
      <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-[var(--profile-line)] bg-[var(--profile-panel)] shadow-[0_18px_50px_rgba(17,17,15,.08)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-[#d6ff57]/20 blur-3xl" />
        <div className="relative flex items-center gap-4 p-5 sm:gap-6 sm:p-8">
          <span className="grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-[1.5rem] bg-[#d6ff57] text-2xl font-bold text-[#171714] shadow-lg shadow-[#d6ff57]/20">{initials}</span>
          <div className="min-w-0 flex-1"><p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-[var(--profile-accent)]"><Sparkles className="h-3.5 w-3.5" />Your BRIDGE account</p><h1 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight sm:text-3xl">{account?.full_name || user?.full_name || "Profile"}</h1><p className="mt-1 truncate text-sm text-[var(--profile-muted)]">{account?.username ? `@${account.username}` : account?.email || user?.email}</p></div>
          <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-[var(--profile-line)] px-3 py-2 text-xs font-semibold sm:inline-flex"><CheckCircle2 className="h-4 w-4 text-[var(--profile-accent)]" />Member</div>
        </div>
        <div className="relative flex flex-wrap gap-2 border-t border-[var(--profile-line)] px-5 py-3 sm:px-8"><span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--profile-page)] px-3 py-1.5 text-xs font-medium"><Mail className="h-3.5 w-3.5 text-[var(--profile-accent)]" />{account?.email_verified_at ? "Email verified" : "Email account"}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--profile-page)] px-3 py-1.5 text-xs font-medium"><Phone className="h-3.5 w-3.5 text-[var(--profile-accent)]" />{account?.phone_verified_at ? "Phone verified" : account?.phone ? "Phone added" : "Add phone"}</span></div>
      </section>

      <section aria-labelledby="profile-links-title"><div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d6ff57]/25 text-[var(--profile-accent)]"><Store className="h-5 w-5" /></span><div><h2 id="profile-links-title" className="font-display text-xl font-semibold">Your activity</h2><p className="mt-0.5 text-sm text-[var(--profile-muted)]">Shortcuts to the things you use most.</p></div></div><div className="grid gap-3 sm:grid-cols-2">{links.map((item) => <Link key={item.to} to={item.to} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-[var(--profile-line)] bg-[var(--profile-panel)] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--profile-accent)]/50 hover:shadow-lg sm:p-5"><span style={activityIconStyles[item.tone]} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"><item.icon className="h-5 w-5" strokeWidth={2} /></span><span className="min-w-0 flex-1"><span className="block font-semibold">{item.label}</span><span className="mt-1 block text-xs leading-relaxed text-[var(--profile-muted)]">{item.description}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--profile-muted)] group-hover:text-[var(--profile-accent)]" /></Link>)}</div></section>

      <section className="mt-9" aria-labelledby="account-details-title"><div className="mb-3 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d6ff57]/25 text-[var(--profile-accent)]"><UserRound className="h-5 w-5" /></span><div><h2 id="account-details-title" className="font-display text-xl font-semibold">Account details</h2><p className="mt-0.5 text-sm text-[var(--profile-muted)]">Update how your details appear on BRIDGE.</p></div></div>
        <form id="account-profile-form" onSubmit={saveProfile} className="space-y-4 rounded-2xl border border-[var(--profile-line)] bg-[var(--profile-panel)] p-5 sm:p-6">
          <label className="block text-sm font-semibold">Full name<input required maxLength={100} value={account?.full_name || ""} onChange={(event) => setAccount((prev) => prev ? { ...prev, full_name: event.target.value } : prev)} placeholder="Your name" className="mt-2 min-h-12 w-full rounded-xl border border-[var(--profile-line)] bg-[var(--profile-page)] px-4 text-[var(--profile-text)] outline-none focus:border-[var(--profile-accent)]" /></label>
          <label className="block text-sm font-semibold">Username<div className="mt-2 flex min-h-12 items-center rounded-xl border border-[var(--profile-line)] bg-[var(--profile-page)] px-4 focus-within:border-[var(--profile-accent)]"><span className="text-[var(--profile-muted)]">@</span><input maxLength={24} value={account?.username || ""} onChange={(event) => setAccount((prev) => prev ? { ...prev, username: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") } : prev)} placeholder="your_username" className="min-w-0 flex-1 bg-transparent px-2 text-[var(--profile-text)] outline-none" /></div><span className="mt-1 block text-xs font-normal text-[var(--profile-muted)]">3–24 letters, numbers or underscores.</span></label>
          <div className="flex items-start gap-3 border-t border-[var(--profile-line)] pt-4"><Mail className="mt-1 h-5 w-5 shrink-0 text-[var(--profile-muted)]" /><div className="min-w-0 flex-1"><p className="text-xs text-[var(--profile-muted)]">Email address</p><p className="break-all font-medium">{account?.email || user?.email}</p></div>{account?.email_verified_at && <BadgeCheck className="h-5 w-5 text-[var(--profile-accent)]" aria-label="Verified email" />}</div>
          <div className="flex items-center gap-3 border-t border-[var(--profile-line)] pt-4"><Phone className="h-5 w-5 shrink-0 text-[var(--profile-muted)]" /><div className="min-w-0 flex-1"><p className="text-xs text-[var(--profile-muted)]">Phone number</p><p className="font-medium">{account?.phone || "Not added"}</p></div><Link className="text-sm font-semibold text-[var(--profile-accent)]" to="/dashboard/verification">{account?.phone ? "Update" : "Add"}</Link></div>
          {profileError && <p role="alert" className="text-sm text-red-500">{profileError}</p>}{profileMessage && <p role="status" className="inline-flex items-center gap-2 text-sm text-[var(--profile-accent)]"><Check className="h-4 w-4" />{profileMessage}</p>}
          <button disabled={savingProfile || loading || !account} className="min-h-11 rounded-xl bg-[#d6ff57] px-5 font-semibold text-[#171714] disabled:cursor-wait disabled:opacity-60">{savingProfile ? "Saving…" : "Save account details"}</button>
        </form>
      </section>

      <section className="mt-9" aria-labelledby="password-title"><div className="mb-3 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d6ff57]/25 text-[var(--profile-accent)]"><LockKeyhole className="h-5 w-5" /></span><div><h2 id="password-title" className="font-display text-xl font-semibold">Password & security</h2><p className="mt-0.5 text-sm text-[var(--profile-muted)]">Change the password you use to sign in.</p></div></div>
        <form onSubmit={changePassword} className="space-y-4 rounded-2xl border border-[var(--profile-line)] bg-[var(--profile-panel)] p-5 sm:p-6">
          <label className="block text-sm font-semibold">Current password<input required type="password" autoComplete="current-password" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--profile-line)] bg-[var(--profile-page)] px-4 outline-none focus:border-[var(--profile-accent)]" /></label>
          <label className="block text-sm font-semibold">New password<input required minLength={8} type="password" autoComplete="new-password" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--profile-line)] bg-[var(--profile-page)] px-4 outline-none focus:border-[var(--profile-accent)]" /></label>
          <label className="block text-sm font-semibold">Confirm new password<input required minLength={8} type="password" autoComplete="new-password" value={password.confirmPassword} onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--profile-line)] bg-[var(--profile-page)] px-4 outline-none focus:border-[var(--profile-accent)]" /></label>
          {passwordError && <p role="alert" className="text-sm text-red-500">{passwordError}</p>}{passwordMessage && <p role="status" className="inline-flex items-center gap-2 text-sm text-[var(--profile-accent)]"><Check className="h-4 w-4" />{passwordMessage}</p>}
          <button disabled={savingPassword} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--profile-line)] px-5 font-semibold hover:bg-[var(--profile-page)] disabled:opacity-60"><LockKeyhole className="h-4 w-4" />{savingPassword ? "Updating…" : "Change password"}</button>
        </form>
      </section>

      <section className="mt-9" aria-labelledby="payments-title"><div className="mb-3 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d6ff57]/25 text-[var(--profile-accent)]"><CreditCard className="h-5 w-5" /></span><h2 id="payments-title" className="font-display text-xl font-semibold">Payment methods</h2></div><div className="flex gap-4 rounded-2xl border border-[var(--profile-line)] bg-[var(--profile-panel)] p-5 sm:p-6"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#d6ff57]/20 text-[var(--profile-accent)]"><CreditCard className="h-5 w-5" /></span><div><h3 className="font-semibold">Pay securely at checkout</h3><p className="mt-1 text-sm leading-relaxed text-[var(--profile-muted)]">Payments are handled securely by Paystack when you place an order. BRIDGE does not save your card details here.</p><Link to="/orders" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--profile-accent)]">View your orders<ArrowUpRight className="h-4 w-4" /></Link></div></div></section>

      <section className="mt-9" aria-labelledby="privacy-title"><div className="mb-3 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d6ff57]/25 text-[var(--profile-accent)]"><ShieldCheck className="h-5 w-5" /></span><div><h2 id="privacy-title" className="font-display text-xl font-semibold">Privacy & preferences</h2><p className="mt-0.5 text-sm text-[var(--profile-muted)]">Choose how BRIDGE can personalize your experience.</p></div></div>
        <div className="flex items-start gap-4 rounded-2xl border border-[var(--profile-line)] bg-[var(--profile-panel)] p-5 sm:p-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#d6ff57]/20 text-[var(--profile-accent)]"><ShieldCheck className="h-5 w-5" /></span><div className="min-w-0 flex-1"><label htmlFor="personalized-ads" className="font-semibold">Personalized recommendations and offers</label><p className="mt-1 text-sm leading-relaxed text-[var(--profile-muted)]">Allow BRIDGE to use your activity and interests to tailor store suggestions and offers. You can change this anytime.</p><Link to="/privacy" className="mt-2 inline-block text-sm font-semibold text-[var(--profile-accent)]">Read the Privacy Policy</Link></div><input id="personalized-ads" type="checkbox" checked={account?.personalized_ads_enabled ?? false} onChange={(event) => { setProfileMessage(""); setProfileError(""); setAccount((prev) => prev ? { ...prev, personalized_ads_enabled: event.target.checked } : prev); }} className="mt-1 h-5 w-5 shrink-0 accent-[#90b700]" aria-label="Allow personalized recommendations and offers" />
        </div>
        {profileError && <p role="alert" className="mt-3 text-sm text-red-500">{profileError}</p>}{profileMessage && <p role="status" className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--profile-accent)]"><Check className="h-4 w-4" />{profileMessage}</p>}
        <button type="button" disabled={savingProfile || loading || !account} onClick={persistProfile} className="mt-3 min-h-11 rounded-xl border border-[var(--profile-line)] px-5 text-sm font-semibold hover:bg-[var(--profile-panel)] disabled:opacity-60">{savingProfile ? "Saving…" : "Save privacy preference"}</button>
        <button type="button" onClick={openCookieSettings} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--profile-line)] px-5 text-sm font-semibold hover:bg-[var(--profile-panel)]"><Cookie className="h-4 w-4" />Cookie preferences</button>
      </section>
      <button onClick={logout} className="mt-9 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--profile-line)] px-4 text-sm font-semibold hover:bg-[var(--profile-panel)]"><LogOut className="h-4 w-4" />Sign out</button>
    </main>
  </div>;
}
