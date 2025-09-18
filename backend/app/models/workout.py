from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Workout(Base):
    __tablename__ = 'workouts'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    sport = Column(String(32), index=True, nullable=False)  # running, cycling, skiing
    started_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    duration_sec = Column(Integer, nullable=False)
    distance_m = Column(Float)  # meters
    elevation_m = Column(Float)
    avg_power_w = Column(Float)
    avg_hr = Column(Integer)
    units = Column(JSON, nullable=True)  # { system: 'metric'|'imperial', pace_mode: 'time_per_distance'|'speed' }
    raw_metrics = Column(JSON, nullable=True)  # store arbitrary metric dict (e.g., splits, device data)
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship('User', backref='workouts')
