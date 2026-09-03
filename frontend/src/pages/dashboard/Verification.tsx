import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { DashboardLayout } from "../../components/DashboardLayout";
import { SignboardTag } from "../../components/SignboardTag";
import { FileUpload } from "../../components/FileUpload";
import { ShieldCheck, AlertCircle, Clock, CheckCircle2, Upload, Loader2 } from "lucide-react";

const types = [
  { key: "identity", label: "Identity Verified", hint: "A valid government-issued ID (NIN, driver's license, passport)." },
  { key: "business", label: "Business Verified", hint: "CAC registration or a business permit." },
  { key: "location", label: "Location Verified", hint: "A utility bill or shop photo confirming your address." },
  { key: "skill", label: "Skill Verified", hint: "A certification or portfolio relevant to your trade." },
];

interface Verification {
  id: string;
  type: string;
  status: string;
}

export function Verification() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    apiFetch("/verifications/mine").then((data) => setVerifications(data.verifications)).catch(() => setVerifications([]));
  }

  useEffect(() => { load(); }, []);

  function statusFor(type: string) {
    const match = verifications.find((v) => v.type === type);
    return match?.status || null;
  }

  async function handleSubmit(type: string) {
    setError("");
    setSubmitting(type);
    try {
      await apiFetch("/verifications", {
        method: "POST",
        body: JSON.stringify({ type, documentUrl: documents[type] || null }),
      });
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
            Verified stores get more trust — and more customers. Complete all four checks below.
          </p>
        </div>

        {error && (
          <div className="bg-signal/10 border border-signal/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-signal shrink-0" strokeWidth={2} />
            <p className="text-signal text-sm font-medium">{error}</p>
          </div>
        )}

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

                {canSubmit && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <FileUpload
                        label="Upload document"
                        value={documents[t.key] || ""}
                        onChange={(url) => setDocuments({ ...documents, [t.key]: url })}
                      />
                    </div>
                    <button
                      onClick={() => handleSubmit(t.key)}
                      disabled={submitting === t.key}
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