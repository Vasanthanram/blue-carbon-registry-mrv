import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base

class Organization(Base):
    __tablename__ = "organizations"

    org_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    org_type = Column(String(50), default="NGO")  # NGO, GOV_FOREST_DEPT, ACADEMIC
    contact_email = Column(String(100), nullable=False)

    sites = relationship("Site", back_populates="organization")

class Site(Base):
    __tablename__ = "sites"

    site_id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.org_id"), nullable=False)
    name = Column(String(150), nullable=False)
    boundary_geojson = Column(Text, nullable=False)
    registered_area_ha = Column(Float, nullable=False)
    geodesic_area_ha = Column(Float, nullable=False)
    ecosystem_type = Column(String(100), default="Rhizophora / Avicennia Mangrove")
    restoration_date = Column(String(50), nullable=True)
    status = Column(String(50), default="ACTIVE_MONITORED")  # PENDING_BASELINE, ACTIVE_MONITORED, UNDER_REVIEW, HALTED
    
    # Latest cached ecological indicators
    latest_ndvi = Column(Float, nullable=True)
    latest_ndmi = Column(Float, nullable=True)
    latest_canopy_proxy_ha = Column(Float, nullable=True)
    onchain_hash = Column(String(66), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    organization = relationship("Organization", back_populates="sites")
    assessments = relationship("MonitoringAssessment", back_populates="site", cascade="all, delete-orphan", order_by="desc(MonitoringAssessment.created_at)")
    capacity_records = relationship("CapacityRecord", back_populates="site", cascade="all, delete-orphan", order_by="desc(CapacityRecord.reviewed_at)")
    audit_logs = relationship("AuditLog", back_populates="site", cascade="all, delete-orphan", order_by="desc(AuditLog.timestamp)")

class MonitoringAssessment(Base):
    __tablename__ = "monitoring_assessments"

    assessment_id = Column(String(50), primary_key=True, index=True)
    site_id = Column(String(50), ForeignKey("sites.site_id"), nullable=False)
    observation_date_start = Column(String(50), nullable=False)
    observation_date_end = Column(String(50), nullable=False)
    valid_pixel_pct = Column(Float, default=100.0)
    mean_ndvi = Column(Float, nullable=False)
    mean_ndmi = Column(Float, nullable=False)
    observed_canopy_proxy_ha = Column(Float, nullable=False)
    quality_flag = Column(String(50), default="CLEAR")  # CLEAR, INCONCLUSIVE_DATA_QUALITY
    anomaly_detected = Column(Boolean, default=False)
    anomaly_details = Column(String(255), nullable=True)
    evidence_hash = Column(String(64), nullable=True)
    scene_classification = Column(String(100), default="Sentinel-2 L2A Harmonized")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    site = relationship("Site", back_populates="assessments")

class CapacityRecord(Base):
    __tablename__ = "capacity_records"

    record_id = Column(String(50), primary_key=True, index=True)
    site_id = Column(String(50), ForeignKey("sites.site_id"), nullable=False)
    assessment_id = Column(String(50), ForeignKey("monitoring_assessments.assessment_id"), nullable=True)
    estimated_capacity_tco2e = Column(Float, default=0.0)
    approved_capacity_tco2e = Column(Float, default=0.0)
    issued_credits_tco2e = Column(Float, default=0.0)
    available_capacity_tco2e = Column(Float, default=0.0)
    issuance_deficit_tco2e = Column(Float, default=0.0)
    approval_status = Column(String(50), default="PROVISIONAL")  # PROVISIONAL, APPROVED, REJECTED
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewer_notes = Column(Text, nullable=True)
    onchain_tx_hash = Column(String(66), nullable=True)

    site = relationship("Site", back_populates="capacity_records")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(String(50), primary_key=True, index=True)
    site_id = Column(String(50), ForeignKey("sites.site_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    action_type = Column(String(100), nullable=False)
    actor_id = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    evidence_hash = Column(String(64), nullable=True)

    site = relationship("Site", back_populates="audit_logs")

