import json
from typing import Tuple, Dict, Any
from shapely.geometry import shape, Polygon, MultiPolygon
from shapely.validation import explain_validity
import pyproj

geod = pyproj.Geod(ellps="WGS84")

def validate_and_calculate_polygon(geojson_str: str) -> Tuple[bool, str, float, Dict[str, Any]]:
    """
    Validates boundary GeoJSON against RFC 7946 specifications and computes
    defensible geodesic surface area in hectares using the WGS84 ellipsoid.
    
    Returns:
        (is_valid, error_message, area_ha, parsed_geojson)
    """
    try:
        parsed = json.loads(geojson_str)
    except Exception as e:
        return False, f"Invalid JSON format: {str(e)}", 0.0, {}

    # Handle Feature or FeatureCollection wrapper if present
    geom_data = parsed
    if isinstance(parsed, dict):
        if parsed.get("type") == "Feature":
            geom_data = parsed.get("geometry", {})
        elif parsed.get("type") == "FeatureCollection":
            features = parsed.get("features", [])
            if not features:
                return False, "FeatureCollection contains no features", 0.0, {}
            geom_data = features[0].get("geometry", {})

    if not isinstance(geom_data, dict) or "type" not in geom_data or "coordinates" not in geom_data:
        return False, "Missing GeoJSON geometry or coordinates", 0.0, {}

    geom_type = geom_data.get("type")
    if geom_type not in ["Polygon", "MultiPolygon"]:
        return False, f"Unsupported geometry type '{geom_type}'. Must be Polygon or MultiPolygon", 0.0, {}

    try:
        shapely_geom = shape(geom_data)
    except Exception as e:
        return False, f"Geometry parsing error: {str(e)}", 0.0, {}

    # Topological validity check
    if not shapely_geom.is_valid:
        reason = explain_validity(shapely_geom)
        return False, f"Topological error: {reason}", 0.0, {}

    if shapely_geom.is_empty:
        return False, "Geometry cannot be empty", 0.0, {}

    # Geographic boundary sanity check (Indian Subcontinent bounds: Lat 8-37, Lon 68-97)
    minx, miny, maxx, maxy = shapely_geom.bounds
    if not (65.0 <= minx <= 100.0 and 65.0 <= maxx <= 100.0 and 6.0 <= miny <= 38.0 and 6.0 <= maxy <= 38.0):
        return False, f"Coordinates out of bounds for Indian coastal wetlands: bbox [{minx:.2f}, {miny:.2f}, {maxx:.2f}, {maxy:.2f}]", 0.0, {}

    # Calculate geodesic area on WGS84 ellipsoid
    # pyproj geometry_area_perimeter returns area in m^2
    try:
        area_m2, _ = geod.geometry_area_perimeter(shapely_geom)
        area_ha = abs(area_m2) / 10000.0
    except Exception as e:
        return False, f"Failed to compute geodesic area: {str(e)}", 0.0, {}

    if area_ha < 0.1:
        return False, f"Parcel area too small ({area_ha:.4f} ha). Minimum is 0.1 ha.", area_ha, geom_data
    if area_ha > 10000.0:
        return False, f"Parcel area too large ({area_ha:.2f} ha). Maximum is 10,000 ha.", area_ha, geom_data

    return True, "", round(area_ha, 3), geom_data

