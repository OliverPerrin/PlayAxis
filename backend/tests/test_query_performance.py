"""Query budgets and output parity on an isolated, populated database."""

from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

from app.db.base_class import Base
from app.models.user import User
from app.models.community import CommunityPost, CommunityLike, CommunityComment
from app.models.participation import (
    Club,
    ClubMember,
    SessionEvent,
    SessionAttendee,
    Goal,
)
from app.models.workout import Workout
from app.api.v1.endpoints import community, participation


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add_all(
            [
                User(
                    id=1,
                    email="owner@example.com",
                    hashed_password="unused",
                    full_name="Owner",
                ),
                User(
                    id=2,
                    email="other@example.com",
                    hashed_password="unused",
                    full_name="Other",
                ),
            ]
        )
        session.commit()
        yield session
    engine.dispose()


@contextmanager
def select_queries(db):
    queries = []

    def collect(conn, cursor, statement, parameters, context, executemany):
        if statement.lstrip().upper().startswith("SELECT"):
            queries.append(statement)

    event.listen(db.bind, "before_cursor_execute", collect)
    try:
        yield queries
    finally:
        event.remove(db.bind, "before_cursor_execute", collect)


def test_community_feed_has_fixed_query_budget_and_keeps_per_post_state(db):
    for index in range(35):
        post = CommunityPost(user_id=1, content=f"Post {index}")
        db.add(post)
        db.flush()
        if index % 2 == 0:
            db.add(CommunityLike(post_id=post.id, user_id=2))
        db.add(CommunityComment(post_id=post.id, user_id=2, content=f"Comment {index}"))
    db.commit()
    with select_queries(db) as queries:
        result = community.feed(limit=30, skip=0, db=db, user=SimpleNamespace(id=2))
    assert len(queries) == 3
    assert result["has_more"] and len(result["posts"]) == 30
    for post in result["posts"]:
        index = int(post["content"].split()[-1])
        assert post["author"] == "Owner" and not post["own"]
        assert post["liked"] == (index % 2 == 0)
        assert post["likes"] == int(index % 2 == 0)
        assert post["comments"][0]["content"] == f"Comment {index}"
        assert post["comments"][0]["author"] == "Other"
    anonymous = community.feed(limit=30, skip=0, db=db, user=None)
    assert all(not post["liked"] for post in anonymous["posts"])


def test_club_and_session_lists_have_fixed_query_budgets(db):
    for index in range(30):
        club = Club(
            owner_id=1,
            name=f"Club {index}",
            sport="running",
            city="London",
            description="Run together",
        )
        db.add(club)
        db.flush()
        db.add(ClubMember(club_id=club.id, user_id=1))
        session = SessionEvent(
            host_id=1,
            club_id=club.id,
            title=f"Session {index}",
            sport="running",
            city="London",
            venue="Park",
            description="Run together",
            starts_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
        db.add(session)
        db.flush()
        db.add(SessionAttendee(session_id=session.id, user_id=1))
        if index % 2 == 0:
            db.add(ClubMember(club_id=club.id, user_id=2))
            db.add(SessionAttendee(session_id=session.id, user_id=2))
    db.commit()
    user = SimpleNamespace(id=2)
    with select_queries(db) as queries:
        clubs = participation.clubs(q="", sport=None, db=db, user=user)["clubs"]
    assert len(queries) == 2 and len(clubs) == 30
    with select_queries(db) as queries:
        sessions = participation.sessions(
            city="",
            sport="",
            joined=False,
            date_from=None,
            date_to=None,
            tz="UTC",
            db=db,
            user=user,
        )["events"]
    assert len(queries) == 3 and len(sessions) == 30
    for club in clubs:
        joined = int(club["name"].split()[-1]) % 2 == 0
        assert club["joined"] == joined and club["members"] == 1 + int(joined)
        assert not club["owned"]
    for session in sessions:
        joined = int(session["name"].split()[-1]) % 2 == 0
        assert session["joined"] == joined and session["attendees"] == 1 + int(joined)
        assert session["host"] == "Owner" and not session["owned"]
    joined = participation.sessions(
        city="",
        sport="",
        joined=True,
        date_from=None,
        date_to=None,
        tz="UTC",
        db=db,
        user=user,
    )["events"]
    assert len(joined) == 15 and all(s["joined"] for s in joined)


def test_goal_aggregation_preserves_period_sport_nulls_and_ownership(db, monkeypatch):
    class Clock(datetime):
        @classmethod
        def now(cls, tz=None):
            return datetime(2026, 10, 2, 12, tzinfo=timezone.utc).astimezone(tz)

    monkeypatch.setattr(participation, "datetime", Clock)
    for period in ("weekly", "monthly"):
        for sport in (None, "running", "cycling"):
            for metric in ("sessions", "distance_m", "duration_sec"):
                db.add(
                    Goal(
                        user_id=1,
                        title="Goal",
                        sport=sport,
                        metric=metric,
                        target=100000,
                        period=period,
                    )
                )
    for user_id, sport, started_at, duration, distance in [
        (1, "running", datetime(2026, 9, 30, 12), 600, 1000),
        (1, "running", datetime(2026, 10, 1, 12), 1200, 2000),
        (1, "cycling", datetime(2026, 10, 2, 0), 1800, None),
        (1, "running", datetime(2026, 10, 3, 0), 9999, 9999),
        (2, "running", datetime(2026, 10, 1, 12), 9999, 9999),
    ]:
        db.add(
            Workout(
                user_id=user_id,
                sport=sport,
                started_at=started_at,
                duration_sec=duration,
                distance_m=distance,
            )
        )
    db.commit()
    with select_queries(db) as queries:
        goals = participation.goals(
            tz="Europe/London", db=db, user=SimpleNamespace(id=1)
        )["goals"]
    assert len(queries) == 3 and len(goals) == 18
    for goal in goals:
        running = (2, 3000, 1800) if goal["period"] == "weekly" else (1, 2000, 1200)
        cycling = (1, 0, 1800)
        expected = (
            running
            if goal["sport"] == "running"
            else (
                cycling
                if goal["sport"] == "cycling"
                else tuple(a + b for a, b in zip(running, cycling))
            )
        )
        assert (
            goal["progress"]
            == expected[
                {"sessions": 0, "distance_m": 1, "duration_sec": 2}[goal["metric"]]
            ]
        )
        assert goal["period_start"].endswith("+01:00")
