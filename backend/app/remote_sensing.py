import hashlib
import json
from typing import Dict, Any, Tuple

def compute_evidence_hash(payload: Dict[str, Any]) -> str:
    """Computes a SHA-256 digest of normalized assessment data."""
    serialized = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def evaluate_quality_gate(valid_pixel_pct: float, cloud_cover_pct: float) -> Tuple[bool, str]:
    """
    Quality gate: Valid pixel pct must be >= 70% and cloud cover <= 25%.
    """
    if valid_pixel_pct < 70.0:
        return False, f"Valid pixel ratio too low ({valid_pixel_pct:.1f}% < 70%). Masked by cloud/shadows."
    if cloud_cover_pct > 25.0:
        return False, f"Cloud contamination too high ({cloud_cover_pct:.1f}% > 25%)."
    return True, "CLEAR"

def evaluate_anomaly_rules(
    current_ndvi: float,
    baseline_ndvi: float,
    current_canopy_proxy_ha: float,
    previous_canopy_proxy_ha: float
) -> Tuple[bool, str]:
    """
    Evaluates:
    - Stress alert: NDVI drop > 15% from baseline.
    - Contraction alert: Canopy proxy loss > 10% from previous.
    """
    reasons = []
    if baseline_ndvi > 0:
        ndvi_delta_pct = ((current_ndvi - baseline_ndvi) / baseline_ndvi) * 100.0
        if ndvi_delta_pct < -15.0:
            reasons.append(f"Vegetation stress alert: Mean NDVI dropped by {abs(ndvi_delta_pct):.1f}% (threshold: -15%)")

    if previous_canopy_proxy_ha > 0:
        area_delta_pct = ((current_canopy_proxy_ha - previous_canopy_proxy_ha) / previous_canopy_proxy_ha) * 100.0
        if area_delta_pct < -10.0:
            reasons.append(f"Canopy contraction alert: Area dropped by {abs(area_delta_pct):.1f}% (threshold: -10%)")

    if reasons:
        return True, " | ".join(reasons)
    return False, "Normal ecological variation within baseline limits."

