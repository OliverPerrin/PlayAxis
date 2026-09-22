# backend/app/db/base.py
# Import all models to ensure they're registered with SQLAlchemy
from app.models.user import User
from app.models.interest import Interest, user_interest
from app.models.event import Event

from app.db.base_class import Base
from app.models.workout import Workout
from app.models.standings_cache import StandingsCache
from app.models.community import CommunityPost, CommunityLike, CommunityComment
from app.models.participation import (
    Goal,
    Club,
    ClubMember,
    SessionEvent,
    SessionAttendee,
    DiscoveryCache,
    ProviderUsage,
)
