from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.workout import Workout
from app.models.standings_cache import StandingsCache

def create_workout(db: Session, user_id: int, data: dict) -> Workout:
    obj = Workout(user_id=user_id, **data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_workout(db: Session, user_id: int, workout_id: int) -> Optional[Workout]:
    return db.query(Workout).filter(Workout.id == workout_id, Workout.user_id == user_id).first()

def list_workouts(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[Workout]:
    return (
        db.query(Workout)
        .filter(Workout.user_id == user_id)
        .order_by(Workout.started_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def delete_workout(db: Session, user_id: int, workout_id: int) -> bool:
    obj = get_workout(db, user_id, workout_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

# ---- Standings Cache Helpers ---- #

def get_standings_cache(db: Session, sport: str) -> Optional[StandingsCache]:
    return db.query(StandingsCache).filter(StandingsCache.sport == sport.lower()).first()

def upsert_standings_cache(db: Session, sport: str, data: dict) -> StandingsCache:
    skey = sport.lower()
    obj = db.query(StandingsCache).filter(StandingsCache.sport == skey).first()
    if obj:
        obj.data = data
    else:
        obj = StandingsCache(sport=skey, data=data)
        db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj