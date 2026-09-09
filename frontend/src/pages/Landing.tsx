import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Building2, CheckCircle2, MapPin, Search, ShieldCheck, Store, UsersRound } from "lucide-react";

const cities = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano"];
const categories = ["Tailoring", "Electrical", "Photography", "Fashion", "Catering", "Mechanics", "Hair & Beauty", "Home Repairs"];

const storefrontViews = [{ key: "details", label: "Business details", icon: Building2, title: "Know who you are dealing with.", body: "A storefront puts the name, service area, description, listings, and business contact route in one place.", note: "Clear information before the first message." }, { key: "trust", label: "Trust signals", icon: ShieldCheck, title: "Check the details that matter.", body: "Verification status, reviews, location, and business activity help customers decide how to proceed.", note: "Useful context, presented plainly." }, { key: "contact", label: "Start a conversation", icon: MapPin, title: "Reach out with context.", body: "Customers can move from a business profile into a direct conversation when they are ready to ask questions or agree on work.", note: "A simpler start for both sides." }];

const footerLinks = {
  Explore: [{ label: "Find a business", to: "/explore" }, { label: "List your business", to: "/signup" }, { label: "How it works", to: "/how-it-works" }],
  Company: [{ label: "About", to: "/about" }, { label: "Contact", to: "/contact" }, { label: "Careers", to: "/careers" }],
  Legal: [{ label: "Terms of Service", to: "/terms" }, { label: "Privacy Policy", to: "/privacy" }],
};

export function Landing() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeStorefrontView, setActiveStorefrontView] = useState("details");
  const storefrontView = storefrontViews.find((view) => view.key === activeStorefrontView) ?? storefrontViews[0];
  const StorefrontIcon = storefrontView.icon;

  function explore(e?: FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city) params.set("city", city);
    if (activeCategory) params.set("category", activeCategory.toLowerCase().replace(/\s+/g, "-"));
    navigate(`/explore${params.size ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      <nav className="sticky top-0 z-50 border-b border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 md:px-12">
          <Link to="/" className="flex items-center gap-2" aria-label="BRIDGE home">
            <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
            <span className="font-display text-xl font-bold tracking-tight">BRIDGE</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/explore" className="hidden text-sm font-medium text-ink/65 hover:text-ink sm:block">Explore</Link>
            <Link to="/login" className="hidden text-sm font-medium text-ink/65 hover:text-ink md:block">Log in</Link>
            <Link to="/signup" className="rounded-lg bg-[#2E8B72] px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-[#206653]">List your business</Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="border-b border-ink/10 bg-[#2E8B72] text-paper">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 sm:py-20 md:grid-cols-[1.1fr_0.9fr] md:px-12 md:py-24">
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#E5B35C]">Nigeria's local business network</p>
              <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.94] tracking-[-0.045em] sm:text-6xl md:text-7xl">Find the right local business.</h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/75 sm:text-lg">Search businesses by service and city, see their verification status, and contact them from one clear storefront.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/signup" className="inline-flex items-center gap-2 rounded-lg bg-[#E5B35C] px-5 py-3.5 text-sm font-semibold text-ink hover:bg-[#f0c873]">Create a storefront <ArrowUpRight className="h-4 w-4" /></Link>
                <Link to="/explore" className="inline-flex items-center gap-2 rounded-lg border border-paper/35 px-5 py-3.5 text-sm font-semibold text-paper hover:bg-paper/10">Browse businesses <Search className="h-4 w-4" /></Link>
              </div>
            </div>

            <form onSubmit={explore} className="self-end border border-paper/20 bg-paper p-4 text-ink shadow-[8px_8px_0_0_#C94F36] sm:p-5">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/55" htmlFor="business-search">What do you need?</label>
              <div className="mt-2 flex items-center border-b border-ink/20 pb-3">
                <Search className="mr-3 h-5 w-5 text-[#C94F36]" />
                <input id="business-search" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink/35" placeholder="Tailor, electrician, caterer..." />
              </div>
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/55">Choose a city</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {cities.map((name) => <button type="button" key={name} onClick={() => setCity(name)} className={`border px-3 py-2.5 text-left text-sm font-medium transition-colors ${city === name ? "border-[#2E8B72] bg-[#dce9df] text-[#206653]" : "border-ink/15 hover:border-[#2E8B72]"}`}>{name}</button>)}
                </div>
              </div>
              <button type="submit" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#C94F36] px-5 py-3.5 text-sm font-semibold text-paper hover:bg-[#ad402b]">Search businesses <ArrowUpRight className="h-4 w-4" /></button>
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 md:px-12">
          <div className="flex flex-col justify-between gap-5 border-b border-ink/15 pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Start with a service</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Browse without guesswork.</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-ink/60">Pick a service, add a city if you need one, and go straight to relevant business listings.</p>
          </div>
          <div className="mt-6 grid grid-cols-2 border-l border-t border-ink/15 sm:grid-cols-4">
            {categories.map((name, index) => <button key={name} type="button" onClick={() => { setActiveCategory(name); setQuery(""); }} className={`min-h-28 border-b border-r border-ink/15 p-4 text-left transition-colors sm:min-h-32 sm:p-5 ${activeCategory === name ? "bg-[#E5B35C]" : index % 3 === 0 ? "bg-[#f4ede2] hover:bg-[#e9ddca]" : "bg-white hover:bg-[#dce9df]"}`}><span className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{String(index + 1).padStart(2, "0")}</span><span className="mt-5 block font-display text-lg font-semibold leading-tight">{name}</span></button>)}
          </div>
          {activeCategory && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-[#2E8B72]/25 bg-[#dce9df] p-4"><p className="text-sm text-[#206653]">Showing businesses for <strong>{activeCategory}</strong>{city ? ` in ${city}` : ""}.</p><button type="button" onClick={() => explore()} className="inline-flex items-center gap-2 rounded-md bg-[#2E8B72] px-4 py-2.5 text-sm font-semibold text-paper hover:bg-[#206653]">See results <ArrowUpRight className="h-4 w-4" /></button></div>}
        </section>

        <section className="border-y border-ink/10 bg-[#f4ede2]">
          <div className="mx-auto grid max-w-7xl md:grid-cols-2 md:px-12">
            <article className="border-b border-ink/10 p-6 sm:p-10 md:border-b-0 md:border-r"><UsersRound className="h-7 w-7 text-[#C94F36]" /><h2 className="mt-8 font-display text-3xl font-semibold tracking-tight">For customers</h2><p className="mt-3 max-w-md leading-relaxed text-ink/65">Find businesses, check their details, and start a conversation before you decide.</p><Link to="/explore" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#2E8B72] hover:underline">Find a business <ArrowUpRight className="h-4 w-4" /></Link></article>
            <article className="p-6 sm:p-10"><Store className="h-7 w-7 text-[#2E8B72]" /><h2 className="mt-8 font-display text-3xl font-semibold tracking-tight">For business owners</h2><p className="mt-3 max-w-md leading-relaxed text-ink/65">Set up a shareable storefront, show what you sell, and keep customer conversations in one place.</p><Link to="/signup" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#C94F36] hover:underline">Create your storefront <ArrowUpRight className="h-4 w-4" /></Link></article>
          </div>
        </section>

        <section className="border-b border-ink/10 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 sm:py-20 md:grid-cols-[0.8fr_1.2fr] md:px-12">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">A useful storefront</p><h2 className="mt-3 max-w-md font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl">Everything needed for a better first decision.</h2><p className="mt-5 max-w-md leading-relaxed text-ink/60">BRIDGE makes a local business easier to assess before anyone commits time or money.</p><div className="mt-8 border-t border-ink/15">{storefrontViews.map(({ key, label, icon: Icon }) => <button key={key} type="button" onClick={() => setActiveStorefrontView(key)} className={`flex w-full items-center justify-between border-b border-ink/15 py-4 text-left text-sm font-semibold transition-colors ${activeStorefrontView === key ? "text-[#2E8B72]" : "text-ink/55 hover:text-ink"}`}><span className="flex items-center gap-3"><Icon className="h-4 w-4" />{label}</span><span className="font-mono text-xs">{activeStorefrontView === key ? "Selected" : "View"}</span></button>)}</div></div>
            <div className="border border-ink/15 bg-[#f4ede2] p-5 sm:p-8"><div className="flex items-start justify-between gap-6 border-b border-ink/15 pb-8"><StorefrontIcon className="h-8 w-8 text-[#C94F36]" /><span className="border border-[#2E8B72]/25 bg-[#dce9df] px-3 py-1.5 text-xs font-semibold text-[#206653]">Storefront view</span></div><h3 className="mt-10 max-w-lg font-display text-3xl font-semibold leading-tight sm:text-4xl">{storefrontView.title}</h3><p className="mt-4 max-w-xl text-base leading-relaxed text-ink/65">{storefrontView.body}</p><p className="mt-10 border-l-2 border-[#E5B35C] pl-4 text-sm font-medium text-ink/70">{storefrontView.note}</p><Link to="/explore" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[#2E8B72] hover:underline">Explore live storefronts <ArrowUpRight className="h-4 w-4" /></Link></div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 md:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">How it works</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[{ icon: Search, title: "Search by need", body: "Start with a service, business name, or city." }, { icon: CheckCircle2, title: "Review the storefront", body: "See business details, location, listings, and verification information." }, { icon: Building2, title: "Contact with context", body: "Message the business through BRIDGE when you are ready." }].map(({ icon: Icon, title, body }, index) => <article key={title} className="border border-ink/15 bg-white p-6"><span className="font-mono text-xs text-[#C94F36]">0{index + 1}</span><Icon className="mt-10 h-7 w-7 text-[#2E8B72]" /><h3 className="mt-5 font-display text-2xl font-semibold">{title}</h3><p className="mt-2 leading-relaxed text-ink/60">{body}</p></article>)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 sm:pb-20 md:px-12">
          <div className="border border-[#C94F36] bg-[#C94F36] px-6 py-12 text-paper sm:px-10 md:flex md:items-end md:justify-between md:gap-10">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/75">Bring your business online</p><h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">A storefront your customers can actually use.</h2></div>
            <Link to="/signup" className="mt-7 inline-flex shrink-0 items-center gap-2 rounded-lg bg-paper px-5 py-3.5 text-sm font-semibold text-ink hover:bg-[#f4ede2] md:mt-0">Create your store <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10 bg-ink text-paper">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:px-12">
          <div><Link to="/" className="flex items-center gap-2"><img src="/logo.png" alt="" className="h-8 w-8 invert" /><span className="font-display text-xl font-bold">BRIDGE</span></Link><p className="mt-5 max-w-xs text-sm leading-relaxed text-paper/55">A clearer way to find and run local businesses online.</p></div>
          {Object.entries(footerLinks).map(([heading, links]) => <div key={heading}><h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E5B35C]">{heading}</h3><ul className="mt-4 space-y-3">{links.map((link) => <li key={link.label}><Link className="text-sm text-paper/65 hover:text-paper" to={link.to}>{link.label}</Link></li>)}</ul></div>)}
        </div>
      </footer>
    </div>
  );
}