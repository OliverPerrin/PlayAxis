from sqlalchemy import Column, Integer, String, DateTime, JSON, Index, func
from app.db.base_class import Base

class StandingsCache(Base):
    __tablename__ = 'standings_cache'
    id = Column(Integer, primary_key=True)
    sport = Column(String(64), unique=True, index=True, nullable=False)
    data = Column(JSON, nullable=False)  # full multi-table structure
    refreshed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        Index('ix_standings_cache_sport', 'sport', unique=True),
    )
