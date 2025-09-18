from pydantic import BaseModel
from typing import Optional, List

class Athlete(BaseModel):
    id: str
    name: str
    country: Optional[str] = None
    sport: str
    team: Optional[str] = None
    # Additional normalized fields
    points: Optional[float] = None
    rank: Optional[int] = None

class AthleteSearchResponse(BaseModel):
    sport: str
    athletes: List[Athlete]

class CompareAthleteRequest(BaseModel):
    sport: str
    athlete_id: str
    user_metrics: dict  # e.g., {"speed_kmh": 28, "distance_km": 10, "time_sec": 1800}

class CompareAthleteMetric(BaseModel):
    metric: str
    athlete_value: float | int | str | None
    user_value: float | int | str | None
    delta: float | None = None
    percentile: float | None = None

class CompareAthleteResponse(BaseModel):
    sport: str
    athlete_id: str
    athlete_name: str
    metrics: List[CompareAthleteMetric]


# Workout related schemas placed here temporarily; could be moved to separate module later
class WorkoutBase(BaseModel):
    sport: str
    duration_sec: int
    distance_m: float | None = None
    elevation_m: float | None = None
    avg_power_w: float | None = None
    avg_hr: int | None = None
    units: dict | None = None
    raw_metrics: dict | None = None
    notes: str | None = None

class WorkoutCreate(WorkoutBase):
    started_at: str | None = None  # ISO8601; if omitted, server uses now

class WorkoutRead(WorkoutBase):
    id: int
    user_id: int
    started_at: str | None = None
    created_at: str | None = None

class WorkoutList(BaseModel):
    workouts: List[WorkoutRead]
