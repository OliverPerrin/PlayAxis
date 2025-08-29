# backend/app/db/base.py
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Import all models to ensure they're registered with SQLAlchemy
from app.models.user import User
from app.models.interest import Interest, user_interest
from app.models.event import Event
