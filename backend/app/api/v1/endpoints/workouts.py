from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.schemas.athlete import WorkoutCreate, WorkoutRead, WorkoutList
from app.db.session import SessionLocal
from app.crud.workout import create_workout, get_workout, list_workouts, delete_workout
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/workouts", tags=["workouts"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=WorkoutRead)
def create(workout: WorkoutCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payload = workout.dict(exclude_unset=True)
    if not payload.get('started_at'):
        payload.pop('started_at', None)
    else:
        try:
            # validate parse
            dt = datetime.fromisoformat(payload['started_at'].replace('Z','+00:00'))
            payload['started_at'] = dt
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid started_at format")
    # basic validation hints
    if payload['duration_sec'] <= 0:
        raise HTTPException(status_code=400, detail="duration_sec must be positive")
    if payload.get('distance_m') is not None and payload['distance_m'] < 0:
        raise HTTPException(status_code=400, detail="distance_m cannot be negative")
    obj = create_workout(db, current_user.id, payload)
    return obj

@router.get("/", response_model=WorkoutList)
def list_my_workouts(skip: int = 0, limit: int = Query(50, le=200), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = list_workouts(db, current_user.id, skip=skip, limit=limit)
    return {"workouts": items}

@router.get("/{workout_id}", response_model=WorkoutRead)
def fetch(workout_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = get_workout(db, current_user.id, workout_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Workout not found")
    return obj

@router.delete("/{workout_id}")
def remove(workout_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ok = delete_workout(db, current_user.id, workout_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Workout not found")
    return {"deleted": True}
