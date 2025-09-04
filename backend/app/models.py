from sqlalchemy import Column, Integer, String, DateTime, func, UniqueConstraint
from .database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("username"), UniqueConstraint("email"))
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(256), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())