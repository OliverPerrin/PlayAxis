from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    JSON,
    func,
)
from app.db.base_class import Base


class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False)
    sport = Column(String(40), nullable=True)
    metric = Column(String(30), nullable=False)
    target = Column(Float, nullable=False)
    period = Column(String(20), nullable=False, default="weekly")
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Club(Base):
    __tablename__ = "clubs"
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    sport = Column(String(40), nullable=False)
    city = Column(String(100), nullable=False)
    description = Column(String(2000), nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ClubMember(Base):
    __tablename__ = "club_members"
    id = Column(Integer, primary_key=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    __table_args__ = (UniqueConstraint("club_id", "user_id"),)


class SessionEvent(Base):
    __tablename__ = "session_events"
    id = Column(Integer, primary_key=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True, index=True)
    title = Column(String(160), nullable=False)
    sport = Column(String(40), nullable=False)
    description = Column(String(3000), nullable=False)
    city = Column(String(100), nullable=False)
    venue = Column(String(180), nullable=False)
    starts_at = Column(DateTime(timezone=True), nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SessionAttendee(Base):
    __tablename__ = "session_attendees"
    id = Column(Integer, primary_key=True)
    session_id = Column(
        Integer, ForeignKey("session_events.id"), nullable=False, index=True
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    __table_args__ = (UniqueConstraint("session_id", "user_id"),)


class DiscoveryCache(Base):
    __tablename__ = "discovery_cache"
    key = Column(String(160), primary_key=True)
    data = Column(JSON, nullable=False)
    stored_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ProviderUsage(Base):
    __tablename__ = "provider_usage"
    key = Column(String(60), primary_key=True)
    calls = Column(Integer, nullable=False, default=0)
