import { Link, useLocation } from "react-router-dom";
import { BrandLink } from "../components/BrandLink";

type Section = { title: string; body: string };
const policies: Record<string, { title: string; intro: string; sections: Section[] }> = {
  "/terms": { title: "Terms of Service", intro: "These draft terms govern use of BRIDGE’s marketplace and protected-payment features.", sections: [
    { title: "Using BRIDGE", body: "You must provide accurate account information, keep your account secure, and use BRIDGE only for lawful goods and services." },
    { title: "Protected orders", body: "A protected order is formed only when its agreed amount is accepted and paid through BRIDGE. Buyers should confirm delivery only after receiving what was agreed." },
    { title: "Seller responsibilities", body: "Sellers must accurately describe listings, honour accepted orders, provide genuine delivery evidence, and maintain an eligible payout account." },
    { title: "Outside payments", body: "Do not send or accept payment outside BRIDGE for a deal started here. BRIDGE cannot protect or investigate negotiations or transactions completed outside the platform." },
    { title: "Disputes and enforcement", body: "BRIDGE may pause orders, funds, listings, or accounts while investigating a dispute, fraud alert, policy breach, or legal request." },
  ] },
  "/privacy": { title: "Privacy Policy", intro: "This draft explains how BRIDGE handles the information needed to run a trusted marketplace.", sections: [
    { title: "Information we collect", body: "This includes account, store, order, payment-reference, support, verification, and device/security information you provide or generate while using BRIDGE." },
    { title: "Identity evidence", body: "NIN documents and face photos are held in private storage for manual identity review. BRIDGE does not store the full NIN typed into the verification form or create biometric templates from the face photo." },
    { title: "Why we use information", body: "We use it to operate orders and wallets, prevent fraud, verify vendors, provide support, meet legal obligations, and improve the service." },
    { title: "Access and retention", body: "Access to verification evidence is restricted to the vendor and authorised reviewers. Retention periods, deletion requests, and regulator-facing procedures must be approved before launch." },
    { title: "Your choices", body: "You may request access, correction, or deletion where applicable. Some information must be retained where required for transactions, fraud prevention, or law." },
  ] },
  "/buyer-protection": { title: "Buyer Protection & Disputes", intro: "BRIDGE protects only payments made through an accepted BRIDGE order.", sections: [
    { title: "How it works", body: "The buyer sees the seller price, BRIDGE protection fee, and processing charge before payment. Seller earnings become available after the buyer confirms delivery." },
    { title: "Report a problem", body: "Before confirming delivery, use “Report issue” in the protected order and provide a clear explanation. This places the order under review and blocks seller release." },
    { title: "Refunds", body: "Where BRIDGE approves a refund, it is initiated back through the payment provider. Processing times can depend on the payment method and provider." },
    { title: "Not covered", body: "Cash payments, direct transfers, informal agreements, and payments outside BRIDGE are not covered by BRIDGE buyer protection." },
  ] },
};

export function Legal() {
  const policy = policies[useLocation().pathname] || policies["/terms"];
  return <main className="min-h-screen bg-paper text-ink font-body"><nav className="border-b border-ink/10 px-6 py-5"><BrandLink /></nav><article className="max-w-3xl mx-auto px-6 py-12 sm:py-20"><p className="text-xs uppercase tracking-[0.2em] text-signal font-semibold">Legal · Draft for review</p><h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight mt-4">{policy.title}.</h1><p className="text-ink/55 mt-5 text-lg leading-relaxed">{policy.intro}</p><p className="mt-5 rounded-xl bg-signal/10 border border-signal/15 p-4 text-sm text-ink/70">Effective draft: 6 September 2026. This must be reviewed and approved by BRIDGE’s Nigerian legal and compliance advisers before public launch.</p><div className="mt-10 space-y-9">{policy.sections.map((section) => <section key={section.title}><h2 className="font-display text-2xl font-semibold">{section.title}</h2><p className="mt-3 text-ink/60 leading-relaxed">{section.body}</p></section>)}</div><div className="mt-12 pt-6 border-t border-ink/10 flex flex-wrap gap-4 text-sm text-signal"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/buyer-protection">Buyer Protection</Link></div></article></main>;
}
