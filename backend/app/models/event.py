from sqlalchemy import Column, Integer, String, DateTime, Text
from app.db.session import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    url = Column(String(512), nullable=True)  # for ticket link or external event page
    source = Column(String(50), nullable=False)  # e.g. "eventbrite", "sportsdata"
    niche = Column(String(50), nullable=False)   # e.g. "Formula 1", "Hiking"