import React, { useState } from "react";
import type { AuditLog } from "../types";
import { FileCheck, Search } from "lucide-react";

interface AuditLogViewProps {
  logs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = logs.filter(
    (l) =>
      l.site_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm font-semibold text-slate-900">System Audit Trail & Evidence Log</h3>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by action, site, or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800"
          />
        </div>
      </div>

      <div className="text-[11px] text-slate-500 my-2">
        Records are accompanied by SHA-256 evidence digests. Tamper-evidence is established when verified against independent external anchors.
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
              <th className="py-2 font-medium">Timestamp</th>
              <th className="py-2 font-medium">Site ID</th>
              <th className="py-2 font-medium">Action</th>
              <th className="py-2 font-medium">Actor</th>
              <th className="py-2 font-medium">Details</th>
              <th className="py-2 font-medium">Evidence Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length > 0 ? (
              filtered.map((log) => {
                let badgeClass = "bg-slate-100 text-slate-700";
                if (log.action_type === "ANOMALY_FLAGGED") badgeClass = "bg-red-50 text-red-700 font-semibold";
                else if (log.action_type === "CAPACITY_APPROVED") badgeClass = "bg-emerald-50 text-emerald-800";
                else if (log.action_type === "SITE_REGISTERED") badgeClass = "bg-teal-50 text-teal-800";

                return (
                  <tr key={log.log_id} className="text-slate-800 hover:bg-slate-50/50">
                    <td className="py-2 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 font-mono text-[11px] text-teal-800 font-semibold">
                      {log.site_id}
                    </td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${badgeClass}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="py-2 text-[11px] text-slate-600">{log.actor_id}</td>
                    <td className="py-2 text-slate-700 max-w-xs">{log.details || "—"}</td>
                    <td className="py-2 font-mono text-[10px] text-slate-400">
                      {log.evidence_hash ? (
                        <span title={log.evidence_hash}>
                          {log.evidence_hash.substring(0, 12)}...
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                  No matching audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
