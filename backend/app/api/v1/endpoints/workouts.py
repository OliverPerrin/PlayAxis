from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.schemas.athlete import WorkoutCreate, WorkoutRead, WorkoutList
from app.db.session import SessionLocal
from app.crud.workout import create_workout, get_workout, list_workouts, delete_workout
from app.models.user import User
from app.core.activities import ACTIVITIES
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/workouts", tags=["workouts"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", response_model=WorkoutRead)
@router.post("/", response_model=WorkoutRead)
def create(
    workout: WorkoutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = workout.model_dump(exclude_unset=True)
    if workout.sport not in ACTIVITIES:
        raise HTTPException(status_code=400, detail="Choose a supported activity")
    if not payload.get("started_at"):
        payload.pop("started_at", None)
    else:
        try:
            # validate parse
            dt = datetime.fromisoformat(payload["started_at"].replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            dt = dt.astimezone(timezone.utc)
            if dt > datetime.now(timezone.utc):
                raise ValueError("Activity cannot start in the future")
            payload["started_at"] = dt
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid started_at format")
    # basic validation hints
    if payload["duration_sec"] <= 0:
        raise HTTPException(status_code=400, detail="duration_sec must be positive")
    if payload.get("distance_m") is not None and payload["distance_m"] < 0:
        raise HTTPException(status_code=400, detail="distance_m cannot be negative")
    obj = create_workout(db, current_user.id, payload)
    return obj


@router.get("", response_model=WorkoutList)
@router.get("/", response_model=WorkoutList)
def list_my_workouts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = list_workouts(db, current_user.id, skip=skip, limit=limit)
    return {"workouts": items}


@router.get("/{workout_id}", response_model=WorkoutRead)
def fetch(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = get_workout(db, current_user.id, workout_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Workout not found")
    return obj


@router.delete("/{workout_id}")
def remove(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ok = delete_workout(db, current_user.id, workout_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Workout not found")
    return {"deleted": True}


@router.put("/{workout_id}", response_model=WorkoutRead)
def edit(
    workout_id: int,
    workout: WorkoutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = get_workout(db, current_user.id, workout_id)
    if not obj:
        raise HTTPException(404, "Workout not found")
    payload = workout.model_dump(exclude_unset=True)
    if workout.sport not in ACTIVITIES:
        raise HTTPException(422, "Choose a supported activity")
    if payload.get("started_at"):
        try:
            date = datetime.fromisoformat(payload["started_at"].replace("Z", "+00:00"))
            if not date.tzinfo:
                date = date.replace(tzinfo=timezone.utc)
            date = date.astimezone(timezone.utc)
            if date > datetime.now(timezone.utc):
                raise ValueError("Future date")
            payload["started_at"] = date
        except ValueError:
            raise HTTPException(422, "Choose a valid start time in the past")
    else:
        payload.pop("started_at", None)
    for key, value in payload.items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj
