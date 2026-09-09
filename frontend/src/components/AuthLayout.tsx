import type { ReactNode } from "react";
import { Building2, CheckCircle2, MapPin } from "lucide-react";
import { BrandLink } from "./BrandLink";

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4ede2] text-ink font-body">
      <div className="mx-auto grid min-h-screen max-w-7xl md:grid-cols-[0.9fr_1.1fr] md:border-x md:border-ink/10">
        <section className="flex flex-col px-5 py-5 sm:px-8 md:min-h-screen md:border-r md:border-ink/10 md:px-12 md:py-10">
          <BrandLink />
          <div className="my-auto max-w-md py-12 md:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2E8B72]">BRIDGE account</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.96] tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-5 text-base leading-relaxed text-ink/60">{subtitle}</p>
            <div className="mt-9 border border-ink/15 bg-paper p-5 sm:p-6">{children}</div>
            <div className="mt-6 text-sm text-ink/55">{footer}</div>
          </div>
        </section>
        <aside className="hidden bg-[#2E8B72] p-12 text-paper md:flex md:flex-col md:justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E5B35C]">Local business, clearly connected</p>
          <div>
            <h2 className="max-w-md font-display text-5xl font-semibold leading-[1.02] tracking-tight">A straightforward place to run your business online.</h2>
            <div className="mt-12 grid gap-px border border-paper/20 bg-paper/20 sm:grid-cols-3">
              {[{ icon: Building2, label: "Storefront" }, { icon: CheckCircle2, label: "Trust" }, { icon: MapPin, label: "Reach" }].map(({ icon: Icon, label }) => <div key={label} className="bg-[#2E8B72] p-5"><Icon className="h-5 w-5 text-[#E5B35C]" /><p className="mt-8 text-sm font-semibold">{label}</p></div>)}
            </div>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-paper/60">Create a storefront, keep it up to date, and give customers the information they need to choose you.</p>
        </aside>
      </div>
    </div>
  );
}