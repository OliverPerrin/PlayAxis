from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from app.core.config import settings
from .url import database_url

# Use the single declarative Base from app.db.base_class so all models register on the same metadata
from .base_class import Base

RAW_URL = database_url(settings.DATABASE_URL)

connect_args = {"check_same_thread": False} if RAW_URL.startswith("sqlite") else {}

# The managed database can close idle SSL connections while the app is asleep.
# Replace stale pooled connections before handing them to a request.
engine = create_engine(
    RAW_URL, echo=False, future=True, connect_args=connect_args, pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

# Optional: helps /healthz display the DB kind
DB_KIND = "postgresql" if RAW_URL.startswith("postgresql") else "sqlite"
