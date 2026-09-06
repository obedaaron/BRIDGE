import type { ReactNode } from "react";
import { SignboardTag } from "./SignboardTag";
import { BrandLink } from "./BrandLink";

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-paper font-body relative overflow-hidden">
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
      `}</style>
      <div className="grain-overlay" />

      <div className="relative z-10 min-h-screen grid md:grid-cols-2">
        {/* Left: Form */}
        <div className="flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 relative">
          <BrandLink tone="paper" className="mb-12 md:mb-16 opacity-80 hover:opacity-100 transition-opacity" />

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-paper leading-[0.95] tracking-tight">
            {title}
          </h1>
          <p className="mt-4 text-paper/40 text-base md:text-lg max-w-sm leading-relaxed">
            {subtitle}
          </p>

          <div className="mt-10 max-w-sm w-full">
            {children}
          </div>

          <div className="mt-8 text-sm text-paper/30">
            {footer}
          </div>
        </div>

        {/* Right: Editorial panel */}
        <div className="hidden md:flex relative flex-col justify-center items-center px-12 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-signal/20 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/15 rounded-full blur-3xl opacity-30" />
          <div className="absolute inset-0 bg-ink/50" />

          <div className="relative z-10 text-center max-w-sm">
            <div className="flex flex-wrap gap-3 justify-center mb-10">
              <SignboardTag color="gold">Verified Vendor</SignboardTag>
              <SignboardTag color="signal">Tailoring</SignboardTag>
              <SignboardTag color="gold">Near You</SignboardTag>
              <SignboardTag color="signal">Photography</SignboardTag>
              <SignboardTag color="gold">Electrical</SignboardTag>
            </div>

            <p className="font-display text-paper text-3xl lg:text-4xl font-semibold text-center leading-tight">
              Every shop,<br />one trusted link.
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-paper/30 uppercase tracking-[0.2em]">
              <span className="w-8 h-px bg-paper/20" />
              <span>Built for Nigeria</span>
              <span className="w-8 h-px bg-paper/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
