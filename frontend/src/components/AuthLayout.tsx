import type { ReactNode } from "react";
import { BrandLink } from "./BrandLink";

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#11110f] font-body text-[#f1eee7]">
      <style>{`
        .auth-input { width: 100%; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.055); padding: 1rem 1.1rem; color: #f1eee7; outline: none; transition: border-color .2s ease, background-color .2s ease; }
        .auth-input::placeholder { color: rgba(255,255,255,.38); }
        .auth-input:focus { border-color: #d6ff57; background: rgba(255,255,255,.08); }
        .auth-input:focus-visible, .auth-control:focus-visible { outline: 2px solid #d6ff57; outline-offset: 3px; }
      `}</style>
      <div className="mx-auto grid min-h-screen max-w-[1440px] border-x border-white/15 lg:grid-cols-[0.94fr_1.06fr]">
        <section className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
          <div><BrandLink tone="paper" /></div>
          <div className="my-auto max-w-md py-12 sm:py-16 lg:py-20"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6ff57]">BRIDGE account</p><h1 className="mt-5 font-display text-4xl font-semibold leading-[0.9] tracking-[-0.07em] sm:text-6xl">{title}</h1><p className="mt-6 max-w-sm leading-relaxed text-white/60">{subtitle}</p><div className="mt-10 border-t border-white/15 pt-7">{children}</div><div className="mt-7 border-t border-white/10 pt-5 text-sm text-white/55">{footer}</div></div>
          <p className="text-xs text-white/35">BRIDGE. Built for local business.</p>
        </section>
        <aside className="relative hidden overflow-hidden border-l border-white/15 bg-[#d6ff57] p-12 text-[#11110f] lg:flex lg:flex-col lg:justify-between"><div className="absolute -right-24 -top-20 h-80 w-80 rounded-full border-[32px] border-[#11110f]/10" /><div className="relative"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#11110f]/55">A clear front door for your work</p><h2 className="mt-6 max-w-xl font-display text-6xl font-semibold leading-[0.82] tracking-[-0.08em]">Make it easy for the right people to find you.</h2></div><div className="relative grid grid-cols-3 border border-[#11110f]/20"><div className="border-r border-[#11110f]/20 p-5"><span className="text-xs font-semibold uppercase tracking-[0.15em]">01</span><p className="mt-12 font-display text-2xl font-semibold leading-none">Show up</p></div><div className="border-r border-[#11110f]/20 p-5"><span className="text-xs font-semibold uppercase tracking-[0.15em]">02</span><p className="mt-12 font-display text-2xl font-semibold leading-none">Be clear</p></div><div className="p-5"><span className="text-xs font-semibold uppercase tracking-[0.15em]">03</span><p className="mt-12 font-display text-2xl font-semibold leading-none">Get chosen</p></div></div><p className="relative max-w-sm text-sm leading-relaxed text-[#11110f]/65">Set up your storefront once, then keep the work, details, and customer conversations in one place.</p></aside>
      </div>
    </div>
  );
}