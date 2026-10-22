import React, { useState } from "react";
import type { CapacityRecord, Site } from "../types";
import { AlertOctagon, ShieldCheck, History, ArrowRight } from "lucide-react";

interface CapacityLedgerProps {
  records: CapacityRecord[];
  site: Site | null;
  onSubmitReview: (payload: {
    action: string;
    approved_capacity_tco2e?: number;
    issued_credits_delta?: number;
    reviewer_notes: string;
    reviewed_by: string;
  }) => Promise<void>;
  isSubmittingReview: boolean;
}

export const CapacityLedger: React.FC<CapacityLedgerProps> = ({
  records,
  site,
  onSubmitReview,
  isSubmittingReview
}) => {
  const latest = records.length > 0 ? records[0] : null;

  // Review form states
  const [approvedCap, setApprovedCap] = useState<number>(latest ? latest.approved_capacity_tco2e : 30.0);
  const [issueDelta, setIssueDelta] = useState<number>(0);
  const [reviewerName, setReviewerName] = useState("Dr. S. Ramanathan (Verifier)");
  const [notes, setNotes] = useState("");
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT">("APPROVE");

  if (!site) return null;

  const currentAvailable = latest ? latest.available_capacity_tco2e : 0.0;
  const currentDeficit = latest ? latest.issuance_deficit_tco2e : 0.0;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      alert("Please provide reviewer justification notes.");
      return;
    }

    try {
      await onSubmitReview({
        action: actionType,
        approved_capacity_tco2e: Number(approvedCap),
        issued_credits_delta: Number(issueDelta),
        reviewer_notes: notes,
        reviewed_by: reviewerName
      });
      setIssueDelta(0);
      setNotes("");
    } catch (err: any) {
      alert(err.message || "Failed to submit review");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm font-semibold text-slate-900">Carbon Capacity & Governed Issuance Ledger</h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">Site: {site.site_id}</span>
      </div>

      {/* Under review alert banner */}
      {site.status === "UNDER_REVIEW" && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-900">
          <div className="flex items-center gap-2 font-semibold">
            <AlertOctagon className="w-4 h-4 text-red-700" />
            <span>Site Under Review — Anomaly Triggered Future Issuance Lock</span>
          </div>
          <p className="mt-1 text-slate-700 text-[11px]">
            Canopy loss was detected. In accordance with registry rules:
            <strong> Available future issuance is frozen</strong>. An authorized verifier must inspect the imagery,
            determine if dieback is permanent, and revise approved capacity (C_app).
            <strong> Note: Already-issued credits are never confiscated or deleted.</strong>
          </p>
        </div>
      )}

      {/* Current Balances Display */}
      {latest ? (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[11px] text-slate-500 block">Estimated (Provisional)</span>
            <span className="text-base font-bold text-sky-800">{latest.estimated_capacity_tco2e} t</span>
            <span className="text-[10px] text-slate-400 block">Unvalidated proxy</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[11px] text-slate-500 block">Approved Cap (C_app)</span>
            <span className="text-base font-bold text-emerald-800">{latest.approved_capacity_tco2e} t</span>
            <span className="text-[10px] text-slate-400 block">Verifier ceiling</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[11px] text-slate-500 block">Issued (C_issued)</span>
            <span className="text-base font-bold text-slate-900">{latest.issued_credits_tco2e} t</span>
            <span className="text-[10px] text-slate-400 block">Past minting</span>
          </div>

          <div className="p-2.5 bg-teal-50/60 border border-teal-200 rounded">
            <span className="text-[11px] text-teal-800 font-semibold block">Available (C_avail)</span>
            <span className="text-base font-bold text-teal-900">{latest.available_capacity_tco2e} t</span>
            <span className="text-[10px] text-teal-700 block">Eligible future cap</span>
          </div>

          <div className={`p-2.5 rounded border ${currentDeficit > 0 ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
            <span className="text-[11px] block font-medium">Deficit (C_deficit)</span>
            <span className="text-base font-bold">{latest.issuance_deficit_tco2e} t</span>
            <span className="text-[10px] block">{currentDeficit > 0 ? "Buffer liability" : "Zero deficit"}</span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500 py-2">No capacity record established yet.</div>
      )}

      {/* Auditor Review & Issuance Action Box */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <h4 className="text-xs font-semibold text-slate-800 mb-2">Auditor Review & Governed Issuance Action</h4>

        <form onSubmit={handleReviewSubmit} className="space-y-3 bg-slate-50 border border-slate-200 rounded p-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Set Approved Capacity (tCO2e)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={approvedCap}
                onChange={(e) => setApprovedCap(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-800"
                required
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Adjust down if degradation confirmed</span>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Issue Additional Credits (tCO2e)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max={currentAvailable}
                value={issueDelta}
                onChange={(e) => setIssueDelta(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-800"
              />
              <span className="text-[10px] text-teal-700 block mt-0.5">
                Max available: <strong>{currentAvailable} tCO2e</strong>
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Reviewer Persona / Organization</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Reviewer Justification & Audit Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Field inspection confirmed canopy contraction following cyclonic surge. Adjusted approved capacity to 16.0 tCO2e; future issuance locked."
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-800 text-xs"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="actionType"
                  value="APPROVE"
                  checked={actionType === "APPROVE"}
                  onChange={() => setActionType("APPROVE")}
                  className="text-teal-700"
                />
                <span className="text-slate-700 font-medium">Approve / Update Capacity</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="actionType"
                  value="REJECT"
                  checked={actionType === "REJECT"}
                  onChange={() => setActionType("REJECT")}
                  className="text-red-700"
                />
                <span className="text-red-700 font-medium">Reject Revision</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="px-3.5 py-2 bg-teal-700 text-white rounded font-medium hover:bg-teal-800 cursor-pointer disabled:opacity-50 text-xs flex items-center gap-1.5"
            >
              <span>{isSubmittingReview ? "Recording Decision..." : "Commit Review Decision"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Historical Capacity Ledger */}
      {records.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Capacity Audit Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                  <th className="py-1.5 font-medium">Timestamp</th>
                  <th className="py-1.5 font-medium">Approved</th>
                  <th className="py-1.5 font-medium">Issued</th>
                  <th className="py-1.5 font-medium">Available</th>
                  <th className="py-1.5 font-medium">Deficit</th>
                  <th className="py-1.5 font-medium">Reviewer</th>
                  <th className="py-1.5 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.slice(0, 5).map((rec) => (
                  <tr key={rec.record_id} className="text-slate-800">
                    <td className="py-1.5 text-[11px] text-slate-500">{new Date(rec.reviewed_at).toLocaleDateString()}</td>
                    <td className="py-1.5 font-semibold text-emerald-800">{rec.approved_capacity_tco2e} t</td>
                    <td className="py-1.5">{rec.issued_credits_tco2e} t</td>
                    <td className="py-1.5 font-medium text-teal-800">{rec.available_capacity_tco2e} t</td>
                    <td className="py-1.5 font-medium text-amber-700">{rec.issuance_deficit_tco2e} t</td>
                    <td className="py-1.5 text-[11px] text-slate-600">{rec.reviewed_by || "System"}</td>
                    <td className="py-1.5 text-[11px] text-slate-600 max-w-xs truncate" title={rec.reviewer_notes || ""}>
                      {rec.reviewer_notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
