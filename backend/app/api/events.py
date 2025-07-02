from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.session import SessionLocal
from app.models.event import Event as EventModel
from app.schemas.event import EventRead

router = APIRouter(prefix="/events", tags=["events"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[EventRead])
def list_events(
    start: datetime = Query(..., description="Start of range"),
    end: datetime = Query(..., description="End of range"),
    db: Session = Depends(get_db),
):
    events = (
        db.query(EventModel)
        .filter(EventModel.start_time >= start)
        .filter(EventModel.start_time <= end)
        .all()
    )
    return events

