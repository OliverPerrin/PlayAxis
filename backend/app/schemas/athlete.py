from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime, timezone
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
    duration_sec: int = Field(gt=0, le=604800)
    distance_m: float | None = Field(
        default=None, ge=0, le=10000000, allow_inf_nan=False
    )
    elevation_m: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    avg_power_w: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    avg_hr: int | None = Field(default=None, ge=20, le=300)
    units: dict | None = None
    raw_metrics: dict | None = None
    notes: str | None = Field(default=None, max_length=2000)


class WorkoutCreate(WorkoutBase):
    started_at: str | None = None  # ISO8601; if omitted, server uses now


class WorkoutRead(WorkoutBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    started_at: datetime | None = None
    created_at: datetime | None = None

    @field_validator("started_at", "created_at")
    @classmethod
    def explicit_utc(cls, value):
        if value and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value


class WorkoutList(BaseModel):
    workouts: List[WorkoutRead]
