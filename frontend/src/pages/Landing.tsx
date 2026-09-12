import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Camera,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Search as SearchIcon,
  Shirt,
  UtensilsCrossed,
  Wrench,
  X,
  Zap,
} from "lucide-react";

const cities = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano"];

// Background icon layer for the hero — faint, drifting versions of the
// category icons, purely decorative (aria-hidden, pointer-events-none).
const heroIcons = [
  { icon: Scissors, top: "14%", left: "7%", size: 30, duration: "19s", delay: "0s" },
  { icon: Zap, top: "68%", left: "90%", size: 24, duration: "23s", delay: "2s" },
  { icon: Camera, top: "38%", left: "94%", size: 34, duration: "21s", delay: "4s" },
  { icon: Shirt, top: "82%", left: "16%", size: 26, duration: "25s", delay: "1s" },
  { icon: UtensilsCrossed, top: "10%", left: "84%", size: 22, duration: "20s", delay: "3s" },
  { icon: Wrench, top: "56%", left: "4%", size: 28, duration: "22s", delay: "5s" },
];

const categories = [
  {
    name: "Tailoring",
    slug: "tailoring",
    icon: Scissors,
    description: "Custom fits, alterations, and made-to-measure pieces from tailors near you.",
    image:
      "https://images.unsplash.com/photo-1752946253686-a15088ab0b8f?auto=format&fit=crop&w=1600&q=70",
  },
  {
    name: "Electrical",
    slug: "electrical",
    icon: Zap,
    description: "Wiring, installations, and repairs from electricians who show up on time.",
    image:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1600&q=70",
  },
  {
    name: "Photography",
    slug: "photography",
    icon: Camera,
    description: "Portraits, events, and product shoots from photographers who know the city.",
    image:
      "https://images.unsplash.com/photo-1577369867409-5cdd9d24a03a?auto=format&fit=crop&w=1600&q=70",
  },
  {
    name: "Fashion",
    slug: "fashion",
    icon: Shirt,
    description: "Designers and boutiques making original pieces for every size and style.",
    image:
      "https://images.unsplash.com/photo-1761090617068-f1b3257d27ad?auto=format&fit=crop&w=1600&q=70",
  },
  {
    name: "Catering",
    slug: "catering",
    icon: UtensilsCrossed,
    description: "Home cooks and catering teams for parties, offices, and everyday meals.",
    image:
      "https://images.unsplash.com/photo-1742436448781-fe5eb077abd4?auto=format&fit=crop&w=1600&q=70",
  },
  {
    name: "Mechanics",
    slug: "mechanics",
    icon: Wrench,
    description: "Diagnostics, repairs, and maintenance from mechanics who know your make.",
    image:
      "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1600&q=70",
  },
];

const steps = [
  {
    title: "Search",
    description:
      "Tell BRIDGE what you need and where you're looking. The list narrows to businesses that actually fit.",
  },
  {
    title: "Compare",
    description:
      "Every storefront lists services, pricing ranges, location, and reviews, so you can decide before you reach out.",
  },
  {
    title: "Connect",
    description:
      "Message the business directly through BRIDGE and keep the conversation, and the details, in one place.",
  },
];

const footerColumns = [
  {
    heading: "Explore",
    links: [
      { label: "Browse businesses", to: "/explore" },
      { label: "How it works", to: "/how-it-works" },
      { label: "Categories", to: "/explore" },
      { label: "Cities we cover", to: "/explore" },
    ],
  },
  {
    heading: "For business owners",
    links: [
      { label: "Create a storefront", to: "/signup" },
      { label: "Get verified", to: "/how-it-works" },
      { label: "Pricing", to: "/pricing" },
      { label: "Sign in", to: "/login" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About BRIDGE", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Terms", to: "/terms" },
      { label: "Privacy", to: "/privacy" },
    ],
  },
];

export function Landing() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Lagos");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categories[0].name);
  const [openStep, setOpenStep] = useState<number | null>(0);
  const [rotationPaused, setRotationPaused] = useState(false);
  const rotationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FIX: auto-rotation now pauses while the user is interacting with the
  // category showcase (hover, keyboard focus, or touch on mobile), so it
  // no longer yanks away content someone is actively reading. This also
  // addresses the WCAG 2.2.2 (Pause, Stop, Hide) concern with
  // auto-updating content.
  useEffect(() => {
    if (rotationPaused) return;

    rotationTimer.current = setTimeout(() => {
      setSelectedCategory((current) => {
        const currentIndex = categories.findIndex((category) => category.name === current);
        const nextIndex = (currentIndex + 1) % categories.length;
        return categories[nextIndex].name;
      });
    }, 5000);

    return () => {
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    };
  }, [selectedCategory, rotationPaused]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function explore(event?: FormEvent) {
    event?.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city) params.set("city", city);
    navigate(`/explore${params.size ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="min-h-screen bg-[#11110f] font-body text-[#f1eee7]">
      <style>{`
        @keyframes heroIconDrift {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          25% { transform: translate(8px, -12px) rotate(4deg); }
          50% { transform: translate(-6px, -20px) rotate(-3deg); }
          75% { transform: translate(-10px, -6px) rotate(2deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }
        .hero-drift-icon {
          animation-name: heroIconDrift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes heroGridDraw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        .hero-grid-line {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: heroGridDraw 1.6s ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-drift-icon { animation: none; }
          .hero-grid-line { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>
      <header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6">
        <div
          className={`mx-auto flex max-w-[1240px] items-center justify-between rounded-full border border-white/15 bg-[#171714]/90 backdrop-blur-md transition-all duration-300 ${
            scrolled ? "px-5 py-2.5 shadow-lg shadow-black/30" : "px-6 py-3.5"
          }`}
        >
          <Link to="/" className="flex items-center gap-2.5" aria-label="BRIDGE home">
            <img src="/logo.png" alt="" className="h-7 w-7 object-contain invert" />
            <span className="font-display text-lg font-bold tracking-[-0.06em]">BRIDGE</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-white/65 md:flex">
            <Link to="/explore" className="transition-colors hover:text-white">
              Explore
            </Link>
            <Link to="/how-it-works" className="transition-colors hover:text-white">
              How it works
            </Link>
            <Link to="/about" className="transition-colors hover:text-white">
              About BRIDGE
            </Link>
          </nav>
          <div className="hidden items-center gap-4 text-sm md:flex">
            {user ? <><Link to="/dashboard" className="inline-flex items-center gap-2 text-white/70 transition-colors hover:text-white"><LayoutDashboard className="h-4 w-4" />Dashboard</Link><button onClick={logout} className="inline-flex items-center gap-2 text-white/70 transition-colors hover:text-white"><LogOut className="h-4 w-4" />Log out</button></> : <><Link to="/login" className="text-white/70 transition-colors hover:text-white">Sign in</Link><Link to="/signup" className="rounded-full bg-[#d6ff57] px-4 py-2 font-semibold text-[#11110f] transition-colors hover:bg-[#ecffad]">Create a store</Link></>}
          </div>
          <button
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="mx-auto mt-2 max-w-[1240px] rounded-3xl border border-white/15 bg-[#171714] p-5 text-sm text-white/75 md:hidden">
            <div className="flex flex-col gap-4">
              <Link to="/explore" onClick={() => setMobileOpen(false)}>
                Explore
              </Link>
              <Link to="/how-it-works" onClick={() => setMobileOpen(false)}>
                How it works
              </Link>
              <Link to="/about" onClick={() => setMobileOpen(false)}>
                About BRIDGE
              </Link>
              <div className="mt-2 flex items-center gap-4 border-t border-white/10 pt-4">
                {user ? <><Link to="/dashboard" onClick={() => setMobileOpen(false)} className="inline-flex items-center gap-2 text-white/70"><LayoutDashboard className="h-4 w-4" />Dashboard</Link><button onClick={logout} className="inline-flex items-center gap-2 text-white/70"><LogOut className="h-4 w-4" />Log out</button></> : <><Link to="/login" className="text-white/70">Sign in</Link><Link to="/signup" className="rounded-full bg-[#d6ff57] px-4 py-2 font-semibold text-[#11110f]">Create a store</Link></>}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="pt-32">
        <section className="relative mx-auto max-w-[1440px] overflow-hidden border-x border-white/15 px-5 pb-16 sm:px-8 lg:px-12">
          {/*
            Decorative background layer: drifting category icons + a
            self-drawing grid. aria-hidden + pointer-events-none so it
            never interferes with content or a11y. Hidden below md so the
            mobile hero (dominated by the big headline) stays clean.
          */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 hidden md:block"
          >
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {[20, 40, 60, 80].map((x, i) => (
                <line
                  key={`v-${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  vectorEffect="non-scaling-stroke"
                  stroke="#d6ff57"
                  strokeOpacity="0.08"
                  pathLength="1"
                  className="hero-grid-line"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
              {[25, 50, 75].map((y, i) => (
                <line
                  key={`h-${y}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  vectorEffect="non-scaling-stroke"
                  stroke="#d6ff57"
                  strokeOpacity="0.08"
                  pathLength="1"
                  className="hero-grid-line"
                  style={{ animationDelay: `${0.4 + i * 0.15}s` }}
                />
              ))}
            </svg>

            {heroIcons.map(({ icon: Icon, top, left, size, duration, delay }, index) => (
              <Icon
                key={index}
                style={{
                  top,
                  left,
                  width: size,
                  height: size,
                  animationDuration: duration,
                  animationDelay: delay,
                }}
                className="hero-drift-icon absolute text-[#d6ff57]/[0.09]"
              />
            ))}
          </div>

          <div className="relative z-10">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#d6ff57]">
              Built for local business
            </p>
            <h1 className="max-w-6xl font-display text-[clamp(3.2rem,8.5vw,8.5rem)] font-semibold leading-[0.85] tracking-[-0.07em]">
              Find the people who know the work.
            </h1>
            <p className="mt-8 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
              Real businesses, clear storefronts, and enough detail to choose with confidence. Built
              for the way Nigeria gets things done.
            </p>

            <form
              onSubmit={explore}
              className="mt-10 grid max-w-3xl overflow-hidden rounded-2xl border border-white/20 bg-[#1b1b18] sm:grid-cols-[1.4fr_0.8fr_auto]"
            >
              <label className="border-b border-white/15 px-5 py-4 sm:border-b-0 sm:border-r">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  I need a
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="mt-1 w-full bg-transparent text-base text-white outline-none placeholder:text-white/55"
                  placeholder="Tailor, caterer, electrician"
                  aria-label="Business or service"
                />
              </label>
              <label className="border-b border-white/15 px-5 py-4 sm:border-b-0 sm:border-r">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  In
                </span>
                <select
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="mt-1 w-full appearance-none bg-transparent text-base text-white outline-none"
                >
                  {cities.map((name) => (
                    <option key={name} className="bg-[#1b1b18]" value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-[#d6ff57] px-7 py-5 text-sm font-semibold text-[#11110f] transition-colors hover:bg-[#ecffad]"
              >
                <SearchIcon className="h-4 w-4" />
                Search
              </button>
            </form>
          </div>
        </section>

        <section className="border-y border-white/15 bg-[#e9e4da] text-[#11110f]">
          <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
            <div className="max-w-xl">
              <h2 className="font-display text-4xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-5xl">
                Start with what you need.
              </h2>
              <p className="mt-5 leading-relaxed text-[#11110f]/60">
                Each category leads to businesses that have put the useful details in one place.
              </p>
            </div>

            <div
              className="mt-10 grid gap-3 lg:grid-cols-[240px_1fr] lg:gap-8"
              onMouseEnter={() => setRotationPaused(true)}
              onMouseLeave={() => setRotationPaused(false)}
              onTouchStart={() => setRotationPaused(true)}
            >
              {/*
                FIX: added snap-x/snap-start so the horizontal chip scroller
                on mobile settles cleanly on a chip instead of stopping
                mid-item — same layout, just a smoother touch-scroll feel.
                No visual/design change.
              */}
              <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scroll-px-1 lg:flex-col lg:overflow-visible lg:pb-0 lg:snap-none">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const active = selectedCategory === category.name;
                  return (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      onFocus={() => setRotationPaused(true)}
                      onBlur={() => setRotationPaused(false)}
                      className={`flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors snap-start lg:shrink ${
                        active
                          ? "border-[#11110f] bg-[#11110f] text-[#f1eee7]"
                          : "border-[#11110f]/15 bg-[#f1eee7] text-[#11110f] hover:border-[#11110f]/40"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="whitespace-nowrap text-sm font-semibold">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-[#11110f] sm:aspect-[16/7]">
                {categories.map((category) => {
                  const active = selectedCategory === category.name;
                  return (
                    <div
                      key={category.name}
                      aria-hidden={!active}
                      className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ease-out ${
                        active ? "opacity-100" : "pointer-events-none opacity-0"
                      }`}
                      style={{ backgroundImage: `url(${category.image})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-[#11110f] via-[#11110f]/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-10">
                        <div className="max-w-md">
                          <h3 className="font-display text-3xl font-semibold tracking-[-0.05em] text-[#f1eee7] sm:text-4xl">
                            {category.name}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-white/70 sm:text-base">
                            {category.description}
                          </p>
                        </div>
                        <Link
                          to={`/explore?category=${category.slug}`}
                          className="shrink-0 rounded-full bg-[#d6ff57] px-5 py-2.5 text-sm font-semibold text-[#11110f] transition-colors hover:bg-[#ecffad]"
                        >
                          Explore {category.name}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] border-x border-white/15 lg:grid-cols-2">
          <article className="border-b border-white/15 p-8 sm:p-12 lg:border-b-0 lg:border-r lg:p-16">
            <span className="text-sm font-semibold text-[#d6ff57]">For customers</span>
            <h2 className="mt-5 max-w-md font-display text-4xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-5xl">
              A better way to find your person.
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-white/60">
              Browse services, compare store details, see proof of work, and reach out when the
              fit feels right.
            </p>
            <Link
              to="/explore"
              className="mt-8 inline-block rounded-full bg-[#f1eee7] px-5 py-3 text-sm font-semibold text-[#11110f] transition-colors hover:bg-[#d6ff57]"
            >
              Find a business
            </Link>
          </article>
          <article className="bg-[#25251f] p-8 sm:p-12 lg:p-16">
            <span className="text-sm font-semibold text-[#ca5b42]">For business owners</span>
            <h2 className="mt-5 max-w-md font-display text-4xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-5xl">
              Your business deserves a proper front door.
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-white/60">
              Make it easy for customers to understand what you offer, where you work, and how to
              get in touch.
            </p>
            <Link
              to="/signup"
              className="mt-8 inline-block rounded-full bg-[#d6ff57] px-5 py-3 text-sm font-semibold text-[#11110f] transition-colors hover:bg-[#ecffad]"
            >
              Create your storefront
            </Link>
          </article>
        </section>

        <section className="mx-auto max-w-[1440px] border-x border-t border-white/15 px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <h2 className="font-display text-4xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-5xl">
                How BRIDGE works.
              </h2>
              <p className="mt-5 max-w-sm leading-relaxed text-white/60">
                Three steps between not knowing anyone and having someone reliable lined up.
              </p>
            </div>
            <div className="border-y border-white/15">
              {steps.map((step, index) => {
                const open = openStep === index;
                return (
                  <div key={step.title} className="border-b border-white/15 last:border-b-0">
                    <button
                      onClick={() => setOpenStep(open ? null : index)}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left"
                      aria-expanded={open}
                    >
                      <span className="flex items-center gap-5">
                        <span className="font-display text-2xl font-semibold text-white/30">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="font-display text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                          {step.title}
                        </span>
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-white/50 transition-transform duration-200 ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {open && (
                      <p className="max-w-xl pb-6 leading-relaxed text-white/60">
                        {step.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/15">
          <img
            src="https://images.unsplash.com/photo-1687422808311-a776f467a468?auto=format&fit=crop&w=2000&q=70"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[75%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#11110f] via-[#11110f]/85 to-[#11110f]/20" />
          <div className="absolute inset-0 bg-[#ca5b42] mix-blend-color opacity-70" />

          <div className="relative mx-auto max-w-[1440px] border-x border-white/10 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
            <p className="text-sm font-semibold text-[#d6ff57]">BRIDGE is open for business</p>
            <h2 className="mt-5 max-w-2xl font-display text-5xl font-semibold leading-[0.85] tracking-[-0.07em] text-[#f1eee7] sm:text-7xl">
              Put your work where people can find it.
            </h2>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="rounded-full bg-[#d6ff57] px-6 py-4 text-sm font-semibold text-[#11110f] transition-colors hover:bg-[#ecffad]"
              >
                Set up your store
              </Link>
              <Link
                to="/explore"
                className="rounded-full border-2 border-[#f1eee7]/70 px-6 py-4 text-sm font-semibold text-[#f1eee7] transition-colors hover:border-[#f1eee7] hover:bg-[#f1eee7] hover:text-[#11110f]"
              >
                Find a business
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/15">
        <div className="mx-auto max-w-[1440px] border-x border-white/15 px-5 pb-10 pt-16 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1.9fr]">
            <div>
              <Link to="/" className="flex items-center gap-2.5" aria-label="BRIDGE home">
                <img src="/logo.png" alt="" className="h-7 w-7 object-contain invert" />
                <span className="font-display text-xl font-bold tracking-[-0.06em]">BRIDGE</span>
              </Link>
              <p className="mt-5 max-w-xs leading-relaxed text-white/50">
                The local business network. Real storefronts, clear details, and a straight line
                to the person who can do the work.
              </p>
              <Link
                to="/signup"
                className="mt-6 inline-block rounded-full bg-[#d6ff57] px-5 py-2.5 text-sm font-semibold text-[#11110f] transition-colors hover:bg-[#ecffad]"
              >
                Create a store
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {footerColumns.map((column) => (
                <div key={column.heading}>
                  <p className="text-sm font-semibold text-[#f1eee7]">{column.heading}</p>
                  <ul className="mt-4 flex flex-col gap-3 text-sm text-white/50">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link to={link.to} className="transition-colors hover:text-white">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <span>BRIDGE. Built for local business.</span>
            <div className="flex gap-5">
              <Link to="/terms" className="transition-colors hover:text-white">
                Terms
              </Link>
              <Link to="/privacy" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link to="/contact" className="transition-colors hover:text-white">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}