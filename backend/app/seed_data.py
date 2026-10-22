import json
import datetime
from sqlalchemy.orm import Session
from .models import Organization, Site, MonitoringAssessment, CapacityRecord, AuditLog
from .geo import validate_and_calculate_polygon
from .remote_sensing import compute_evidence_hash
from .capacity import calculate_capacity_balances

# Accurate polygons for Pichavaram Mangroves (near Chidambaram, Cuddalore District, Tamil Nadu)
# Center approx: 11.428° N, 79.780° E

POLY_PICHAVARAM_CORE = {
    "type": "Polygon",
    "coordinates": [[
        [79.7785, 11.4260],
        [79.7820, 11.4265],
        [79.7835, 11.4290],
        [79.7810, 11.4310],
        [79.7770, 11.4295],
        [79.7785, 11.4260]
    ]]
}

POLY_COLEROON_RESTORE = {
    "type": "Polygon",
    "coordinates": [[
        [79.7840, 11.4210],
        [79.7885, 11.4225],
        [79.7890, 11.4255],
        [79.7850, 11.4250],
        [79.7830, 11.4225],
        [79.7840, 11.4210]
    ]]
}

POLY_CHIDAMBARAM_BUFFER = {
    "type": "Polygon",
    "coordinates": [[
        [79.7720, 11.4330],
        [79.7765, 11.4340],
        [79.7770, 11.4370],
        [79.7735, 11.4385],
        [79.7705, 11.4355],
        [79.7720, 11.4330]
    ]]
}

def seed_database(db: Session):
    # Check if already seeded
    if db.query(Organization).first():
        return

    # 1. Create Organizations
    org1 = Organization(
        org_id="ORG-TN-FOREST",
        name="Tamil Nadu Forest Department (Coastal Marine Wing)",
        org_type="GOV_FOREST_DEPT",
        contact_email="coastal.forest@tn.gov.in"
    )
    org2 = Organization(
        org_id="ORG-MSSRF",
        name="M. S. Swaminathan Research Foundation (MSSRF)",
        org_type="NGO",
        contact_email="coastal.ecosystems@mssrf.res.in"
    )
    db.add_all([org1, org2])
    db.commit()

    # 2. Create Site 1: Pichavaram Core Stand (Healthy)
    is_valid, _, area1, _ = validate_and_calculate_polygon(json.dumps(POLY_PICHAVARAM_CORE))
    site1 = Site(
        site_id="IND-TN-PIC-001",
        org_id=org1.org_id,
        name="Pichavaram Main Tidal Channel (Core Zone)",
        boundary_geojson=json.dumps(POLY_PICHAVARAM_CORE),
        registered_area_ha=12.4,
        geodesic_area_ha=area1,
        ecosystem_type="Dense Rhizophora mucronata & Avicennia marina",
        restoration_date="2018-03-15",
        status="ACTIVE_MONITORED",
        latest_ndvi=0.724,
        latest_ndmi=0.362,
        latest_canopy_proxy_ha=11.2,
        onchain_hash="0x4a8f9c12b7e6d0a3f89e21b745cd1209bfae34890cde4f7a21358bfa98231ec0"
    )

    # 3. Create Site 2: Coleroon Restoration Stand
    is_valid, _, area2, _ = validate_and_calculate_polygon(json.dumps(POLY_COLEROON_RESTORE))
    site2 = Site(
        site_id="IND-TN-PIC-002",
        org_id=org2.org_id,
        name="Coleroon Estuary Mangrove Restoration Patch A",
        boundary_geojson=json.dumps(POLY_COLEROON_RESTORE),
        registered_area_ha=8.1,
        geodesic_area_ha=area2,
        ecosystem_type="Young Avicennia officinalis plantation",
        restoration_date="2022-07-20",
        status="ACTIVE_MONITORED",
        latest_ndvi=0.548,
        latest_ndmi=0.285,
        latest_canopy_proxy_ha=6.9,
        onchain_hash="0x7f23c9a1d8b4e72a0f81c905b214df7830ac5e9b87201c4e93012bdf7819ea24"
    )

    # 4. Create Site 3: Chidambaram Buffer Stand (Under Review / Anomaly)
    is_valid, _, area3, _ = validate_and_calculate_polygon(json.dumps(POLY_CHIDAMBARAM_BUFFER))
    site3 = Site(
        site_id="IND-TN-PIC-003",
        org_id=org1.org_id,
        name="Chidambaram Coastal Mudflat Buffer Stand",
        boundary_geojson=json.dumps(POLY_CHIDAMBARAM_BUFFER),
        registered_area_ha=6.5,
        geodesic_area_ha=area3,
        ecosystem_type="Fringe Rhizophora apiculata & marsh transition",
        restoration_date="2020-11-10",
        status="UNDER_REVIEW",
        latest_ndvi=0.452,
        latest_ndmi=0.178,
        latest_canopy_proxy_ha=4.8,
        onchain_hash="0x918cb4e73091f284e098716b3254fc1209ab457689deac8091423bfda7623190"
    )
    db.add_all([site1, site2, site3])
    db.commit()

    # 5. Assessments for Site 1 (Healthy Historical Series)
    a1_1 = MonitoringAssessment(
        assessment_id="ASM-PIC001-2024-Q1",
        site_id=site1.site_id,
        observation_date_start="2024-01-01",
        observation_date_end="2024-01-31",
        valid_pixel_pct=94.2,
        mean_ndvi=0.695,
        mean_ndmi=0.334,
        observed_canopy_proxy_ha=10.8,
        quality_flag="CLEAR",
        anomaly_detected=False,
        evidence_hash=compute_evidence_hash({"site": site1.site_id, "epoch": "2024-Q1", "ndvi": 0.695}),
        created_at=datetime.datetime(2024, 2, 2, 10, 0)
    )
    a1_2 = MonitoringAssessment(
        assessment_id="ASM-PIC001-2024-Q3",
        site_id=site1.site_id,
        observation_date_start="2024-07-01",
        observation_date_end="2024-07-31",
        valid_pixel_pct=91.8,
        mean_ndvi=0.718,
        mean_ndmi=0.355,
        observed_canopy_proxy_ha=11.1,
        quality_flag="CLEAR",
        anomaly_detected=False,
        evidence_hash=compute_evidence_hash({"site": site1.site_id, "epoch": "2024-Q3", "ndvi": 0.718}),
        created_at=datetime.datetime(2024, 8, 2, 10, 0)
    )
    a1_3 = MonitoringAssessment(
        assessment_id="ASM-PIC001-2026-RECENT",
        site_id=site1.site_id,
        observation_date_start="2026-09-01",
        observation_date_end="2026-09-30",
        valid_pixel_pct=96.5,
        mean_ndvi=0.724,
        mean_ndmi=0.362,
        observed_canopy_proxy_ha=11.2,
        quality_flag="CLEAR",
        anomaly_detected=False,
        evidence_hash=compute_evidence_hash({"site": site1.site_id, "epoch": "2026-Recent", "ndvi": 0.724}),
        created_at=datetime.datetime(2026, 10, 5, 9, 30)
    )

    # Assessments for Site 3 (Shows recent sharp drop triggering Anomaly Alert)
    a3_1 = MonitoringAssessment(
        assessment_id="ASM-PIC003-2025-BASE",
        site_id=site3.site_id,
        observation_date_start="2025-05-01",
        observation_date_end="2025-05-31",
        valid_pixel_pct=92.0,
        mean_ndvi=0.640,
        mean_ndmi=0.310,
        observed_canopy_proxy_ha=5.9,
        quality_flag="CLEAR",
        anomaly_detected=False,
        evidence_hash=compute_evidence_hash({"site": site3.site_id, "epoch": "2025-Base", "ndvi": 0.640}),
        created_at=datetime.datetime(2025, 6, 1, 10, 0)
    )
    a3_2 = MonitoringAssessment(
        assessment_id="ASM-PIC003-2026-ANOMALY",
        site_id=site3.site_id,
        observation_date_start="2026-09-15",
        observation_date_end="2026-10-15",
        valid_pixel_pct=88.4,
        mean_ndvi=0.452,
        mean_ndmi=0.178,
        observed_canopy_proxy_ha=4.8,
        quality_flag="CLEAR",
        anomaly_detected=True,
        anomaly_details="Vegetation stress alert: Mean NDVI dropped by 29.4% (0.640 -> 0.452) | Canopy contraction alert: Area dropped by 18.6%",
        evidence_hash=compute_evidence_hash({"site": site3.site_id, "epoch": "2026-Anomaly", "ndvi": 0.452}),
        created_at=datetime.datetime(2026, 10, 16, 14, 20)
    )
    db.add_all([a1_1, a1_2, a1_3, a3_1, a3_2])
    db.commit()

    # 6. Capacity Records
    # Site 1: Approved 45.0, Issued 20.0 -> Available 25.0
    cap1 = CapacityRecord(
        record_id="CAP-PIC001-V1",
        site_id=site1.site_id,
        assessment_id=a1_3.assessment_id,
        estimated_capacity_tco2e=48.2,
        approved_capacity_tco2e=45.0,
        issued_credits_tco2e=20.0,
        available_capacity_tco2e=25.0,
        issuance_deficit_tco2e=0.0,
        approval_status="APPROVED",
        reviewed_by="Dr. S. Ramanathan (Lead Verifier)",
        reviewer_notes="Verified against 2024-2026 Sentinel-2 clear-sky composite. Canopy density stable.",
        onchain_tx_hash="0x889a71bcde412098bfa76012c490a12e345890cba72190ef817203bca710928a"
    )

    # Site 2: Approved 22.0, Issued 0.0 -> Available 22.0
    cap2 = CapacityRecord(
        record_id="CAP-PIC002-V1",
        site_id=site2.site_id,
        estimated_capacity_tco2e=24.5,
        approved_capacity_tco2e=22.0,
        issued_credits_tco2e=0.0,
        available_capacity_tco2e=22.0,
        issuance_deficit_tco2e=0.0,
        approval_status="APPROVED",
        reviewed_by="P. Meenakshi (Forest Officer)",
        reviewer_notes="Baseline inspection approved. Propagule survival confirmed above 85%."
    )

    # Site 3: Approved 28.0, Issued 20.0 -> Currently Available 8.0, but Alert is Pending Review!
    cap3 = CapacityRecord(
        record_id="CAP-PIC003-V1",
        site_id=site3.site_id,
        assessment_id=a3_2.assessment_id,
        estimated_capacity_tco2e=17.5,
        approved_capacity_tco2e=28.0,
        issued_credits_tco2e=20.0,
        available_capacity_tco2e=8.0,
        issuance_deficit_tco2e=0.0,
        approval_status="PROVISIONAL",
        reviewed_by="Under Review Queue",
        reviewer_notes="Pending auditor triage following 29% NDVI drop alert."
    )
    db.add_all([cap1, cap2, cap3])
    db.commit()

    # 7. Audit Logs
    log1 = AuditLog(
        log_id="LOG-001",
        site_id=site1.site_id,
        action_type="SITE_REGISTERED",
        actor_id="coastal.forest@tn.gov.in",
        details="Site registered with 12.4 ha cadastral area. Geodesic validation passed."
    )
    log2 = AuditLog(
        log_id="LOG-002",
        site_id=site1.site_id,
        action_type="CAPACITY_APPROVED",
        actor_id="Dr. S. Ramanathan",
        details="Capacity approved at 45.0 tCO2e. Available for issuance: 25.0 tCO2e."
    )
    log3 = AuditLog(
        log_id="LOG-003",
        site_id=site3.site_id,
        action_type="ANOMALY_FLAGGED",
        actor_id="AUTOMATED_MRV_ENGINE",
        details="Vegetation stress alert: Mean NDVI dropped by 29.4%. Site moved to UNDER_REVIEW.",
        evidence_hash=a3_2.evidence_hash
    )
    db.add_all([log1, log2, log3])
    db.commit()

