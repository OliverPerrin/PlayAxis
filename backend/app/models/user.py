
from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from .interest import user_interest

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    is_active = Column(Boolean, default=True)
    interests = relationship("Interest", secondary=user_interest, back_populates="users")
    # Eventbrite columns removed; ensure corresponding Alembic migration updates the database if already applied.
