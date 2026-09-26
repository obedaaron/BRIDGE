import type { ReactNode } from "react";
import { ArrowUpRight, MapPin, Sparkles, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLink } from "./BrandLink";

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="auth-shell min-h-screen overflow-hidden bg-[#11110f] font-body text-[#f1eee7]">
      <style>{`
        .auth-input { width: 100%; border: 1px solid rgba(255,255,255,.16); border-radius: 14px; background: rgba(255,255,255,.045); padding: .95rem 1rem; color: #f1eee7; outline: none; transition: border-color .2s ease, background-color .2s ease, box-shadow .2s ease; }
        .auth-input::placeholder { color: rgba(241,238,231,.36); }
        .auth-input:focus { border-color: #d6ff57; background: rgba(255,255,255,.075); box-shadow: 0 0 0 3px rgba(214,255,87,.1); }
        .auth-input:focus-visible, .auth-control:focus-visible { outline: 2px solid #d6ff57; outline-offset: 3px; }
        .auth-art-grid { background-image: linear-gradient(rgba(214,255,87,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(214,255,87,.07) 1px, transparent 1px); background-size: 28px 28px; mask-image: linear-gradient(to bottom, black, transparent); }
        @media (prefers-reduced-motion: no-preference) { .auth-float { animation: authFloat 6s ease-in-out infinite; } .auth-float-delay { animation: authFloat 7s ease-in-out -2s infinite; } }
        @keyframes authFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>
      <div className="mx-auto min-h-screen max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 py-5 sm:py-6">
          <BrandLink tone="paper" />
          <Link to="/explore" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/65 transition-colors hover:border-[#d6ff57]/50 hover:text-[#d6ff57] sm:text-sm">
            Explore BRIDGE <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        <main className="grid items-center gap-8 pb-8 pt-6 sm:pt-10 lg:min-h-[calc(100vh-81px)] lg:grid-cols-[1.04fr_.96fr] lg:gap-14 lg:py-10">
          <section className="relative hidden min-h-[330px] lg:flex flex-col justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-[#191a16] px-6 py-8 sm:min-h-[410px] sm:px-10 sm:py-10 lg:min-h-[620px] lg:px-12">
            <div className="auth-art-grid pointer-events-none absolute inset-0 opacity-70" />
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-[#d6ff57]/20 sm:h-80 sm:w-80" />
            <div className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full border border-[#d6ff57]/15 sm:h-64 sm:w-64" />
            <div className="relative z-10 max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#d6ff57]/20 bg-[#d6ff57]/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#d6ff57]">
                <Sparkles className="h-3.5 w-3.5" /> The local business network
              </p>
              <h2 className="mt-5 max-w-lg font-display text-[clamp(2.7rem,6vw,5.2rem)] font-semibold leading-[.88] tracking-[-.075em]">
                Good work deserves to be <span className="text-[#d6ff57]">found.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
                Real storefronts, useful details, and a direct line to the people who can help.
              </p>
            </div>

            <div className="relative z-10 mt-8 min-h-[138px] max-w-lg sm:mt-10 sm:min-h-[170px]">
              <div className="absolute bottom-0 left-4 right-10 top-5 rounded-[1.5rem] bg-[#d6ff57] sm:left-8 sm:right-14" />
              <div className="absolute left-0 top-0 w-[min(82%,340px)] rounded-2xl border border-white/10 bg-[#24251f] p-4 shadow-[0_22px_60px_rgba(0,0,0,.35)] sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#d6ff57] text-[#11110f]"><Store className="h-5 w-5" /></div>
                  <div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[.2em] text-[#d6ff57]">A storefront nearby</p><p className="mt-1 truncate font-display text-lg font-semibold">Made for your next find</p></div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/50"><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#d6ff57]" /> Across Nigeria</span><span className="rounded-full bg-white/5 px-2.5 py-1">Discover</span></div>
              </div>
              <div className="absolute bottom-0 right-0 rounded-xl border border-[#11110f]/10 bg-[#f1eee7] px-3 py-2.5 text-[#11110f] shadow-lg sm:right-2 sm:px-4">
                <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#11110f]/45">Built on trust</p>
                <p className="mt-1 font-display text-sm font-semibold">Connect with confidence <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></p>
              </div>
            </div>

            <div className="absolute bottom-6 right-7 hidden h-2 w-2 rounded-full bg-[#d6ff57] shadow-[0_0_24px_8px_rgba(214,255,87,.28)] sm:block" />
          </section>

          <section className="flex items-center justify-center py-2 sm:py-4 lg:py-8">
            <div className="w-full max-w-[520px] rounded-[1.75rem] border border-white/10 bg-[#191a16] p-6 shadow-[0_30px_90px_rgba(0,0,0,.28)] sm:p-9 lg:p-10">
              <div className="mb-8">
                <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#d6ff57]">Your BRIDGE account</p>
                <h1 className="mt-4 font-display text-3xl font-semibold leading-[.96] tracking-[-.055em] sm:text-4xl">{title}</h1>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">{subtitle}</p>
              </div>
              <div>{children}</div>
              <div className="mt-7 border-t border-white/10 pt-5 text-sm text-white/55">{footer}</div>
            </div>
          </section>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 py-4 text-[10px] uppercase tracking-[.13em] text-white/30 sm:text-xs">
          <span>BRIDGE · Local business, brought closer</span><span>Built for Nigeria</span>
        </footer>
      </div>
    </div>
  );
}