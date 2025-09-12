from pydantic import BaseModel
from typing import Optional, List


class TicketClass(BaseModel):
    """Generic ticket class structure (was originally aligned with Eventbrite)."""
    id: Optional[str] = None
    name: Optional[str] = None
    free: Optional[bool] = None
    donation: Optional[bool] = None
    on_sale_status: Optional[str] = None
    quantity_total: Optional[int] = None
    quantity_sold: Optional[int] = None
    cost_value: Optional[int] = None          # value in minor units (cents)
    cost_major: Optional[float] = None        # value converted to major units
    currency: Optional[str] = None

class Event(BaseModel):
    id: str
    source: str
    name: str
    description: Optional[str] = None
    url: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None
    timezone: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    image: Optional[str] = None
    price: Optional[str] = None
    capacity: Optional[int] = None
    organizer: Optional[str] = None
    is_tiered: Optional[bool] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    currency: Optional[str] = None
    ticket_classes: Optional[List[TicketClass]] = None

class EventsResponse(BaseModel):
    total: int
    data: List[Event]


def compute_viewport(events: List[Event]) -> dict:
    """Compute a simple bounding box + center for mapping (viewport).
    Returns empty dict if no coordinates present.
    """
    lats = [e.latitude for e in events if e.latitude is not None]
    lons = [e.longitude for e in events if e.longitude is not None]
    if not lats or not lons:
        return {}
    min_lat, max_lat = min(lats), max(lats)
    min_lon, max_lon = min(lons), max(lons)
    return {
        "min_lat": min_lat,
        "max_lat": max_lat,
        "min_lon": min_lon,
        "max_lon": max_lon,
        "center_lat": (min_lat + max_lat) / 2.0,
        "center_lon": (min_lon + max_lon) / 2.0,
        "span_lat": max(0.0001, max_lat - min_lat),
        "span_lon": max(0.0001, max_lon - min_lon),
    }