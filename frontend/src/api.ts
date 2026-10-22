import type { DashboardSummary, Site, Assessment, CapacityRecord, AuditLog, Organization } from "./types";

const BASE_URL = "/api/v1";

export async function fetchSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${BASE_URL}/summary`);
  if (!res.ok) throw new Error("Failed to fetch dashboard summary");
  return res.json();
}

export async function fetchOrganizations(): Promise<Organization[]> {
  const res = await fetch(`${BASE_URL}/organizations`);
  if (!res.ok) throw new Error("Failed to fetch organizations");
  return res.json();
}

export async function fetchSites(): Promise<Site[]> {
  const res = await fetch(`${BASE_URL}/sites`);
  if (!res.ok) throw new Error("Failed to fetch sites");
  return res.json();
}

export async function fetchSite(siteId: string): Promise<Site> {
  const res = await fetch(`${BASE_URL}/sites/${siteId}`);
  if (!res.ok) throw new Error(`Failed to fetch site ${siteId}`);
  return res.json();
}

export async function fetchAssessments(siteId: string): Promise<Assessment[]> {
  const res = await fetch(`${BASE_URL}/sites/${siteId}/assessments`);
  if (!res.ok) throw new Error("Failed to fetch assessments");
  return res.json();
}

export async function fetchCapacityRecords(siteId: string): Promise<CapacityRecord[]> {
  const res = await fetch(`${BASE_URL}/sites/${siteId}/capacity`);
  if (!res.ok) throw new Error("Failed to fetch capacity records");
  return res.json();
}

export async function fetchAuditLogs(siteId?: string): Promise<AuditLog[]> {
  const url = siteId ? `${BASE_URL}/audit-logs?site_id=${siteId}` : `${BASE_URL}/audit-logs`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}

export async function registerSite(payload: {
  name: string;
  org_id: string;
  boundary_geojson: string;
  registered_area_ha: number;
  ecosystem_type: string;
  restoration_date?: string;
}): Promise<Site> {
  const res = await fetch(`${BASE_URL}/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to register site");
  }
  return res.json();
}

export async function recordAssessment(siteId: string, payload: {
  observation_date_start: string;
  observation_date_end: string;
  valid_pixel_pct: number;
  cloud_cover_pct: number;
  mean_ndvi: number;
  mean_ndmi: number;
  observed_canopy_proxy_ha: number;
  scene_classification?: string;
}): Promise<Assessment> {
  const res = await fetch(`${BASE_URL}/sites/${siteId}/assessments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to record observation");
  }
  return res.json();
}

export async function simulateStorm(siteId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/sites/${siteId}/simulate-storm`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to simulate storm event");
  return res.json();
}

export async function submitCapacityReview(siteId: string, payload: {
  action: string;
  approved_capacity_tco2e?: number;
  issued_credits_delta?: number;
  reviewer_notes: string;
  reviewed_by: string;
}): Promise<CapacityRecord> {
  const res = await fetch(`${BASE_URL}/sites/${siteId}/capacity/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to submit review");
  }
  return res.json();
}

export async function resetDemoData(): Promise<any> {
  const res = await fetch(`${BASE_URL}/reset-seed`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to reset demo data");
  return res.json();
}
