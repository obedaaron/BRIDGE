import { Link2 } from "lucide-react";

type BridgeLoaderProps = {
  label?: string;
  className?: string;
};

export function BridgeLoader({ label = "Loading BRIDGE", className = "" }: BridgeLoaderProps) {
  return <div role="status" aria-live="polite" className={`flex min-h-48 flex-col items-center justify-center gap-4 px-5 py-12 text-center ${className}`}>
    <div className="relative grid h-16 w-16 place-items-center" aria-hidden="true">
      <span className="absolute inset-0 rounded-full border border-current/15" />
      <span className="bridge-loader-orbit absolute inset-1 rounded-full border-2 border-transparent border-t-[#d6ff57] border-r-[#d6ff57]/45" />
      <span className="bridge-loader-mark grid h-9 w-9 place-items-center rounded-xl bg-[#d6ff57] text-[#11110f] shadow-lg shadow-[#d6ff57]/15">
        <Link2 className="h-4 w-4" strokeWidth={2.4} />
      </span>
    </div>
    <div>
      <p className="font-display text-lg font-semibold">BRIDGE is connecting</p>
      <p className="mt-1 text-sm opacity-55">{label}</p>
    </div>
    <span className="sr-only">{label}</span>
  </div>;
}