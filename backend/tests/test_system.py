import pytest
import json
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.geo import validate_and_calculate_polygon
from backend.app.capacity import calculate_capacity_balances
from backend.app.remote_sensing import evaluate_quality_gate, evaluate_anomaly_rules

client = TestClient(app)

def test_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_summary():
    res = client.get("/api/v1/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_sites"] >= 3
    assert data["total_registered_area_ha"] > 0
    assert "total_available_capacity_tco2e" in data

def test_geodesic_area_and_validation():
    # Valid polygon in Pichavaram
    valid_poly = {
        "type": "Polygon",
        "coordinates": [[
            [79.7740, 11.4230],
            [79.7780, 11.4245],
            [79.7790, 11.4270],
            [79.7760, 11.4285],
            [79.7730, 11.4260],
            [79.7740, 11.4230]
        ]]
    }
    is_valid, err, area, _ = validate_and_calculate_polygon(json.dumps(valid_poly))
    assert is_valid is True
    assert area > 0

    # Self-intersecting polygon (bowtie)
    invalid_poly = {
        "type": "Polygon",
        "coordinates": [[
            [79.77, 11.42],
            [79.79, 11.44],
            [79.77, 11.44],
            [79.79, 11.42],
            [79.77, 11.42]
        ]]
    }
    is_valid, err, area, _ = validate_and_calculate_polygon(json.dumps(invalid_poly))
    assert is_valid is False
    assert "Self-intersection" in err or "Topological" in err

def test_cloud_quality_gate():
    # Clear observation
    passed, reason = evaluate_quality_gate(valid_pixel_pct=92.0, cloud_cover_pct=8.0)
    assert passed is True
    assert reason == "CLEAR"

    # Cloudy observation (cloud cover > 25%)
    passed, reason = evaluate_quality_gate(valid_pixel_pct=65.0, cloud_cover_pct=35.0)
    assert passed is False
    assert "cloud" in reason.lower() or "ratio" in reason.lower()

def test_capacity_deficit_invariants_without_credit_revocation():
    # Normal case: approved 50, issued 20 -> available 30, deficit 0
    bal1 = calculate_capacity_balances(approved_capacity_tco2e=50.0, issued_credits_tco2e=20.0)
    assert bal1["available_capacity_tco2e"] == 30.0
    assert bal1["issuance_deficit_tco2e"] == 0.0
    assert bal1["issued_credits_tco2e"] == 20.0

    # Degradation scenario: approved lowered to 15, while issued remains 20
    # Available must drop to 0, deficit is 5, and issued credits remain 20 (not revoked!)
    bal2 = calculate_capacity_balances(approved_capacity_tco2e=15.0, issued_credits_tco2e=20.0)
    assert bal2["available_capacity_tco2e"] == 0.0
    assert bal2["issuance_deficit_tco2e"] == 5.0
    assert bal2["issued_credits_tco2e"] == 20.0

def test_storm_simulation_and_review_workflow():
    # Site 1 is healthy
    res_site = client.get("/api/v1/sites/IND-TN-PIC-001")
    assert res_site.status_code == 200

    # Simulate storm event on Site 1
    res_storm = client.post("/api/v1/sites/IND-TN-PIC-001/simulate-storm")
    assert res_storm.status_code == 200
    data = res_storm.json()
    assert data["assessment"]["anomaly_detected"] is True

    # Check that site status moved to UNDER_REVIEW
    res_site_after = client.get("/api/v1/sites/IND-TN-PIC-001")
    assert res_site_after.json()["status"] == "UNDER_REVIEW"

    # Auditor reviews and adjusts approved capacity to 18.0 tCO2e
    # Since Site 1 had 20.0 tCO2e issued credits previously, lowering to 18.0 tCO2e should record a 2.0 tCO2e deficit!
    review_payload = {
        "action": "APPROVE",
        "approved_capacity_tco2e": 18.0,
        "issued_credits_delta": 0.0,
        "reviewer_notes": "Field audit confirmed cyclone storm damage. Approved capacity lowered to 18.0 tCO2e. Issuance deficit recorded without cancelling issued credits.",
        "reviewed_by": "Dr. S. Ramanathan (Verifier)"
    }
    res_review = client.post("/api/v1/sites/IND-TN-PIC-001/capacity/review", json=review_payload)
    assert res_review.status_code == 200
    rev_data = res_review.json()
    assert rev_data["available_capacity_tco2e"] == 0.0
    assert rev_data["issuance_deficit_tco2e"] == 2.0
    assert rev_data["issued_credits_tco2e"] == 20.0
    assert rev_data["approval_status"] == "APPROVED"

