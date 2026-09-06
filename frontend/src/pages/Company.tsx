import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, BriefcaseBusiness, Handshake, Mail, MapPin, ShieldCheck, Store, Users } from "lucide-react";

const pageContent = {
  "/about": {
    eyebrow: "About BRIDGE", title: "Local businesses deserve to be easy to find.",
    intro: "BRIDGE gives independent businesses a trusted digital storefront and gives customers a clearer way to discover, assess, and work with them.",
  },
  "/careers": {
    eyebrow: "Careers", title: "Help make local commerce work better.",
    intro: "We are building practical infrastructure for the businesses that keep communities moving. If that feels meaningful to you, we would love to hear from you.",
  },
  "/how-it-works": {
    eyebrow: "How it works", title: "A simpler way to find and run a local business.",
    intro: "BRIDGE brings discovery, trust signals, conversation, and protected payments into one straightforward experience.",
  },
} as const;

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-paper text-ink font-body"><nav className="border-b border-ink/10 bg-paper"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between"><Link to="/" className="font-display text-2xl font-bold tracking-tight">BRIDGE</Link><div className="flex items-center gap-4"><Link to="/explore" className="text-sm text-ink/55 hover:text-ink">Explore</Link><Link to="/signup" className="bg-ink text-paper text-sm font-medium px-4 py-2 rounded-full">Get started</Link></div></div></nav>{children}<footer className="border-t border-ink/10 mt-16"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink/45"><Link to="/about">About</Link><Link to="/how-it-works">How it works</Link><Link to="/careers">Careers</Link><Link to="/contact">Contact</Link><Link to="/privacy">Privacy</Link></div></footer></div>;
}

export function CompanyPage() {
  const location = useLocation();
  const content = pageContent[location.pathname as keyof typeof pageContent] || pageContent["/about"];
  const isHowItWorks = location.pathname === "/how-it-works";
  const isCareers = location.pathname === "/careers";
  return <PageShell><main className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24"><p className="text-xs uppercase tracking-[0.2em] font-semibold text-signal mb-4">{content.eyebrow}</p><h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight leading-[.95] max-w-3xl">{content.title}</h1><p className="mt-6 text-lg text-ink/55 leading-relaxed max-w-2xl">{content.intro}</p>{isHowItWorks ? <HowItWorks /> : isCareers ? <Careers /> : <About />}</main></PageShell>;
}

function About() {
  return <><section className="mt-14 grid md:grid-cols-3 gap-5"><Info icon={Store} title="For businesses" body="Create a clear storefront, show customers what you offer, and share one useful link everywhere." /><Info icon={Users} title="For customers" body="Discover businesses by category and location, then see the trust signals that help you choose." /><Info icon={ShieldCheck} title="Built on trust" body="Verification, messaging, reviews, and protected payments help every side transact with more confidence." /></section><section className="mt-16 bg-ink text-paper rounded-3xl p-8 sm:p-12"><p className="text-signal text-xs uppercase tracking-[.2em] font-semibold">Our mission</p><p className="font-display text-3xl sm:text-4xl mt-4 max-w-3xl leading-tight">Make trusted local commerce accessible to every business, wherever it starts.</p></section></>;
}

function HowItWorks() {
  const steps = [["1", "Find or create", "Customers explore local vendors; business owners create a storefront in minutes."], ["2", "Build confidence", "Vendors add their details and complete verification, while customers can review the business profile."], ["3", "Agree in BRIDGE", "Use messages to discuss the work or product and keep the arrangement in one place."], ["4", "Pay with protection", "When a deal is ready, protected payments and the order flow give both sides a clear record."]];
  return <section className="mt-14 grid sm:grid-cols-2 gap-5">{steps.map(([number, title, body]) => <div key={number} className="bg-white border border-ink/10 rounded-2xl p-6 sm:p-8"><p className="font-mono text-signal text-sm">{number}</p><h2 className="font-display text-2xl font-semibold mt-8">{title}</h2><p className="mt-3 text-ink/55 leading-relaxed">{body}</p></div>)}</section>;
}

function Careers() {
  return <section className="mt-14 grid md:grid-cols-[1fr_.8fr] gap-8 items-start"><div className="bg-white border border-ink/10 rounded-2xl p-7 sm:p-9"><BriefcaseBusiness className="w-6 h-6 text-signal" /><h2 className="font-display text-3xl font-semibold mt-6">Open application</h2><p className="mt-3 text-ink/55 leading-relaxed">We do not have a listed role right now, but we welcome thoughtful introductions from people who care about product, engineering, operations, and local commerce.</p><a href="mailto:careers@bridge.ng?subject=Working%20with%20BRIDGE" className="mt-7 inline-flex items-center gap-2 bg-ink text-paper px-5 py-3 rounded-full text-sm font-medium">Introduce yourself <ArrowUpRight className="w-4 h-4" /></a></div><div className="p-6"><Handshake className="w-6 h-6 text-gold" /><h2 className="font-display text-2xl font-semibold mt-5">How we work</h2><p className="mt-3 text-ink/55 leading-relaxed">We value practical thinking, care for local business owners, and products that are simple enough to use on any phone.</p></div></section>;
}

function Info({ icon: Icon, title, body }: { icon: typeof Store; title: string; body: string }) { return <article className="bg-white border border-ink/10 rounded-2xl p-6"><Icon className="w-5 h-5 text-signal" /><h2 className="font-display text-xl font-semibold mt-6">{title}</h2><p className="mt-3 text-sm leading-relaxed text-ink/55">{body}</p></article>; }

export function ContactPage() {
  return <PageShell><main className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24"><p className="text-xs uppercase tracking-[0.2em] font-semibold text-signal mb-4">Contact</p><h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight leading-[.95] max-w-2xl">Let’s talk about local commerce.</h1><p className="mt-6 text-lg text-ink/55 max-w-xl leading-relaxed">For support, partnerships, or general questions, send us a note and the BRIDGE team will get back to you.</p><section className="mt-14 grid md:grid-cols-2 gap-5"><a href="mailto:hello@bridge.ng" className="group bg-white border border-ink/10 rounded-2xl p-7 hover:border-signal transition-colors"><Mail className="w-6 h-6 text-signal" /><p className="font-display text-2xl font-semibold mt-6">Email us</p><p className="mt-2 text-ink/55">hello@bridge.ng</p><span className="mt-6 inline-flex text-sm font-medium text-signal items-center gap-1">Send an email <ArrowUpRight className="w-4 h-4" /></span></a><div className="bg-ink text-paper rounded-2xl p-7"><MapPin className="w-6 h-6 text-signal" /><p className="font-display text-2xl font-semibold mt-6">Built for Nigeria</p><p className="mt-2 text-paper/55 leading-relaxed">BRIDGE connects customers and independent businesses across the country.</p></div></section></main></PageShell>;
}
