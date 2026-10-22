import React from "react";
import type { Site } from "../types";
import { CloudLightning, Hash } from "lucide-react";

interface SiteDetailsProps {
  site: Site | null;
  onSimulateStorm: (siteId: string) => void;
  isSimulating: boolean;
}

export const SiteDetails: React.FC<SiteDetailsProps> = ({ site, onSimulateStorm, isSimulating }) => {
  if (!site) {
    return (
      <div className="bg-white border border-slate-200 rounded p-6 text-center text-slate-500 text-sm">
        Select a restoration site from the map or directory to inspect details.
      </div>
    );
  }

  let statusBadge = (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      ACTIVE_MONITORED
    </span>
  );

  if (site.status === "UNDER_REVIEW") {
    statusBadge = (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        UNDER_REVIEW (Anomaly Alert)
      </span>
    );
  } else if (site.status === "PENDING_BASELINE") {
    statusBadge = (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
        PENDING_BASELINE
      </span>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{site.name}</h2>
            {statusBadge}
          </div>
          <span className="text-xs text-slate-500">Site ID: <strong className="text-slate-700 font-mono">{site.site_id}</strong></span>
        </div>

        {/* Demo simulator trigger */}
        <button
          onClick={() => onSimulateStorm(site.site_id)}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-300 rounded hover:bg-amber-100 cursor-pointer disabled:opacity-50"
          title="Ingest a simulated storm observation exhibiting canopy loss to trigger the anomaly triage review"
        >
          <CloudLightning className="w-3.5 h-3.5 text-amber-700" />
          <span>{isSimulating ? "Simulating Event..." : "Simulate Storm Anomaly"}</span>
        </button>
      </div>

      {/* Grid of properties */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-xs">
        <div>
          <span className="text-slate-500 block mb-0.5">Cadastral Registered Area</span>
          <span className="text-sm font-semibold text-slate-800">{site.registered_area_ha} ha</span>
        </div>

        <div>
          <span className="text-slate-500 block mb-0.5">Geodesic Computed Area</span>
          <span className="text-sm font-semibold text-teal-800">{site.geodesic_area_ha} ha</span>
          <span className="text-[10px] text-slate-400 block">(WGS84 Ellipsoid)</span>
        </div>

        <div>
          <span className="text-slate-500 block mb-0.5">Ecosystem Classification</span>
          <span className="text-xs font-medium text-slate-800">{site.ecosystem_type}</span>
        </div>

        <div>
          <span className="text-slate-500 block mb-0.5">Restoration Date</span>
          <span className="text-xs font-medium text-slate-800">{site.restoration_date || "N/A"}</span>
        </div>
      </div>

      {/* On-chain commitment hash */}
      {site.onchain_hash && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
          <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="truncate">Boundary Commitment Hash: <code className="text-slate-700 font-mono">{site.onchain_hash}</code></span>
        </div>
      )}
    </div>
  );
};
