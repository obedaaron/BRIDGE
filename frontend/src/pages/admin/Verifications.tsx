import { useEffect, useState } from "react";
import { API_URL, apiFetch } from "../../lib/api";
import { AdminLayout } from "../../components/AdminLayout";
import { SignboardTag } from "../../components/SignboardTag";
import { Check, X, FileText, ShieldCheck, Loader2, AlertCircle, UserRound } from "lucide-react";

interface VerificationRow {
  id: string;
  business_name: string;
  type: string;
  document_url: string | null;
  provider: string | null;
  provider_status: string | null;
  metadata: { nin_last4?: string; cac_number?: string; selfie_key?: string };
}

export function AdminVerifications() {
  const [items, setItems] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, { documentReadable: boolean; faceMatches: boolean; ninMatches: boolean }>>({});

  function load() {
    setLoading(true);
    apiFetch("/admin/verifications?status=pending")
      .then((data) => setItems(data.verifications))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDecision(id: string, status: "approved" | "rejected") {
    const note = reviewNotes[id] || "";
    const checklist = checks[id];
    if (note.trim().length < 5) return window.alert("Add a concise review note before deciding.");
    if (status === "approved" && (!checklist?.documentReadable || !checklist?.faceMatches || !checklist?.ninMatches)) {
      return window.alert("Complete every identity-review check before approving.");
    }
    setActing(id);
    try {
      await apiFetch(`/admin/verifications/${id}`, { method: "PATCH", body: JSON.stringify({ status, reviewNote: note, checklist }) });
      load();
    } finally {
      setActing(null);
    }
  }

  async function viewDocument(key: string) {
    try {
      const response = await fetch(`${API_URL}/uploads/verification-document?key=${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!response.ok) throw new Error("Could not open this document");
      window.open(URL.createObjectURL(await response.blob()), "_blank", "noopener,noreferrer");
    } catch (err: any) { window.alert(err.message); }
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal mb-3">Admin</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink tracking-tight leading-[0.95]">
                Pending verifications.
              </h1>
              <p className="mt-3 text-ink/40 max-w-md text-base sm:text-lg">
                Review and approve vendor verification documents.
              </p>
            </div>
            <span className="text-sm text-ink/30 font-mono">{items.length} pending</span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-6 h-6 text-ink/20 animate-spin mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-ink/30 text-sm">Loading verifications...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-ink/5">
            <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-ink/20" strokeWidth={1.5} />
            </div>
            <p className="text-ink/40 font-medium mb-1">Nothing pending</p>
            <p className="text-ink/30 text-sm">All caught up. New submissions will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4">
            {items.map((v) => (
              <div
                key={v.id}
                className="group bg-white rounded-2xl border border-ink/5 p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-display text-lg sm:text-xl font-semibold text-ink">
                        {v.business_name}
                      </h3>
                      <SignboardTag color="gold">{v.type.replace("_", " ")}</SignboardTag>
                    </div>

                    {(v.provider || v.metadata?.nin_last4 || v.metadata?.cac_number) && (
                      <p className="text-xs text-ink/40 mb-2">
                        {v.provider && <>Source: {v.provider.replace("_", " ")}{v.provider_status ? ` (${v.provider_status})` : ""}. </>}
                        {v.metadata?.nin_last4 && <>NIN ending {v.metadata.nin_last4}.</>}
                        {v.metadata?.cac_number && <>CAC: {v.metadata.cac_number}.</>}
                      </p>
                    )}

                    {v.document_url && (
                      <button
                        onClick={() => viewDocument(v.document_url!)}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-signal hover:text-signal/80 transition-colors font-medium mt-1"
                      >
                        <FileText className="w-3.5 h-3.5" strokeWidth={2} />
                        View document
                      </button>
                    )}

                    {v.metadata?.selfie_key && (
                      <button onClick={() => viewDocument(v.metadata.selfie_key!)} className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-signal hover:text-signal/80 transition-colors font-medium mt-3 ml-4">
                        <UserRound className="w-3.5 h-3.5" strokeWidth={2} /> View face photo
                      </button>
                    )}

                    {!v.document_url && (
                      <p className="text-xs text-ink/30 mt-1 inline-flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
                        No document uploaded
                      </p>
                    )}
                    {v.type === "kyc" && <div className="mt-4 grid gap-2 text-xs text-ink/60">
                      {([ ["documentReadable", "NIN document is clear and appears authentic"], ["faceMatches", "Face photo reasonably matches the document portrait"], ["ninMatches", "Entered NIN ending matches the submitted document"] ] as const).map(([key, label]) => (
                        <label key={key} className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={Boolean(checks[v.id]?.[key])} onChange={(e) => setChecks({ ...checks, [v.id]: { ...{ documentReadable: false, faceMatches: false, ninMatches: false }, ...(checks[v.id] || {}), [key]: e.target.checked } })} /><span>{label}</span></label>
                      ))}
                    </div>}
                    <textarea value={reviewNotes[v.id] || ""} onChange={(e) => setReviewNotes({ ...reviewNotes, [v.id]: e.target.value })} maxLength={1000} placeholder="Review note (required, visible in the audit record)" className="input-field mt-4 min-h-20 text-sm" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <button
                      onClick={() => handleDecision(v.id, "approved")}
                      disabled={acting === v.id}
                      className="inline-flex items-center gap-1.5 bg-ink text-paper font-medium px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm hover:bg-ink/90 transition-colors disabled:opacity-50"
                    >
                      {acting === v.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                      ) : (
                        <Check className="w-3.5 h-3.5" strokeWidth={2} />
                      )}
                      Approve
                    </button>

                    <button
                      onClick={() => handleDecision(v.id, "rejected")}
                      disabled={acting === v.id}
                      className="inline-flex items-center gap-1.5 bg-paper text-signal font-medium px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm border border-signal/20 hover:bg-signal/5 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
