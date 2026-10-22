export interface Organization {
  org_id: string;
  name: string;
  org_type: string;
  contact_email: string;
}

export interface Site {
  site_id: string;
  org_id: string;
  name: string;
  boundary_geojson: string;
  registered_area_ha: number;
  geodesic_area_ha: number;
  ecosystem_type: string;
  restoration_date: string;
  status: "PENDING_BASELINE" | "ACTIVE_MONITORED" | "UNDER_REVIEW" | "HALTED";
  latest_ndvi?: number;
  latest_ndmi?: number;
  latest_canopy_proxy_ha?: number;
  onchain_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  assessment_id: string;
  site_id: string;
  observation_date_start: string;
  observation_date_end: string;
  valid_pixel_pct: number;
  mean_ndvi: number;
  mean_ndmi: number;
  observed_canopy_proxy_ha: number;
  quality_flag: "CLEAR" | "INCONCLUSIVE_DATA_QUALITY";
  anomaly_detected: boolean;
  anomaly_details?: string;
  evidence_hash?: string;
  scene_classification: string;
  created_at: string;
}

export interface CapacityRecord {
  record_id: string;
  site_id: string;
  assessment_id?: string;
  estimated_capacity_tco2e: number;
  approved_capacity_tco2e: number;
  issued_credits_tco2e: number;
  available_capacity_tco2e: number;
  issuance_deficit_tco2e: number;
  approval_status: "PROVISIONAL" | "APPROVED" | "REJECTED";
  reviewed_by?: string;
  reviewed_at: string;
  reviewer_notes?: string;
  onchain_tx_hash?: string;
}

export interface AuditLog {
  log_id: string;
  site_id: string;
  timestamp: string;
  action_type: string;
  actor_id: string;
  details?: string;
  evidence_hash?: string;
}

export interface DashboardSummary {
  total_sites: number;
  total_registered_area_ha: number;
  total_estimated_capacity_tco2e: number;
  total_approved_capacity_tco2e: number;
  total_issued_credits_tco2e: number;
  total_available_capacity_tco2e: number;
  total_issuance_deficit_tco2e: number;
  sites_under_review_count: number;
  latest_assessments: Assessment[];
  recent_logs: AuditLog[];
}

