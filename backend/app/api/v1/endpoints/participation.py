from datetime import date, datetime, timezone, timedelta, time as day_time
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.session import get_db
from app.core.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.workout import Workout
from app.core.activities import ACTIVITIES
from app.models.participation import (
    Goal,
    Club,
    ClubMember,
    SessionEvent,
    SessionAttendee,
)

router = APIRouter()


def aware(dt):
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


class GoalIn(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    sport: str | None = Field(default=None, max_length=40)
    metric: Literal["sessions", "distance_m", "duration_sec"]
    target: float = Field(gt=0, le=10000000, allow_inf_nan=False)
    period: Literal["weekly", "monthly"] = "weekly"


@router.get("/goals")
def goals(
    tz: str = Query("UTC", min_length=1, max_length=80),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        zone = ZoneInfo(tz)
    except (ZoneInfoNotFoundError, ValueError):
        raise HTTPException(422, "Unknown timezone")
    now = datetime.now(zone)
    rows = []
    for goal in (
        db.query(Goal).filter_by(user_id=user.id).order_by(Goal.id.desc()).all()
    ):
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start = (
            start - timedelta(days=start.weekday())
            if goal.period == "weekly"
            else start.replace(day=1)
        )
        records = db.query(Workout).filter(
            Workout.user_id == user.id,
            Workout.started_at >= start.astimezone(timezone.utc),
            Workout.started_at <= now.astimezone(timezone.utc),
        )
        if goal.sport:
            records = records.filter(Workout.sport == goal.sport)
        records = records.all()
        progress = (
            len(records)
            if goal.metric == "sessions"
            else sum((getattr(w, goal.metric) or 0) for w in records)
        )
        rows.append(
            {
                "id": goal.id,
                "title": goal.title,
                "sport": goal.sport,
                "metric": goal.metric,
                "target": goal.target,
                "period": goal.period,
                "progress": progress,
                "percent": min(100, progress / goal.target * 100),
                "period_start": start.isoformat(),
            }
        )
    return {"goals": rows, "timezone": tz}


@router.post("/goals", status_code=201)
def create_goal(
    body: GoalIn, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    if not body.title.strip():
        raise HTTPException(422, "Name your goal")
    g = Goal(user_id=user.id, **body.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    return {"id": g.id}


@router.delete("/goals/{id}")
def remove_goal(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    g = db.query(Goal).filter_by(id=id, user_id=user.id).first()
    if not g:
        raise HTTPException(404, "Goal not found")
    db.delete(g)
    db.commit()
    return {"deleted": True}


class ClubIn(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    sport: str = Field(min_length=2, max_length=40)
    city: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=10, max_length=2000)

    @field_validator("name", "sport", "city", "description", mode="before")
    @classmethod
    def clean(cls, value):
        if not value.strip():
            raise ValueError("This field cannot be blank")
        return value.strip()


def club_data(c, db, user):
    members = db.query(ClubMember).filter_by(club_id=c.id).all()
    return {
        "id": c.id,
        "name": c.name,
        "sport": c.sport,
        "city": c.city,
        "description": c.description,
        "members": len(members),
        "joined": bool(user and any(m.user_id == user.id for m in members)),
        "owned": bool(user and c.owner_id == user.id),
    }


@router.get("/clubs")
def clubs(
    q: str = Query("", max_length=100),
    sport: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_optional_user),
):
    query = db.query(Club)
    if q:
        query = query.filter(
            (Club.name.ilike("%" + q + "%")) | (Club.city.ilike("%" + q + "%"))
        )
    if sport:
        query = query.filter(Club.sport == sport)
    return {
        "clubs": [
            club_data(c, db, user)
            for c in query.order_by(Club.created_at.desc()).limit(100).all()
        ]
    }


@router.post("/clubs", status_code=201)
def create_club(
    body: ClubIn, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    c = Club(owner_id=user.id, **body.model_dump())
    db.add(c)
    db.flush()
    db.add(ClubMember(club_id=c.id, user_id=user.id))
    db.commit()
    return club_data(c, db, user)


@router.get("/clubs/{id}")
def club(id: int, db: Session = Depends(get_db), user=Depends(get_optional_user)):
    c = db.get(Club, id)
    if not c:
        raise HTTPException(404, "Club not found")
    result = club_data(c, db, user)
    if result["joined"]:
        result["member_names"] = [
            u.full_name
            for u in db.query(User)
            .join(ClubMember, ClubMember.user_id == User.id)
            .filter(ClubMember.club_id == id)
            .all()
        ]
    result["sessions"] = [
        session_data(s, db, user)
        for s in db.query(SessionEvent)
        .filter(
            SessionEvent.club_id == id,
            SessionEvent.starts_at >= datetime.now(timezone.utc),
        )
        .order_by(SessionEvent.starts_at)
        .all()
    ]
    return result


@router.post("/clubs/{id}/membership")
def membership(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.get(Club, id)
    if not c:
        raise HTTPException(404, "Club not found")
    member = db.query(ClubMember).filter_by(club_id=id, user_id=user.id).first()
    if member:
        if c.owner_id == user.id:
            raise HTTPException(
                409,
                "The organiser stays a member. Delete the club if it is no longer active.",
            )
        db.delete(member)
    else:
        db.add(ClubMember(club_id=id, user_id=user.id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return club_data(c, db, user)


@router.delete("/clubs/{id}")
def delete_club(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Club).filter_by(id=id, owner_id=user.id).first()
    if not c:
        raise HTTPException(404, "Club not found")
    # Sessions remain intact as independent sessions, retaining their host and RSVPs.
    db.query(SessionEvent).filter_by(club_id=id).update({"club_id": None})
    db.query(ClubMember).filter_by(club_id=id).delete()
    db.delete(c)
    db.commit()
    return {"deleted": True}


class SessionIn(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    sport: str = Field(min_length=2, max_length=40)
    description: str = Field(min_length=10, max_length=3000)
    city: str = Field(min_length=2, max_length=100)
    venue: str = Field(min_length=2, max_length=180)
    starts_at: datetime
    club_id: int | None = Field(default=None, gt=0)
    latitude: float | None = Field(default=None, ge=-85, le=85, allow_inf_nan=False)
    longitude: float | None = Field(default=None, ge=-180, le=180, allow_inf_nan=False)

    @field_validator("title", "sport", "description", "city", "venue", mode="before")
    @classmethod
    def clean_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def valid(self):
        self.starts_at = aware(self.starts_at).astimezone(timezone.utc)
        if self.starts_at <= datetime.now(timezone.utc):
            raise ValueError("Choose a future date and time")
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Provide both map coordinates or neither")
        return self


def session_data(s, db, user):
    host = db.get(User, s.host_id)
    attendees = db.query(SessionAttendee).filter_by(session_id=s.id).all()
    return {
        "id": f"local-{s.id}",
        "session_id": s.id,
        "name": s.title,
        "title": s.title,
        "sport": s.sport,
        "description": s.description,
        "city": s.city,
        "venue": s.venue,
        "start": aware(s.starts_at).isoformat(),
        "latitude": s.latitude,
        "longitude": s.longitude,
        "source": "PlayAxis community",
        "host": host.full_name if host else "Member",
        "club_id": s.club_id,
        "attendees": len(attendees),
        "joined": bool(user and any(a.user_id == user.id for a in attendees)),
        "owned": bool(user and s.host_id == user.id),
        "url": None,
    }


@router.get("/sessions")
def sessions(
    city: str = Query("", max_length=100),
    sport: str = Query("", max_length=40),
    joined: bool = False,
    date_from: date | None = None,
    date_to: date | None = None,
    tz: str = Query("UTC", max_length=80),
    db: Session = Depends(get_db),
    user=Depends(get_optional_user),
):
    q = db.query(SessionEvent).filter(
        SessionEvent.starts_at >= datetime.now(timezone.utc)
    )
    if city:
        q = q.filter(SessionEvent.city.ilike("%" + city + "%"))
    if sport == "sports":
        q = q.filter(
            SessionEvent.sport.in_(
                [s for s in ACTIVITIES if s not in {"gaming", "chess", "other"}]
            )
        )
    elif sport and sport != "all":
        q = q.filter(SessionEvent.sport == sport)
    if date_from and date_to and date_to < date_from:
        raise HTTPException(422, "The end date must be on or after the start date")
    if date_from or date_to:
        try:
            zone = ZoneInfo(tz)
        except (ZoneInfoNotFoundError, ValueError):
            raise HTTPException(422, "Unknown timezone")
        if date_from:
            q = q.filter(
                SessionEvent.starts_at
                >= datetime.combine(date_from, day_time.min, zone).astimezone(
                    timezone.utc
                )
            )
        if date_to:
            q = q.filter(
                SessionEvent.starts_at
                <= datetime.combine(date_to, day_time.max, zone).astimezone(
                    timezone.utc
                )
            )
    if joined:
        if not user:
            raise HTTPException(401, "Sign in to see your sessions")
        q = q.join(
            SessionAttendee, SessionAttendee.session_id == SessionEvent.id
        ).filter(SessionAttendee.user_id == user.id)
    return {
        "events": [
            session_data(s, db, user)
            for s in q.order_by(SessionEvent.starts_at).limit(200).all()
        ]
    }


@router.post("/sessions", status_code=201)
def create_session(
    body: SessionIn, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    if (
        body.club_id is not None
        and not db.query(ClubMember)
        .filter_by(club_id=body.club_id, user_id=user.id)
        .first()
    ):
        raise HTTPException(403, "Join this club before organising a session")
    s = SessionEvent(host_id=user.id, **body.model_dump())
    db.add(s)
    db.flush()
    db.add(SessionAttendee(session_id=s.id, user_id=user.id))
    db.commit()
    return session_data(s, db, user)


@router.get("/sessions/{id}")
def session(id: int, db: Session = Depends(get_db), user=Depends(get_optional_user)):
    s = db.get(SessionEvent, id)
    if not s:
        raise HTTPException(404, "Session not found")
    return session_data(s, db, user)


@router.post("/sessions/{id}/rsvp")
def rsvp(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    s = db.get(SessionEvent, id)
    if not s:
        raise HTTPException(404, "Session not found")
    if aware(s.starts_at) < datetime.now(timezone.utc):
        raise HTTPException(409, "This session has already started")
    a = db.query(SessionAttendee).filter_by(session_id=id, user_id=user.id).first()
    if a:
        if s.host_id == user.id:
            raise HTTPException(
                409,
                "The organiser stays on the attendee list. Cancel the session instead.",
            )
        db.delete(a)
    else:
        db.add(SessionAttendee(session_id=id, user_id=user.id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return session_data(s, db, user)


@router.delete("/sessions/{id}")
def delete_session(
    id: int, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    s = db.query(SessionEvent).filter_by(id=id, host_id=user.id).first()
    if not s:
        raise HTTPException(404, "Session not found")
    db.query(SessionAttendee).filter_by(session_id=id).delete()
    db.delete(s)
    db.commit()
    return {"deleted": True}
