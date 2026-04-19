from geopy.distance import geodesic


def get_distance_km(lat1, lng1, lat2, lng2):
    """
    Returns distance in km between two lat/lng points.
    Returns None if any coordinate is missing.
    """
    if not all([lat1, lng1, lat2, lng2]):
        return None
    return geodesic((float(lat1), float(lng1)), (float(lat2), float(lng2))).km
