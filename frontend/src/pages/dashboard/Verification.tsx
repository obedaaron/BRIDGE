import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { DashboardLayout } from "../../components/DashboardLayout";
import { SignboardTag } from "../../components/SignboardTag";
import { FileUpload } from "../../components/FileUpload";
import { ShieldCheck, AlertCircle, Clock, CheckCircle2, Upload, Loader2 } from "lucide-react";

const types = [
  { key: "kyc", label: "Identity check (KYC)", hint: "Submit your NIN card or slip and a clear face photo for a trained BRIDGE reviewer to check." },
  { key: "location", label: "Location check", hint: "Required: submit a recent utility bill, tenancy agreement, or clear storefront photo confirming your business address." },
  { key: "skill", label: "Skill Verified", hint: "Optional: a certification or portfolio relevant to your trade." },
];

interface Verification {
  id: string;
  type: string;
  status: string;
}

export function Verification() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [nin, setNin] = useState("");
  const [selfie, setSelfie] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [contact, setContact] = useState({ email: false, phone: false, phoneNumber: "", emailAddress: "" });
  const [codes, setCodes] = useState({ email: "", phone: "" });
  const [sendingContact, setSendingContact] = useState<string | null>(null);

  function load() {
    apiFetch("/verifications/mine").then((data) => setVerifications(data.verifications)).catch(() => setVerifications([]));
  }

  useEffect(() => { load(); apiFetch("/auth/me").then((data) => setContact({ email: Boolean(data.user.email_verified_at), phone: Boolean(data.user.phone_verified_at), phoneNumber: data.user.phone || "", emailAddress: data.user.email || "" })); }, []);

  async function sendContact(type: "email" | "phone") { setError(""); setSendingContact(`${type}-send`); try { await apiFetch("/auth/contact-verification/send", { method: "POST", body: JSON.stringify({ type, phone: contact.phoneNumber }) }); } catch (err: any) { setError(err.message); } finally { setSendingContact(null); } }
  async function confirmContact(type: "email" | "phone") { setError(""); setSendingContact(`${type}-confirm`); try { await apiFetch("/auth/contact-verification/confirm", { method: "POST", body: JSON.stringify({ type, code: codes[type] }) }); setContact({ ...contact, [type]: true }); } catch (err: any) { setError(err.message); } finally { setSendingContact(null); } }

  function statusFor(type: string) {
    const match = verifications.find((v) => v.type === type);
    return match?.status || null;
  }

  async function handleSubmit(type: string) {
    setError("");
    setSubmitting(type);
    try {
      if (type === "kyc") {
        await apiFetch("/verifications/kyc/nin", { method: "POST", body: JSON.stringify({ nin, documentKey: documents.kyc, selfieKey: selfie, consent }) });
      } else {
        await apiFetch("/verifications", {
          method: "POST",
          body: JSON.stringify({ type, documentUrl: documents[type] || null }),
        });
      }
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(null);
    }
  }

  function statusConfig(status: string | null) {
    switch (status) {
      case "approved": return { tag: "gold", label: "Approved", icon: CheckCircle2 };
      case "pending": return { tag: "gold", label: "Pending review", icon: Clock };
      case "rejected": return { tag: "signal", label: "Rejected — resubmit", icon: AlertCircle };
      default: return { tag: "signal", label: "Not started", icon: ShieldCheck };
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Trust</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink tracking-tight leading-[0.95]">
            Verification.
          </h1>
          <p className="mt-3 text-ink/40 max-w-md text-base sm:text-lg">
            Complete identity, location, email, and phone verification before publishing your store. Skill verification is optional.
          </p>
        </div>

        {error && (
          <div className="bg-signal/10 border border-signal/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-signal shrink-0" strokeWidth={2} />
            <p className="text-signal text-sm font-medium">{error}</p>
          </div>
        )}

        <section className="mb-8 bg-white rounded-2xl border border-ink/5 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-2">Account security</p><h2 className="font-display text-2xl font-semibold">Verify your contact details.</h2><p className="text-sm text-ink/45 mt-2 mb-5">Both checks are required before a vendor can become fully trusted.</p>
          <div className="grid sm:grid-cols-2 gap-5">{(["email", "phone"] as const).map((type) => <div key={type} className="rounded-xl bg-ink/[0.03] p-4"><div className="flex items-center justify-between"><p className="font-medium capitalize">{type}</p><SignboardTag color={contact[type] ? "gold" : "signal"}>{contact[type] ? "Verified" : "Required"}</SignboardTag></div>{type === "email" ? <p className="text-xs text-ink/40 mt-2 truncate">{contact.emailAddress}</p> : <input className="input-field mt-3" inputMode="tel" placeholder="08012345678" value={contact.phoneNumber} onChange={(e) => setContact({ ...contact, phoneNumber: e.target.value })} />}{!contact[type] && <><button onClick={() => sendContact(type)} disabled={sendingContact !== null || (type === "phone" && !contact.phoneNumber)} className="mt-3 text-xs px-3 py-2 bg-ink text-paper rounded-lg disabled:opacity-50">{sendingContact === `${type}-send` ? "Sending…" : "Send 6-digit code"}</button><div className="flex gap-2 mt-3"><input className="input-field text-sm" inputMode="numeric" maxLength={6} placeholder="Code" value={codes[type]} onChange={(e) => setCodes({ ...codes, [type]: e.target.value.replace(/\D/g, "") })} /><button onClick={() => confirmContact(type)} disabled={sendingContact !== null || codes[type].length !== 6} className="text-xs px-3 py-2 border border-ink/15 rounded-lg disabled:opacity-50">Verify</button></div></>}</div>)}</div>
        </section>

        <div className="grid sm:grid-cols-2 gap-4">
          {types.map((t) => {
            const status = statusFor(t.key);
            const config = statusConfig(status);
            const canSubmit = !status || status === "rejected";
            const StatusIcon = config.icon;

            return (
              <div key={t.key} className="bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center shrink-0">
                    <StatusIcon className="w-5 h-5 text-ink/40" strokeWidth={1.5} />
                  </div>
                  <SignboardTag color={config.tag as "gold" | "signal"}>{config.label}</SignboardTag>
                </div>

                <h3 className="font-display text-lg font-bold text-ink mb-1">{t.label}</h3>
                <p className="text-sm text-ink/40 mb-5 leading-relaxed">{t.hint}</p>

                {canSubmit && t.key === "kyc" && (
                  <div className="flex flex-col gap-3">
                    <input
                      className="input-field"
                      inputMode="numeric"
                      maxLength={11}
                      placeholder="11-digit NIN"
                      value={nin}
                      onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
                    />
                    <FileUpload label="Upload NIN slip or card" value={documents.kyc || ""} onChange={(key) => setDocuments({ ...documents, kyc: key })} uploadPath="/uploads/verification-document" />
                    <FileUpload label="Upload a clear face photo" value={selfie} onChange={setSelfie} uploadPath="/uploads/verification-selfie" accept="image/jpeg,image/png,image/webp" />
                    <label className="flex items-start gap-2 text-xs text-ink/50 leading-relaxed cursor-pointer">
                      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                      <span>I consent to BRIDGE securely processing my NIN document and face photo solely for identity verification. My submission will be reviewed by a trained administrator.</span>
                    </label>
                    <button
                      onClick={() => handleSubmit(t.key)}
                      disabled={submitting === t.key || nin.length !== 11 || !documents.kyc || !selfie || !consent}
                      className="inline-flex items-center justify-center gap-2 bg-ink text-paper font-medium px-5 py-2.5 rounded-xl text-sm hover:bg-ink/90 transition-colors disabled:opacity-50"
                    >
                      {submitting === t.key ? <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />Submitting...</> : <><ShieldCheck className="w-4 h-4" strokeWidth={2} />Submit for review</>}
                    </button>
                    <p className="text-[11px] text-ink/30">BRIDGE does not store the NIN you enter. Your encrypted evidence is available only to you and authorised reviewers.</p>
                  </div>
                )}

                {canSubmit && t.key !== "kyc" && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <FileUpload
                        label={t.key === "location" ? "Upload address evidence" : "Upload supporting document"}
                        value={documents[t.key] || ""}
                        onChange={(url) => setDocuments({ ...documents, [t.key]: url })}
                        uploadPath="/uploads/verification-document"
                      />
                    </div>
                    <button
                      onClick={() => handleSubmit(t.key)}
                      disabled={submitting === t.key || (t.key === "location" && !documents.location)}
                      className="inline-flex items-center justify-center gap-2 bg-ink text-paper font-medium px-5 py-2.5 rounded-xl text-sm hover:bg-ink/90 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {submitting === t.key ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" strokeWidth={2} />
                          Submit
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
