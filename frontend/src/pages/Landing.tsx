import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Link2, MapPin, Scissors, Zap, Camera, Shirt,
  UtensilsCrossed, Wrench, Sparkles, Hammer, Star, MessageCircle,
  Send, Globe, ArrowUpRight, Menu, X
} from "lucide-react";
import { SignboardTag } from "../components/SignboardTag";

const categories = ["Tailoring", "Electrical", "Photography", "Fashion", "Catering", "Mechanics", "Hair & Beauty", "Home Repairs"];

const categoryCards = [
  { name: "Tailoring", icon: Scissors, img: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80" },
  { name: "Electrical", icon: Zap, img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80" },
  { name: "Photography", icon: Camera, img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80" },
  { name: "Fashion", icon: Shirt, img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80" },
  { name: "Catering", icon: UtensilsCrossed, img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80" },
  { name: "Mechanics", icon: Wrench, img: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80" },
  { name: "Hair & Beauty", icon: Sparkles, img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80" },
  { name: "Home Repairs", icon: Hammer, img: "https://images.unsplash.com/photo-1581235720705-06d3acfcb36f?auto=format&fit=crop&w=1200&q=80" },
];

const whyBridge = [
  { icon: ShieldCheck, title: "Real verification", body: "Identity, business, location, and skill checks — not just a badge you can buy." },
  { icon: Link2, title: "One link, everywhere", body: "Share your storefront on WhatsApp, Instagram, or your shop front — no app download needed." },
  { icon: MapPin, title: "Local or anywhere", body: "Find vendors near you, or reach across the country when you need something specific." },
];

const footerLinks = {
  Product: [{ label: "Explore vendors", to: "/explore" }, { label: "List your business", to: "/signup" }, { label: "How it works", to: "/#how-it-works" }],
  Categories: [{ label: "Tailoring", to: "/explore" }, { label: "Electrical", to: "/explore" }, { label: "Photography", to: "/explore" }, { label: "Fashion", to: "/explore" }],
  Company: [{ label: "About", to: "#" }, { label: "Contact", to: "#" }, { label: "Careers", to: "#" }],
  Legal: [{ label: "Terms of Service", to: "#" }, { label: "Privacy Policy", to: "#" }],
};

export function Landing() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCategory((prev) => (prev + 1) % categoryCards.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink font-body overflow-x-hidden">
      <style>{`
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          30% { transform: translate(7%, -25%); }
          50% { transform: translate(-15%, 10%); }
          70% { transform: translate(0%, 15%); }
          90% { transform: translate(-10%, 10%); }
        }
        .grain-overlay {
          position: fixed; top: -50%; left: -50%; right: -50%; bottom: -50%;
          width: 200%; height: 200vh;
          background: transparent url('data:image/svg+xml,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.03"/></svg>');
          animation: grain 8s steps(10) infinite;
          pointer-events: none; z-index: 9999;
        }
        .editorial-heading {
          font-size: clamp(2.5rem, 10vw, 9rem);
          line-height: 0.9;
          letter-spacing: -0.04em;
        }
      `}</style>
      <div className="grain-overlay" />

      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-paper/90 backdrop-blur-md border-b border-ink/5" : "bg-transparent"
      }`}>
        <div className="flex items-center justify-between px-5 sm:px-6 md:px-12 py-4 md:py-5 max-w-7xl mx-auto">
          <img src="/logo.png" alt="BRIDGE" className={`h-7 md:h-9 transition-all duration-500 ${scrolled ? "" : "invert"}`} />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className={`text-sm font-medium px-4 py-2 transition-colors ${
              scrolled ? "text-ink/70 hover:text-ink" : "text-paper/80 hover:text-paper"
            }`}>Log in</Link>
            <Link to="/signup" className={`text-sm font-medium px-5 md:px-6 py-2 md:py-2.5 rounded-full transition-colors ${
              scrolled ? "bg-ink text-paper hover:bg-ink/90" : "bg-paper text-ink hover:bg-paper/90"
            }`}>Get Started</Link>
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-full transition-colors ${scrolled ? "text-ink" : "text-paper"}`}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileMenuOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        } ${scrolled ? "bg-paper/95 backdrop-blur-md border-b border-ink/5" : "bg-ink/90 backdrop-blur-md"}`}>
          <div className="px-5 py-4 flex flex-col gap-3">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className={`text-sm font-medium py-2 ${scrolled ? "text-ink/70" : "text-paper/80"}`}>Log in</Link>
            <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium bg-paper text-ink px-5 py-2.5 rounded-full text-center">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative min-h-screen bg-ink flex flex-col justify-center overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-signal/25 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-10 right-0 w-80 h-80 bg-gold/25 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-ink/10 rounded-full blur-3xl" />

        <div className="relative px-5 sm:px-6 md:px-12 pt-20 sm:pt-24 pb-16 max-w-7xl mx-auto w-full">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-8 mb-8 sm:mb-10 md:mb-14 opacity-50">
            <span className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-paper/50 font-medium">Trusted across Nigeria</span>
            <div className="h-px w-12 bg-paper/20 hidden md:block" />
            {["Lagos", "Abuja", "Kano", "Port Harcourt"].map((city) => (
              <span key={city} className="text-[10px] uppercase tracking-wider text-paper/30 border border-paper/15 px-2.5 sm:px-3 py-1 rounded-full">{city}</span>
            ))}
          </div>

          <h1 className="font-display editorial-heading font-semibold text-paper text-center mb-6 sm:mb-8">
            <span className="block sm:inline">Your shop is</span>{' '}
            <span className="inline-block align-middle mx-0.5 sm:mx-1 md:mx-3 relative top-0.5 sm:top-1 md:top-2">
              <span className="block w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-signal/20 border border-signal/30 overflow-hidden rotate-3">
                <Scissors className="w-5 h-5 sm:w-7 sm:h-7 md:w-10 md:h-10 text-signal absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={1.5} />
              </span>
            </span>{' '}
            <span className="block sm:inline">one link away.</span>
          </h1>

          <p className="text-center text-paper/40 text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4 sm:px-0">
            BRIDGE turns your business into a storefront customers can find, share, and trust — from tailors in Uyo to electricians in Lagos.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 px-4 sm:px-0">
            <Link to="/signup" className="btn-primary px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base inline-flex items-center justify-center gap-2 w-full sm:w-auto">
              List Your Business <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
            </Link>
            <Link to="/explore" className="px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base border border-paper/20 text-paper rounded-full hover:bg-paper/5 transition-colors text-center w-full sm:w-auto">
              Find a Vendor
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 px-4 sm:px-0">
            {categories.slice(0, 5).map((c) => (
              <SignboardTag key={c}>{c}</SignboardTag>
            ))}
          </div>
        </div>

        <div className="absolute bottom-4 sm:bottom-6 left-5 sm:left-6 md:left-12 right-5 sm:right-6 md:right-12 flex justify-between items-end text-[10px] sm:text-xs text-paper/30">
          <span className="max-w-[160px] sm:max-w-[200px] leading-relaxed">Digital infrastructure for local commerce.</span>
          <span className="hidden sm:block">No app download needed</span>
        </div>
      </header>

      {/* WHY BRIDGE */}
      <section className="px-5 sm:px-6 md:px-12 py-16 sm:py-20 md:py-28 max-w-6xl mx-auto">
        <div className="mb-10 sm:mb-12 md:mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-4">Why BRIDGE</p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-semibold text-ink leading-[1.05] tracking-tight">
            Built for local<br className="hidden sm:block" /> businesses.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-x-12">
          {whyBridge.map((item, i) => (
            <div key={item.title} className={`card !bg-transparent !shadow-none !rounded-none border-t border-ink/10 py-5 sm:py-6 md:py-8 group cursor-pointer hover:bg-ink/[0.02] transition-colors ${i === 0 ? 'md:col-span-2' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-ink group-hover:text-signal transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-ink/50 text-sm md:text-base max-w-md leading-relaxed">{item.body}</p>
                </div>
                <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 text-ink/20 group-hover:text-signal transition-colors mt-1 shrink-0" strokeWidth={2} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="bg-ink py-16 sm:py-20 md:py-32 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-signal/15 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/10 rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-10 sm:gap-12 md:gap-20 items-center">
            <div className="order-2 md:order-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-4 sm:mb-6">Browse categories</p>
              <div className="relative h-28 sm:h-32 md:h-40 overflow-hidden mb-6 sm:mb-8">
                {categoryCards.map((c, i) => (
                  <div key={c.name} className={`absolute inset-0 transition-all duration-700 ${
                    i === activeCategory ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                  }`}>
                    <h2 className="font-display text-4xl sm:text-5xl md:text-7xl font-semibold text-paper leading-none">{c.name}</h2>
                    <p className="text-paper/40 mt-3 sm:mt-4 text-base sm:text-lg">Find trusted {c.name.toLowerCase()} vendors near you.</p>
                  </div>
                ))}
              </div>
              <Link to="/explore" className="inline-flex items-center gap-2 text-sm text-paper/50 hover:text-signal transition-colors border border-paper/20 rounded-full px-5 sm:px-6 py-2.5 sm:py-3">
                Explore all <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>

            <div className="order-1 md:order-2 relative aspect-[4/5] sm:aspect-square rounded-2xl sm:rounded-[2rem] overflow-hidden bg-ink border border-paper/10">
              {categoryCards.map((c, i) => {
                const isActive = i === activeCategory;
                const isPrev = i === (activeCategory - 1 + categoryCards.length) % categoryCards.length;
                return (
                  <div key={c.name} className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isActive ? 'translate-y-0 opacity-100 z-10' : 
                    isPrev ? '-translate-y-full opacity-0 z-20' : 'translate-y-full opacity-0 z-0'
                  }`}>
                    <img src={c.img} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-ink/10" />
                  </div>
                );
              })}
              <div className="absolute bottom-5 sm:bottom-6 left-5 sm:left-6 right-5 sm:right-6 flex gap-2 z-30">
                {categoryCards.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${
                    i === activeCategory ? 'flex-1 bg-signal' : 'w-3 bg-paper/30'
                  }`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-5 sm:px-6 md:px-12 py-16 sm:py-20 max-w-5xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink text-center mb-10 sm:mb-14">How BRIDGE works</h2>
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <div className="card border-l-4 border-l-signal">
            <p className="text-xs font-semibold uppercase tracking-widest text-signal mb-4">For vendors</p>
            <ol className="space-y-4 text-ink/70">
              <li className="flex gap-3"><span className="font-display font-semibold text-ink">1</span> Create your store and add what you sell</li>
              <li className="flex gap-3"><span className="font-display font-semibold text-ink">2</span> Get verified so customers trust you</li>
              <li className="flex gap-3"><span className="font-display font-semibold text-ink">3</span> Share your BRIDGE link anywhere — WhatsApp, Instagram, your shop front</li>
            </ol>
          </div>
          <div className="card border-l-4 border-l-gold">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">For customers</p>
            <ol className="space-y-4 text-ink/70">
              <li className="flex gap-3"><span className="font-display font-semibold text-ink">1</span> Search for what you need, nearby or anywhere</li>
              <li className="flex gap-3"><span className="font-display font-semibold text-ink">2</span> See who's verified before you reach out</li>
              <li className="flex gap-3"><span className="font-display font-semibold text-ink">3</span> Contact the vendor directly — no middleman</li>
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 sm:px-6 md:px-12 py-16 sm:py-20">
        <div className="relative max-w-3xl mx-auto bg-ink rounded-2xl sm:rounded-3xl px-6 sm:px-8 md:px-16 py-12 sm:py-16 text-center overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-signal/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gold/20 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-paper mb-4">Ready to be found?</h2>
            <p className="text-paper/60 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">Set up your storefront in minutes and get a link you can share everywhere.</p>
            <Link to="/signup" className="btn-primary inline-block text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4">Create Your Storefront</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink text-paper rounded-t-2xl sm:rounded-t-[2rem] md:rounded-t-[3rem] mt-16 sm:mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-12 pt-12 sm:pt-16 pb-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-12 gap-10 sm:gap-12 mb-16 sm:mb-20">
            <div className="md:col-span-5">
              <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6">Stay updated with BRIDGE news</h3>
              <div className="flex items-center bg-paper/10 rounded-full p-1.5 pl-5 sm:pl-6 mb-5 sm:mb-6 border border-paper/10">
                <input type="email" placeholder="Your Email Address" className="bg-transparent flex-1 text-paper placeholder:text-paper/30 outline-none text-sm min-w-0" />
                <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-signal flex items-center justify-center shrink-0 hover:scale-105 transition-transform">
                  <ArrowUpRight className="w-4 h-4 text-ink" strokeWidth={2} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["WhatsApp", "X", "Instagram"].map((social) => (
                  <a key={social} href="#" className="px-3 py-1.5 rounded-full border border-paper/20 text-xs text-paper/60 hover:border-signal hover:text-signal transition-colors flex items-center gap-1">
                    {social} <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
                  </a>
                ))}
              </div>
            </div>

            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {Object.entries(footerLinks).map(([heading, links], idx) => (
                <div key={heading} className={idx > 0 ? "sm:border-l sm:border-paper/10 sm:pl-8" : ""}>
                  <p className="text-sm font-semibold text-paper mb-4">{heading}</p>
                  <ul className="space-y-2.5">
                    {links.map((l) => (
                      <li key={l.label}>
                        <Link to={l.to} className="text-sm text-paper/50 hover:text-paper transition-colors">{l.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 sm:mb-8 overflow-hidden">
            <span className="font-display text-[14vw] sm:text-[18vw] md:text-[14vw] font-semibold text-paper leading-none tracking-tighter block">
              BRIDGE
            </span>
          </div>

          <div className="border-t border-paper/10 pt-5 sm:pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-paper/30">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
              <span>© {new Date().getFullYear()} BRIDGE.</span>
              <span className="w-1 h-1 rounded-full bg-paper/30" />
              <span>Built for local businesses.</span>
              <span className="w-1 h-1 rounded-full bg-paper/30 hidden sm:block" />
              <Link to="#" className="hover:text-paper hidden sm:block">Privacy Policy</Link>
              <span className="w-1 h-1 rounded-full bg-paper/30 hidden sm:block" />
              <Link to="#" className="hover:text-paper hidden sm:block">Terms of Service</Link>
            </div>
            <span>Made in Nigeria 🇳🇬</span>
          </div>
        </div>
      </footer>
    </div>
  );
}