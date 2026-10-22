import React, { useState } from "react";
import type { Organization } from "../types";
import { PlusCircle, Sparkles } from "lucide-react";

interface RegisterSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Organization[];
  onRegister: (payload: {
    name: string;
    org_id: string;
    boundary_geojson: string;
    registered_area_ha: number;
    ecosystem_type: string;
    restoration_date?: string;
  }) => Promise<void>;
}

const SAMPLE_PICHAVARAM_PARCEL = {
  type: "Polygon",
  coordinates: [[
    [79.7740, 11.4230],
    [79.7780, 11.4245],
    [79.7790, 11.4270],
    [79.7760, 11.4285],
    [79.7730, 11.4260],
    [79.7740, 11.4230]
  ]]
};

export const RegisterSiteModal: React.FC<RegisterSiteModalProps> = ({
  isOpen,
  onClose,
  organizations,
  onRegister
}) => {
  const [name, setName] = useState("Pichavaram South Mangrove Expansion Plot");
  const [orgId, setOrgId] = useState(organizations.length > 0 ? organizations[0].org_id : "ORG-TN-FOREST");
  const [regArea, setRegArea] = useState(7.5);
  const [ecoType, setEcoType] = useState("Rhizophora mucronata & Avicennia marina");
  const [restorationDate, setRestorationDate] = useState("2023-04-12");
  const [geojsonStr, setGeojsonStr] = useState(JSON.stringify(SAMPLE_PICHAVARAM_PARCEL, null, 2));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFillSample = () => {
    setName("Pichavaram Tidal Channel Parcel B-4");
    setRegArea(7.5);
    setEcoType("Rhizophora mucronata & Avicennia marina");
    setRestorationDate("2023-06-15");
    setGeojsonStr(JSON.stringify(SAMPLE_PICHAVARAM_PARCEL, null, 2));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // Basic JSON parse check
      JSON.parse(geojsonStr);
    } catch (err: any) {
      setErrorMsg("Invalid GeoJSON string: " + err.message);
      setIsSubmitting(false);
      return;
    }

    try {
      await onRegister({
        name,
        org_id: orgId || "ORG-TN-FOREST",
        boundary_geojson: geojsonStr,
        registered_area_ha: Number(regArea),
        ecosystem_type: ecoType,
        restoration_date: restorationDate
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register site");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white rounded border border-slate-300 max-w-lg w-full p-6 text-slate-800">
        
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-semibold text-slate-900">Register Mangrove Restoration Site</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl cursor-pointer">×</button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          <div>
            <label className="block text-slate-700 font-medium mb-1">Site Official Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Operating Organization</label>
              <select
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800 bg-white"
              >
                {organizations.map((org) => (
                  <option key={org.org_id} value={org.org_id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Declared Cadastral Area (ha)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={regArea}
                onChange={(e) => setRegArea(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Ecosystem / Species Type</label>
              <input
                type="text"
                value={ecoType}
                onChange={(e) => setEcoType(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Restoration / Planting Date</label>
              <input
                type="date"
                value={restorationDate}
                onChange={(e) => setRestorationDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800"
              />
            </div>
          </div>

          {/* GeoJSON Polygon Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-medium">Boundary GeoJSON (WGS84 Coordinates)</label>
              <button
                type="button"
                onClick={handleFillSample}
                className="text-[11px] text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Insert Sample Pichavaram Polygon</span>
              </button>
            </div>
            <textarea
              rows={5}
              value={geojsonStr}
              onChange={(e) => setGeojsonStr(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-[11px] text-slate-800 bg-slate-50"
              required
            />
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Topological validity and geodesic area (WGS84 ellipsoid) are verified on submission.
            </span>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700 bg-white hover:bg-slate-50 cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-teal-700 text-white rounded font-medium hover:bg-teal-800 cursor-pointer disabled:opacity-50 text-xs"
            >
              {isSubmitting ? "Validating & Submitting..." : "Submit Site Registration"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
