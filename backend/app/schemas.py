from typing import Optional, List
import datetime
from pydantic import BaseModel, ConfigDict

class OrganizationBase(BaseModel):
    org_id: str
    name: str
    org_type: str = "NGO"
    contact_email: str

class OrganizationOut(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)

class SiteCreate(BaseModel):
    name: str
    org_id: str
    boundary_geojson: str
    registered_area_ha: float
    ecosystem_type: str = "Rhizophora / Avicennia Mangrove"
    restoration_date: Optional[str] = None

class SiteOut(BaseModel):
    site_id: str
    org_id: str
    name: str
    boundary_geojson: str
    registered_area_ha: float
    geodesic_area_ha: float
    ecosystem_type: str
    restoration_date: Optional[str]
    status: str
    latest_ndvi: Optional[float]
    latest_ndmi: Optional[float]
    latest_canopy_proxy_ha: Optional[float]
    onchain_hash: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class AssessmentCreate(BaseModel):
    observation_date_start: str
    observation_date_end: str
    valid_pixel_pct: float = 100.0
    cloud_cover_pct: float = 5.0
    mean_ndvi: float
    mean_ndmi: float
    observed_canopy_proxy_ha: float
    scene_classification: str = "Sentinel-2 L2A Harmonized (30-day Median)"

class AssessmentOut(BaseModel):
    assessment_id: str
    site_id: str
    observation_date_start: str
    observation_date_end: str
    valid_pixel_pct: float
    mean_ndvi: float
    mean_ndmi: float
    observed_canopy_proxy_ha: float
    quality_flag: str
    anomaly_detected: bool
    anomaly_details: Optional[str]
    evidence_hash: Optional[str]
    scene_classification: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class CapacityRecordCreate(BaseModel):
    estimated_capacity_tco2e: float
    approved_capacity_tco2e: float
    issued_credits_tco2e: float = 0.0
    reviewer_notes: Optional[str] = None

class CapacityReviewAction(BaseModel):
    action: str  # "APPROVE", "REJECT", "UPDATE_APPROVED"
    approved_capacity_tco2e: Optional[float] = None
    issued_credits_delta: Optional[float] = None
    reviewer_notes: str
    reviewed_by: str = "Tamil Nadu Forest Dept Verifier"

class CapacityRecordOut(BaseModel):
    record_id: str
    site_id: str
    assessment_id: Optional[str]
    estimated_capacity_tco2e: float
    approved_capacity_tco2e: float
    issued_credits_tco2e: float
    available_capacity_tco2e: float
    issuance_deficit_tco2e: float
    approval_status: str
    reviewed_by: Optional[str]
    reviewed_at: datetime.datetime
    reviewer_notes: Optional[str]
    onchain_tx_hash: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class AuditLogOut(BaseModel):
    log_id: str
    site_id: str
    timestamp: datetime.datetime
    action_type: str
    actor_id: str
    details: Optional[str]
    evidence_hash: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class DashboardSummaryOut(BaseModel):
    total_sites: int
    total_registered_area_ha: float
    total_estimated_capacity_tco2e: float
    total_approved_capacity_tco2e: float
    total_issued_credits_tco2e: float
    total_available_capacity_tco2e: float
    total_issuance_deficit_tco2e: float
    sites_under_review_count: int
    latest_assessments: List[AssessmentOut]
    recent_logs: List[AuditLogOut]

