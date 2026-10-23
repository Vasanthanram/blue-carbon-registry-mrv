import datetime
import uuid
import json
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import engine, Base, get_db
from .models import Organization, Site, MonitoringAssessment, CapacityRecord, AuditLog
from .schemas import (
    SiteCreate, SiteOut,
    AssessmentCreate, AssessmentOut,
    CapacityReviewAction, CapacityRecordOut,
    AuditLogOut, DashboardSummaryOut, OrganizationOut
)
from .geo import validate_and_calculate_polygon
from .remote_sensing import (
    evaluate_quality_gate,
    evaluate_anomaly_rules,
    compute_evidence_hash
)
from .capacity import (
    calculate_capacity_balances,
    calculate_optional_provisional_capacity
)
from .seed_data import seed_database

# Create tables
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = next(get_db())
    seed_database(db)
    yield

app = FastAPI(
    title="Blue Carbon Registry & MRV API",
    description="Backend API for Mangrove Restoration Site Registration, Sentinel-2 MRV & Governed Capacity Management",
    version="2.2.0",
    lifespan=lifespan
)

# CORS setup for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse

FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
ASSETS_DIR = os.path.join(FRONTEND_DIST, "assets")

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.get("/")
def read_root():
    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return RedirectResponse(url="/docs")

@app.get("/dashboard")
def redirect_to_dashboard():
    return RedirectResponse(url="/")

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Blue Carbon Registry & MRV Engine",
        "version": "2.2.0",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.get("/api/v1/organizations", response_model=List[OrganizationOut])
def list_organizations(db: Session = Depends(get_db)):
    return db.query(Organization).all()

@app.get("/api/v1/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(db: Session = Depends(get_db)):
    sites = db.query(Site).all()
    total_sites = len(sites)
    total_registered_area = sum(s.registered_area_ha for s in sites)

    # Calculate overall capacity balances
    total_est = 0.0
    total_app = 0.0
    total_issued = 0.0
    total_avail = 0.0
    total_deficit = 0.0
    under_review_count = 0

    for site in sites:
        if site.status == "UNDER_REVIEW":
            under_review_count += 1
        latest_cap = db.query(CapacityRecord).filter(CapacityRecord.site_id == site.site_id).order_by(CapacityRecord.reviewed_at.desc()).first()
        if latest_cap:
            total_est += latest_cap.estimated_capacity_tco2e
            total_app += latest_cap.approved_capacity_tco2e
            total_issued += latest_cap.issued_credits_tco2e
            total_avail += latest_cap.available_capacity_tco2e
            total_deficit += latest_cap.issuance_deficit_tco2e

    latest_assessments = db.query(MonitoringAssessment).order_by(MonitoringAssessment.created_at.desc()).limit(5).all()
    recent_logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(10).all()

    return DashboardSummaryOut(
        total_sites=total_sites,
        total_registered_area_ha=round(total_registered_area, 2),
        total_estimated_capacity_tco2e=round(total_est, 2),
        total_approved_capacity_tco2e=round(total_app, 2),
        total_issued_credits_tco2e=round(total_issued, 2),
        total_available_capacity_tco2e=round(total_avail, 2),
        total_issuance_deficit_tco2e=round(total_deficit, 2),
        sites_under_review_count=under_review_count,
        latest_assessments=latest_assessments,
        recent_logs=recent_logs
    )

@app.get("/api/v1/sites", response_model=List[SiteOut])
def list_sites(db: Session = Depends(get_db)):
    return db.query(Site).order_by(Site.created_at.desc()).all()

@app.get("/api/v1/sites/{site_id}", response_model=SiteOut)
def get_site(site_id: str, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.site_id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail=f"Site '{site_id}' not found.")
    return site

@app.post("/api/v1/sites", response_model=SiteOut, status_code=201)
def register_site(payload: SiteCreate, db: Session = Depends(get_db)):
    # 1. Topological & Geodesic validation
    is_valid, err_msg, geodesic_area, parsed_geom = validate_and_calculate_polygon(payload.boundary_geojson)
    if not is_valid:
        raise HTTPException(status_code=422, detail=f"Boundary validation failed: {err_msg}")

    # Check org exists or use default
    org = db.query(Organization).filter(Organization.org_id == payload.org_id).first()
    if not org:
        org = db.query(Organization).first()
        org_id = org.org_id if org else "ORG-TN-FOREST"
    else:
        org_id = payload.org_id

    # Generate Site ID
    unique_num = db.query(Site).count() + 1
    site_id = f"IND-TN-PIC-{unique_num:03d}"

    # Calculate on-chain commitment hash mock
    canonical_geojson_str = json.dumps(parsed_geom, sort_keys=True)
    boundary_hash = compute_evidence_hash({"site_id": site_id, "boundary": canonical_geojson_str})

    site = Site(
        site_id=site_id,
        org_id=org_id,
        name=payload.name,
        boundary_geojson=canonical_geojson_str,
        registered_area_ha=payload.registered_area_ha,
        geodesic_area_ha=geodesic_area,
        ecosystem_type=payload.ecosystem_type,
        restoration_date=payload.restoration_date or datetime.date.today().isoformat(),
        status="PENDING_BASELINE",
        latest_ndvi=0.60,
        latest_ndmi=0.25,
        latest_canopy_proxy_ha=round(geodesic_area * 0.85, 2),
        onchain_hash=f"0x{boundary_hash[:64]}"
    )
    db.add(site)

    # Initial Audit Log
    log = AuditLog(
        log_id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        site_id=site_id,
        action_type="SITE_REGISTERED",
        actor_id=org_id,
        details=f"Site registered with {payload.registered_area_ha} ha declared and {geodesic_area} ha geodesic area.",
        evidence_hash=boundary_hash
    )
    db.add(log)

    # Initial Capacity record (Provisional)
    init_est = calculate_optional_provisional_capacity(site.latest_canopy_proxy_ha, site.latest_ndvi)
    cap = CapacityRecord(
        record_id=f"CAP-{uuid.uuid4().hex[:8].upper()}",
        site_id=site_id,
        estimated_capacity_tco2e=init_est,
        approved_capacity_tco2e=0.0,
        issued_credits_tco2e=0.0,
        available_capacity_tco2e=0.0,
        issuance_deficit_tco2e=0.0,
        approval_status="PROVISIONAL",
        reviewer_notes="Awaiting baseline satellite ingestion and verifier approval."
    )
    db.add(cap)

    db.commit()
    db.refresh(site)
    return site

@app.get("/api/v1/sites/{site_id}/assessments", response_model=List[AssessmentOut])
def get_site_assessments(site_id: str, db: Session = Depends(get_db)):
    return db.query(MonitoringAssessment).filter(MonitoringAssessment.site_id == site_id).order_by(MonitoringAssessment.created_at.desc()).all()

@app.post("/api/v1/sites/{site_id}/assessments", response_model=AssessmentOut)
def record_assessment(site_id: str, payload: AssessmentCreate, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.site_id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    # 1. Evaluate Data Quality Gate
    is_quality_pass, quality_reason = evaluate_quality_gate(payload.valid_pixel_pct, payload.cloud_cover_pct)
    quality_flag = "CLEAR" if is_quality_pass else "INCONCLUSIVE_DATA_QUALITY"

    # Previous assessment for change detection
    prev_assessment = db.query(MonitoringAssessment).filter(
        MonitoringAssessment.site_id == site_id,
        MonitoringAssessment.quality_flag == "CLEAR"
    ).order_by(MonitoringAssessment.created_at.desc()).first()

    baseline_ndvi = prev_assessment.mean_ndvi if prev_assessment else site.latest_ndvi or payload.mean_ndvi
    prev_canopy = prev_assessment.observed_canopy_proxy_ha if prev_assessment else site.latest_canopy_proxy_ha or payload.observed_canopy_proxy_ha

    anomaly_detected = False
    anomaly_details = None

    if is_quality_pass:
        anomaly_detected, anomaly_details = evaluate_anomaly_rules(
            current_ndvi=payload.mean_ndvi,
            baseline_ndvi=baseline_ndvi,
            current_canopy_proxy_ha=payload.observed_canopy_proxy_ha,
            previous_canopy_proxy_ha=prev_canopy
        )
        # Update site cached stats
        site.latest_ndvi = payload.mean_ndvi
        site.latest_ndmi = payload.mean_ndmi
        site.latest_canopy_proxy_ha = payload.observed_canopy_proxy_ha
        if anomaly_detected:
            site.status = "UNDER_REVIEW"
        elif site.status == "PENDING_BASELINE":
            site.status = "ACTIVE_MONITORED"

    assessment_id = f"ASM-{uuid.uuid4().hex[:8].upper()}"
    evidence_hash = compute_evidence_hash({
        "assessment_id": assessment_id,
        "site_id": site_id,
        "ndvi": payload.mean_ndvi,
        "ndmi": payload.mean_ndmi,
        "canopy": payload.observed_canopy_proxy_ha,
        "quality": quality_flag
    })

    assessment = MonitoringAssessment(
        assessment_id=assessment_id,
        site_id=site_id,
        observation_date_start=payload.observation_date_start,
        observation_date_end=payload.observation_date_end,
        valid_pixel_pct=payload.valid_pixel_pct,
        mean_ndvi=payload.mean_ndvi,
        mean_ndmi=payload.mean_ndmi,
        observed_canopy_proxy_ha=payload.observed_canopy_proxy_ha,
        quality_flag=quality_flag,
        anomaly_detected=anomaly_detected,
        anomaly_details=anomaly_details if anomaly_detected else None,
        evidence_hash=evidence_hash,
        scene_classification=payload.scene_classification
    )
    db.add(assessment)

    if is_quality_pass:
        # Update provisional capacity record
        latest_cap = db.query(CapacityRecord).filter(CapacityRecord.site_id == site_id).order_by(CapacityRecord.reviewed_at.desc()).first()
        current_app = latest_cap.approved_capacity_tco2e if latest_cap else 0.0
        current_issued = latest_cap.issued_credits_tco2e if latest_cap else 0.0

        is_under_review = anomaly_detected or (site.status == "UNDER_REVIEW")
        balances = calculate_capacity_balances(current_app, current_issued, is_under_review=is_under_review)

        new_est = calculate_optional_provisional_capacity(payload.observed_canopy_proxy_ha, payload.mean_ndvi)
        cap = CapacityRecord(
            record_id=f"CAP-{uuid.uuid4().hex[:8].upper()}",
            site_id=site_id,
            assessment_id=assessment_id,
            estimated_capacity_tco2e=new_est,
            approved_capacity_tco2e=balances["approved_capacity_tco2e"],
            issued_credits_tco2e=balances["issued_credits_tco2e"],
            available_capacity_tco2e=balances["available_capacity_tco2e"],
            issuance_deficit_tco2e=balances["issuance_deficit_tco2e"],
            approval_status="PROVISIONAL",
            reviewer_notes=f"Provisional estimate updated to {new_est} tCO2e following observation {assessment_id}." + (" Anomaly flagged: Future issuance restricted pending auditor review." if is_under_review else "")
        )
        db.add(cap)

    # Audit log
    log = AuditLog(
        log_id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        site_id=site_id,
        action_type="ASSESSMENT_RECORDED" if not anomaly_detected else "ANOMALY_FLAGGED",
        actor_id="SENTINEL_2_MRV_PIPELINE",
        details=f"Observation [{payload.observation_date_start} to {payload.observation_date_end}] - Quality: {quality_flag}. Mean NDVI: {payload.mean_ndvi:.3f}." + (f" Anomaly: {anomaly_details}" if anomaly_detected else ""),
        evidence_hash=evidence_hash
    )
    db.add(log)

    db.commit()
    db.refresh(assessment)
    return assessment

@app.post("/api/v1/sites/{site_id}/simulate-storm")
def simulate_storm_damage(site_id: str, db: Session = Depends(get_db)):
    """
    Demonstration Trigger: Ingests an observation representing a storm/cyclone event,
    showing how the system flags an anomaly alert and moves the site to UNDER_REVIEW
    without automatically cancelling or deleting already-issued credits.
    """
    site = db.query(Site).filter(Site.site_id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    base_ndvi = site.latest_ndvi or 0.65
    base_canopy = site.latest_canopy_proxy_ha or (site.geodesic_area_ha * 0.85)

    # Simulate sharp 28% drop in NDVI and 22% drop in canopy area
    degraded_ndvi = round(base_ndvi * 0.72, 3)
    degraded_ndmi = round(max(0.10, (site.latest_ndmi or 0.30) * 0.55), 3)
    degraded_canopy = round(base_canopy * 0.78, 2)

    payload = AssessmentCreate(
        observation_date_start=datetime.date.today().strftime("%Y-%m-01"),
        observation_date_end=datetime.date.today().strftime("%Y-%m-%d"),
        valid_pixel_pct=88.5,
        cloud_cover_pct=11.5,
        mean_ndvi=degraded_ndvi,
        mean_ndmi=degraded_ndmi,
        observed_canopy_proxy_ha=degraded_canopy,
        scene_classification="Sentinel-2 L2A (Simulated Storm Event)"
    )

    assessment = record_assessment(site_id, payload, db)
    return {
        "message": f"Simulated storm event recorded for {site.name}.",
        "site_status": site.status,
        "assessment": assessment
    }

@app.get("/api/v1/sites/{site_id}/capacity", response_model=List[CapacityRecordOut])
def get_site_capacity(site_id: str, db: Session = Depends(get_db)):
    return db.query(CapacityRecord).filter(CapacityRecord.site_id == site_id).order_by(CapacityRecord.reviewed_at.desc()).all()

@app.post("/api/v1/sites/{site_id}/capacity/review", response_model=CapacityRecordOut)
def review_capacity(site_id: str, payload: CapacityReviewAction, db: Session = Depends(get_db)):
    """
    Authorized auditor review action:
    Updates approved capacity, issues new credits, records review justification,
    and recalculates available future issuance capacity and deficit.
    """
    site = db.query(Site).filter(Site.site_id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    latest_cap = db.query(CapacityRecord).filter(CapacityRecord.site_id == site_id).order_by(CapacityRecord.reviewed_at.desc()).first()

    current_approved = latest_cap.approved_capacity_tco2e if latest_cap else 0.0
    current_issued = latest_cap.issued_credits_tco2e if latest_cap else 0.0
    estimated_val = latest_cap.estimated_capacity_tco2e if latest_cap else calculate_optional_provisional_capacity(site.latest_canopy_proxy_ha, site.latest_ndvi)

    new_approved = payload.approved_capacity_tco2e if payload.approved_capacity_tco2e is not None else current_approved
    new_issued = current_issued + (payload.issued_credits_delta or 0.0)

    # Check that new issuance does not exceed available capacity under the approved limit
    if payload.issued_credits_delta and payload.issued_credits_delta > 0:
        available_limit = max(0.0, new_approved - current_issued)
        if payload.issued_credits_delta > available_limit:
            raise HTTPException(
                status_code=400,
                detail=f"Requested issuance ({payload.issued_credits_delta} tCO2e) exceeds available capacity ({available_limit} tCO2e)."
            )

    # If action is approval and site was UNDER_REVIEW, restore to ACTIVE_MONITORED
    if payload.action == "APPROVE":
        approval_status = "APPROVED"
        site.status = "ACTIVE_MONITORED"
        is_under_review = False
    elif payload.action == "REJECT":
        approval_status = "REJECTED"
        is_under_review = True
    else:
        approval_status = "APPROVED"
        site.status = "ACTIVE_MONITORED"
        is_under_review = False

    # Calculate invariants
    balances = calculate_capacity_balances(new_approved, new_issued, is_under_review=is_under_review)

    record_id = f"CAP-{uuid.uuid4().hex[:8].upper()}"
    tx_hash = f"0x{uuid.uuid4().hex}{uuid.uuid4().hex[:32]}"

    new_record = CapacityRecord(
        record_id=record_id,
        site_id=site_id,
        estimated_capacity_tco2e=estimated_val,
        approved_capacity_tco2e=balances["approved_capacity_tco2e"],
        issued_credits_tco2e=balances["issued_credits_tco2e"],
        available_capacity_tco2e=balances["available_capacity_tco2e"],
        issuance_deficit_tco2e=balances["issuance_deficit_tco2e"],
        approval_status=approval_status,
        reviewed_by=payload.reviewed_by,
        reviewer_notes=payload.reviewer_notes,
        onchain_tx_hash=tx_hash
    )
    db.add(new_record)

    # Log review action
    log = AuditLog(
        log_id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        site_id=site_id,
        action_type="CAPACITY_REVIEWED",
        actor_id=payload.reviewed_by,
        details=f"Auditor action: {payload.action}. Approved Cap: {new_approved} tCO2e. Issued: {new_issued} tCO2e. Available: {balances['available_capacity_tco2e']} tCO2e. Deficit: {balances['issuance_deficit_tco2e']} tCO2e. Notes: {payload.reviewer_notes}",
        evidence_hash=tx_hash[:64]
    )
    db.add(log)

    db.commit()
    db.refresh(new_record)
    return new_record

@app.get("/api/v1/audit-logs", response_model=List[AuditLogOut])
def list_audit_logs(site_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AuditLog)
    if site_id:
        query = query.filter(AuditLog.site_id == site_id)
    return query.order_by(AuditLog.timestamp.desc()).limit(100).all()

@app.post("/api/v1/reset-seed")
def reset_demo_data(db: Session = Depends(get_db)):
    """Resets database and reloads default Pichavaram demonstration plots."""
    db.query(AuditLog).delete()
    db.query(CapacityRecord).delete()
    db.query(MonitoringAssessment).delete()
    db.query(Site).delete()
    db.query(Organization).delete()
    db.commit()
    seed_database(db)
    return {"message": "Demonstration database successfully reloaded with Pichavaram baseline plots."}
