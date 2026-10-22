import React, { useState } from "react";
import type { Assessment } from "../types";
import { Satellite, AlertTriangle, Plus } from "lucide-react";

interface ObservationPanelProps {
  assessments: Assessment[];
  siteId?: string;
  onRecordObservation: (payload: {
    observation_date_start: string;
    observation_date_end: string;
    valid_pixel_pct: number;
    cloud_cover_pct: number;
    mean_ndvi: number;
    mean_ndmi: number;
    observed_canopy_proxy_ha: number;
    scene_classification?: string;
  }) => Promise<void>;
}

export const ObservationPanel: React.FC<ObservationPanelProps> = ({
  assessments,
  onRecordObservation
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [dateStart, setDateStart] = useState("2026-10-01");
  const [dateEnd, setDateEnd] = useState("2026-10-20");
  const [validPixelPct, setValidPixelPct] = useState(94.5);
  const cloudCoverPct = Math.max(0, 100 - validPixelPct);
  const [meanNdvi, setMeanNdvi] = useState(0.71);
  const [meanNdmi, setMeanNdmi] = useState(0.35);
  const [canopyProxyHa, setCanopyProxyHa] = useState(10.5);

  const latest = assessments.length > 0 ? assessments[0] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onRecordObservation({
        observation_date_start: dateStart,
        observation_date_end: dateEnd,
        valid_pixel_pct: Number(validPixelPct),
        cloud_cover_pct: Number(cloudCoverPct),
        mean_ndvi: Number(meanNdvi),
        mean_ndmi: Number(meanNdmi),
        observed_canopy_proxy_ha: Number(canopyProxyHa),
        scene_classification: "Sentinel-2 L2A (30-day Median Composite)"
      });
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to record observation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm font-semibold text-slate-900">Satellite Remote-Sensing MRV (Sentinel-2)</h3>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-300 rounded hover:bg-teal-100 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ingest Observation</span>
        </button>
      </div>

      {/* Latest Observation Card */}
      {latest ? (
        <div className="mt-3">
          {/* Anomaly alert warning banner */}
          {latest.anomaly_detected && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Anomaly Flagged — Requires Auditor Review</strong>
                <span className="text-red-700">{latest.anomaly_details}</span>
                <span className="block text-[11px] text-slate-600 mt-1">
                  Note: In accordance with registry policy, future issuance is halted pending review; previously issued credits remain untouched.
                </span>
              </div>
            </div>
          )}

          {/* Quality flag notice if cloudy */}
          {latest.quality_flag === "INCONCLUSIVE_DATA_QUALITY" && (
            <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <strong>Data Quality Warning:</strong> High cloud/shadow contamination. This observation is disqualified from altering capacity estimates.
            </div>
          )}

          {/* Index summary grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded p-3">
            <div>
              <span className="text-[11px] text-slate-500 block">Mean NDVI (10m)</span>
              <span className="text-base font-bold text-slate-900">{latest.mean_ndvi.toFixed(3)}</span>
              <span className="text-[10px] text-slate-400 block">Photosynthetic vigor</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Mean NDMI (Native 20m)</span>
              <span className="text-base font-bold text-sky-800">{latest.mean_ndmi.toFixed(3)}</span>
              <span className="text-[10px] text-slate-400 block">Canopy moisture index</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Canopy Proxy Extent</span>
              <span className="text-base font-bold text-teal-800">{latest.observed_canopy_proxy_ha} ha</span>
              <span className="text-[10px] text-slate-400 block">Experimental proxy</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Valid Pixel Quality</span>
              <span className="text-base font-bold text-slate-800">{latest.valid_pixel_pct}%</span>
              <span className="text-[10px] text-slate-400 block">SCL cloud-free ratio</span>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Period: <strong>{latest.observation_date_start}</strong> to <strong>{latest.observation_date_end}</strong> (30-day median composite)</span>
            <span className="font-mono text-[10px]">SHA-256: {latest.evidence_hash?.substring(0, 16)}...</span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500 py-4 text-center">
          No satellite observations recorded yet. Ingest an observation to establish the baseline.
        </div>
      )}

      {/* Historical observations table */}
      {assessments.length > 1 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">Historical Observations Timeline</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                  <th className="py-1.5 font-medium">Epoch</th>
                  <th className="py-1.5 font-medium">NDVI</th>
                  <th className="py-1.5 font-medium">NDMI (20m)</th>
                  <th className="py-1.5 font-medium">Canopy Proxy</th>
                  <th className="py-1.5 font-medium">Quality</th>
                  <th className="py-1.5 font-medium">Anomaly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.slice(0, 5).map((asm) => (
                  <tr key={asm.assessment_id} className="text-slate-800">
                    <td className="py-1.5">{asm.observation_date_start}</td>
                    <td className="py-1.5 font-semibold">{asm.mean_ndvi.toFixed(3)}</td>
                    <td className="py-1.5 text-sky-800">{asm.mean_ndmi.toFixed(3)}</td>
                    <td className="py-1.5">{asm.observed_canopy_proxy_ha} ha</td>
                    <td className="py-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${asm.quality_flag === "CLEAR" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {asm.quality_flag}
                      </span>
                    </td>
                    <td className="py-1.5">
                      {asm.anomaly_detected ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-700 font-semibold">Flagged</span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Ingest Observation */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-300 max-w-md w-full p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Ingest Sentinel-2 Observation</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Mean NDVI (10m)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="-1"
                    max="1"
                    value={meanNdvi}
                    onChange={(e) => setMeanNdvi(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Mean NDMI (Native 20m)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="-1"
                    max="1"
                    value={meanNdmi}
                    onChange={(e) => setMeanNdmi(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Canopy Proxy Area (ha)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={canopyProxyHa}
                    onChange={(e) => setCanopyProxyHa(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Valid Pixels (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={validPixelPct}
                    onChange={(e) => setValidPixelPct(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-teal-700 text-white rounded font-medium hover:bg-teal-800 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Commit Observation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
