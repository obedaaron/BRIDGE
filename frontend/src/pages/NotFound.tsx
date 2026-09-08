import { Link } from "react-router-dom";
import { BrandLink } from "../components/BrandLink";

export function NotFound() {
  return <main className="min-h-screen bg-paper text-ink font-body"><nav className="border-b border-ink/10 px-6 py-5"><BrandLink /></nav><section className="max-w-3xl mx-auto px-6 py-20 sm:py-32"><p className="text-xs uppercase tracking-[0.2em] text-signal font-semibold">404</p><h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight mt-4">That page is not here.</h1><p className="mt-5 text-lg text-ink/55">The link may be out of date, or the page may have moved.</p><Link to="/" className="inline-flex mt-8 bg-ink text-paper px-5 py-3 rounded-full text-sm font-medium">Return home</Link></section></main>;
}
