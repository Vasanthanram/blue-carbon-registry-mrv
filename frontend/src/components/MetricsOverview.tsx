import React from "react";
import type { DashboardSummary } from "../types";
import { MapPin, Globe, Activity, CheckCircle2, Coins, ArrowUpRight, AlertTriangle, AlertCircle } from "lucide-react";

interface MetricsOverviewProps {
  summary: DashboardSummary | null;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 my-4">
      
      {/* 1. Registered Sites */}
      <div className="p-3 bg-white border border-slate-200 rounded">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider">Sites</span>
          <MapPin className="w-3.5 h-3.5 text-teal-600" />
        </div>
        <div className="text-xl font-bold text-slate-900">{summary.total_sites}</div>
        <span className="text-[11px] text-slate-500">Pichavaram plots</span>
      </div>

      {/* 2. Total Area */}
      <div className="p-3 bg-white border border-slate-200 rounded">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider">Area</span>
          <Globe className="w-3.5 h-3.5 text-teal-600" />
        </div>
        <div className="text-xl font-bold text-slate-900">{summary.total_registered_area_ha} <span className="text-xs font-normal text-slate-500">ha</span></div>
        <span className="text-[11px] text-slate-500">Geodesic validated</span>
      </div>

      {/* 3. Estimated Capacity */}
      <div className="p-3 bg-white border border-slate-200 rounded">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider">C_est</span>
          <Activity className="w-3.5 h-3.5 text-sky-600" />
        </div>
        <div className="text-xl font-bold text-sky-800">{summary.total_estimated_capacity_tco2e} <span className="text-xs font-normal text-slate-500">t</span></div>
        <span className="text-[11px] text-slate-500">Provisional estimate</span>
      </div>

      {/* 4. Approved Capacity */}
      <div className="p-3 bg-white border border-slate-200 rounded">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider">C_app</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="text-xl font-bold text-emerald-800">{summary.total_approved_capacity_tco2e} <span className="text-xs font-normal text-slate-500">t</span></div>
        <span className="text-[11px] text-slate-500">Verifier approved cap</span>
      </div>

      {/* 5. Issued Credits */}
      <div className="p-3 bg-white border border-slate-200 rounded">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider">C_issued</span>
          <Coins className="w-3.5 h-3.5 text-slate-600" />
        </div>
        <div className="text-xl font-bold text-slate-900">{summary.total_issued_credits_tco2e} <span className="text-xs font-normal text-slate-500">t</span></div>
        <span className="text-[11px] text-slate-500">Issued credits</span>
      </div>

      {/* 6. Available Future Issuance */}
      <div className="p-3 bg-white border border-teal-200 bg-teal-50/40 rounded">
        <div className="flex items-center justify-between text-teal-800 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">C_avail</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-teal-700" />
        </div>
        <div className="text-xl font-bold text-teal-900">{summary.total_available_capacity_tco2e} <span className="text-xs font-normal text-slate-600">t</span></div>
        <span className="text-[11px] text-teal-700 font-medium">Eligible future cap</span>
      </div>

      {/* 7. Issuance Deficit */}
      <div className={`p-3 bg-white border rounded ${summary.total_issuance_deficit_tco2e > 0 ? "border-amber-300 bg-amber-50/30" : "border-slate-200"}`}>
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider">Deficit</span>
          <AlertCircle className={`w-3.5 h-3.5 ${summary.total_issuance_deficit_tco2e > 0 ? "text-amber-600" : "text-slate-400"}`} />
        </div>
        <div className={`text-xl font-bold ${summary.total_issuance_deficit_tco2e > 0 ? "text-amber-700" : "text-slate-600"}`}>
          {summary.total_issuance_deficit_tco2e} <span className="text-xs font-normal text-slate-500">t</span>
        </div>
        <span className="text-[11px] text-slate-500">Protected liability</span>
      </div>

      {/* 8. Sites Under Review */}
      <div className={`p-3 bg-white border rounded ${summary.sites_under_review_count > 0 ? "border-red-200 bg-red-50/30" : "border-slate-200"}`}>
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider">Alerts</span>
          <AlertTriangle className={`w-3.5 h-3.5 ${summary.sites_under_review_count > 0 ? "text-red-600" : "text-slate-400"}`} />
        </div>
        <div className={`text-xl font-bold ${summary.sites_under_review_count > 0 ? "text-red-700" : "text-slate-800"}`}>
          {summary.sites_under_review_count}
        </div>
        <span className="text-[11px] text-slate-500">Require triage</span>
      </div>

    </div>
  );
};
