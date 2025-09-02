# backend/app/db/base.py
# Import all models to ensure they're registered with SQLAlchemy
from app.models.user import User
from app.models.interest import Interest, user_interest
from app.models.event import Event
