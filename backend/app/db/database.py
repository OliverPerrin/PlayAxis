from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Use the single declarative Base from app.db.base_class so all models register on the same metadata
from .base_class import Base

RAW_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# Normalize Heroku-style scheme: postgres:// -> postgresql://
if RAW_URL.startswith("postgres://"):
    RAW_URL = RAW_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if RAW_URL.startswith("sqlite") else {}

engine = create_engine(RAW_URL, echo=False, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

# Optional: helps /healthz display the DB kind
DB_KIND = "postgresql" if RAW_URL.startswith("postgresql") else "sqlite"