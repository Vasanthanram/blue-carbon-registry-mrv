from typing import Dict, Any

def calculate_capacity_balances(
    approved_capacity_tco2e: float,
    issued_credits_tco2e: float,
    is_under_review: bool = False
) -> Dict[str, float]:
    """
    Enforces the mathematical invariants:
    - Available Capacity: max(0, C_app - C_issued) if not under review else 0.0 (restricted)
    - Issuance Deficit: max(0, C_issued - C_app)
    Credits already issued are never revoked or deleted.
    """
    c_app = max(0.0, float(approved_capacity_tco2e))
    c_issued = max(0.0, float(issued_credits_tco2e))

    if c_app >= c_issued:
        c_avail = 0.0 if is_under_review else (c_app - c_issued)
        c_deficit = 0.0
    else:
        c_avail = 0.0
        c_deficit = c_issued - c_app

    return {
        "approved_capacity_tco2e": round(c_app, 2),
        "issued_credits_tco2e": round(c_issued, 2),
        "available_capacity_tco2e": round(c_avail, 2),
        "issuance_deficit_tco2e": round(c_deficit, 2)
    }

def calculate_optional_provisional_capacity(
    observed_canopy_proxy_ha: float,
    mean_ndvi: float,
    baseline_rate_placeholder: float = 6.0,
    mature_benchmark_ndvi: float = 0.70,
    buffer_deduction_pct: float = 0.20
) -> float:
    """
    Optional illustrative prototype calculation helper.
    Explicitly labeled as an unvalidated prototype heuristic for demonstration.
    """
    if observed_canopy_proxy_ha <= 0 or mean_ndvi <= 0:
        return 0.0
    
    canopy_density_factor = min(1.0, max(0.0, mean_ndvi / mature_benchmark_ndvi))
    annual_gross = observed_canopy_proxy_ha * baseline_rate_placeholder * canopy_density_factor
    net_capacity = annual_gross * (1.0 - buffer_deduction_pct)
    return round(net_capacity, 2)
