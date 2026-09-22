"""Compatibility exports for the single application database session."""

from .database import engine, SessionLocal, Base


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
