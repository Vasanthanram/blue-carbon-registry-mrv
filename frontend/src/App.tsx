import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { MetricsOverview } from "./components/MetricsOverview";
import { SiteMap } from "./components/SiteMap";
import { SiteDetails } from "./components/SiteDetails";
import { ObservationPanel } from "./components/ObservationPanel";
import { CapacityLedger } from "./components/CapacityLedger";
import { AuditLogView } from "./components/AuditLogView";
import { RegisterSiteModal } from "./components/RegisterSiteModal";
import {
  fetchSummary,
  fetchSites,
  fetchAssessments,
  fetchCapacityRecords,
  fetchAuditLogs,
  fetchOrganizations,
  registerSite,
  recordAssessment,
  simulateStorm,
  submitCapacityReview,
  resetDemoData
} from "./api";
import type { DashboardSummary, Site, Assessment, CapacityRecord, AuditLog, Organization } from "./types";
import { MapPin } from "lucide-react";

export const App: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [capacityRecords, setCapacityRecords] = useState<CapacityRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Load initial dashboard state
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [sumData, sitesData, orgsData, logsData] = await Promise.all([
        fetchSummary(),
        fetchSites(),
        fetchOrganizations(),
        fetchAuditLogs()
      ]);

      setSummary(sumData);
      setSites(sitesData);
      setOrganizations(orgsData);
      setAuditLogs(logsData);

      // Default select the first site or an under-review site
      if (sitesData.length > 0) {
        const defaultSite = sitesData.find((s) => s.status === "UNDER_REVIEW") || sitesData[0];
        setSelectedSiteId(defaultSite.site_id);
      }
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Whenever selected site changes, load its assessments and capacity
  useEffect(() => {
    if (!selectedSiteId) return;

    const loadSiteDetails = async () => {
      try {
        const [asmData, capData] = await Promise.all([
          fetchAssessments(selectedSiteId),
          fetchCapacityRecords(selectedSiteId)
        ]);
        setAssessments(asmData);
        setCapacityRecords(capData);
      } catch (err) {
        console.error("Failed to load site details", err);
      }
    };

    loadSiteDetails();
  }, [selectedSiteId]);

  // Handler: Register Site
  const handleRegisterSite = async (payload: any) => {
    await registerSite(payload);
    await loadInitialData();
  };

  // Handler: Ingest Observation
  const handleRecordObservation = async (payload: any) => {
    if (!selectedSiteId) return;
    await recordAssessment(selectedSiteId, payload);
    // Refresh assessments and summary
    const [asmData, sumData, sitesData, logsData] = await Promise.all([
      fetchAssessments(selectedSiteId),
      fetchSummary(),
      fetchSites(),
      fetchAuditLogs()
    ]);
    setAssessments(asmData);
    setSummary(sumData);
    setSites(sitesData);
    setAuditLogs(logsData);
  };

  // Handler: Simulate Storm Damage
  const handleSimulateStorm = async (siteId: string) => {
    try {
      setIsSimulating(true);
      await simulateStorm(siteId);
      // Refresh
      const [asmData, sumData, sitesData, logsData, capData] = await Promise.all([
        fetchAssessments(siteId),
        fetchSummary(),
        fetchSites(),
        fetchAuditLogs(),
        fetchCapacityRecords(siteId)
      ]);
      setAssessments(asmData);
      setSummary(sumData);
      setSites(sitesData);
      setAuditLogs(logsData);
      setCapacityRecords(capData);
    } catch (err: any) {
      alert(err.message || "Storm simulation failed");
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Submit Review
  const handleSubmitReview = async (payload: any) => {
    if (!selectedSiteId) return;
    try {
      setIsSubmittingReview(true);
      await submitCapacityReview(selectedSiteId, payload);
      // Refresh
      const [capData, sumData, sitesData, logsData] = await Promise.all([
        fetchCapacityRecords(selectedSiteId),
        fetchSummary(),
        fetchSites(),
        fetchAuditLogs()
      ]);
      setCapacityRecords(capData);
      setSummary(sumData);
      setSites(sitesData);
      setAuditLogs(logsData);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handler: Reset Demo
  const handleResetDemo = async () => {
    if (!window.confirm("Reload baseline demonstration data for Pichavaram Mangroves?")) return;
    try {
      setIsResetting(true);
      await resetDemoData();
      await loadInitialData();
    } catch (err: any) {
      alert("Failed to reset: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const selectedSite = sites.find((s) => s.site_id === selectedSiteId) || null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-medium">
        Loading Blue Carbon Registry &amp; MRV Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* 1. Header */}
      <Header
        onOpenRegister={() => setIsRegisterOpen(true)}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex-1 space-y-4">
        
        {/* 2. Top Metric Bar */}
        <MetricsOverview summary={summary} />

        {/* 3. Site Navigation & Selector Bar */}
        <div className="bg-white border border-slate-200 rounded p-2.5 flex items-center justify-between gap-3 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium flex-shrink-0">
            <MapPin className="w-4 h-4 text-teal-700" />
            <span>Select Mangrove Site:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {sites.map((site) => {
              const isSelected = site.site_id === selectedSiteId;
              let dotColor = "bg-emerald-600";
              if (site.status === "UNDER_REVIEW") dotColor = "bg-red-600";
              else if (site.status === "PENDING_BASELINE") dotColor = "bg-sky-600";

              return (
                <button
                  key={site.site_id}
                  onClick={() => setSelectedSiteId(site.site_id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded cursor-pointer whitespace-nowrap font-medium border ${
                    isSelected
                      ? "bg-teal-700 text-white border-teal-800"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : dotColor}`}></span>
                  <span>{site.name}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isSelected ? "bg-teal-800 text-teal-100" : "bg-slate-200 text-slate-600"}`}>
                    {site.geodesic_area_ha} ha
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Top Grid: Interactive Map + Site Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">
            <SiteMap
              sites={sites}
              selectedSiteId={selectedSiteId}
              onSelectSite={(id) => setSelectedSiteId(id)}
            />
          </div>
          <div className="lg:col-span-5">
            <SiteDetails
              site={selectedSite}
              onSimulateStorm={handleSimulateStorm}
              isSimulating={isSimulating}
            />
          </div>
        </div>

        {/* 5. Middle Grid: Satellite MRV Observations + Capacity & Review Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <ObservationPanel
              assessments={assessments}
              siteId={selectedSiteId || ""}
              onRecordObservation={handleRecordObservation}
            />
          </div>
          <div className="lg:col-span-6">
            <CapacityLedger
              records={capacityRecords}
              site={selectedSite}
              onSubmitReview={handleSubmitReview}
              isSubmittingReview={isSubmittingReview}
            />
          </div>
        </div>

        {/* 6. Bottom Section: Audit Trail & Evidence Log */}
        <AuditLogView logs={auditLogs} />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 mt-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-500">
          Blockchain-Based Blue Carbon Registry & MRV System (Academic PoC) • Zero-Cost Architecture • ESA Sentinel-2 L2A Harmonized
        </div>
      </footer>

      {/* Modal: Register Site */}
      <RegisterSiteModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        organizations={organizations}
        onRegister={handleRegisterSite}
      />

    </div>
  );
};

export default App;
