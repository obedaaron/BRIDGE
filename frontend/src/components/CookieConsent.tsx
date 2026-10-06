import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, Settings2, X } from "lucide-react";

type Consent = { essential: true; analytics: boolean; savedAt: string };
const storageKey = "bridge-cookie-consent-v1";

export function openCookieSettings() {
  window.dispatchEvent(new Event("bridge-open-cookie-settings"));
}

function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(storageKey);
    if (!value) return null;
    const parsed = JSON.parse(value);
    if (parsed?.essential === true && typeof parsed.analytics === "boolean") return parsed as Consent;
  } catch { /* Consent can be saved again if storage is unavailable or invalid. */ }
  return null;
}

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(readConsent);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);

  useEffect(() => {
    const openSettings = () => {
      const saved = readConsent();
      setConsent(saved);
      setAnalytics(saved?.analytics ?? false);
      setSettingsOpen(true);
    };
    window.addEventListener("bridge-open-cookie-settings", openSettings);
    return () => window.removeEventListener("bridge-open-cookie-settings", openSettings);
  }, []);
  const [dark] = useState(() => {
    try { return localStorage.getItem("bridge-theme") !== "light"; } catch { return true; }
  });

  function save(allowAnalytics: boolean) {
    const next: Consent = { essential: true, analytics: allowAnalytics, savedAt: new Date().toISOString() };
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep the banner usable when storage is unavailable. */ }
    setConsent(next);
    setSettingsOpen(false);
  }

  const shell = dark ? "border-white/15 bg-[#171714] text-[#f1eee7]" : "border-[#171714]/15 bg-white text-[#171714]";
  const muted = dark ? "text-white/65" : "text-[#171714]/65";
  const subtle = dark ? "border-white/15 bg-white/[.04]" : "border-[#171714]/15 bg-[#f6f2ea]";

  if (consent && !settingsOpen) return null;

  return <section role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-description" className={`fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-3 right-3 z-[80] mx-auto max-w-md rounded-2xl border p-3 shadow-2xl sm:bottom-5 sm:left-5 sm:right-auto sm:p-5 ${shell}`}>
    <div className="flex items-start gap-3">
      <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d6ff57]/20 text-[#9aba32] sm:grid"><Cookie className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2"><h2 id="cookie-title" className="font-display text-base font-semibold">Your privacy matters</h2>{consent && <button onClick={() => setSettingsOpen(false)} aria-label="Close cookie settings" className={`grid h-8 w-8 place-items-center rounded-full hover:bg-black/5 ${muted}`}><X className="h-4 w-4" /></button>}</div>
        <p id="cookie-description" className={`mt-1 text-xs leading-5 ${muted}`}>Essential browser storage keeps BRIDGE working, including sign-in, cart and theme preferences. Choose whether to allow optional analytics cookies. <Link to="/privacy" className="font-semibold text-[#2e8b72] underline underline-offset-2">Privacy policy</Link></p>
      </div>
    </div>
    {settingsOpen && <div className={`mt-4 space-y-3 rounded-xl border p-3 ${subtle}`}>
      <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">Essential storage</p><p className={`mt-0.5 text-xs ${muted}`}>Required for sign-in, cart and site preferences.</p></div><span className="shrink-0 rounded-full bg-[#2e8b72]/15 px-2.5 py-1 text-xs font-semibold text-[#2e8b72]">Always on</span></div>
      <label className="flex cursor-pointer items-center justify-between gap-4"><span><span className="block text-sm font-semibold">Optional analytics</span><span className={`mt-0.5 block text-xs ${muted}`}>Allow analytics cookies to help improve BRIDGE.</span></span><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="h-4 w-4 accent-[#2e8b72]" /></label>
    </div>}
    <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
      {!settingsOpen ? <><button onClick={() => save(false)} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-black/5 sm:px-4 sm:py-2.5 sm:text-sm ${subtle}`}>Essential only</button><button onClick={() => save(true)} className="rounded-xl bg-[#d6ff57] px-3 py-2 text-xs font-bold text-[#11110f] transition hover:brightness-95 sm:px-4 sm:py-2.5 sm:text-sm">Accept all</button><button onClick={() => setSettingsOpen(true)} className={`col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${muted} sm:col-span-1 sm:py-2.5 sm:text-sm`}><Settings2 className="h-4 w-4" />Settings</button></> : <><button onClick={() => save(false)} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5 ${subtle}`}>Reject optional</button><button onClick={() => save(analytics)} className="rounded-xl bg-[#d6ff57] px-4 py-2.5 text-sm font-bold text-[#11110f] transition hover:brightness-95">Save preferences</button></>}
    </div>
  </section>;
}
