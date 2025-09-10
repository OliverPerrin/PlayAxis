from fastapi import APIRouter

from .endpoints.auth import router as auth_router
from .endpoints.events import router as events_router
from .endpoints.users import router as users_router
from .endpoints.sports import router as sports_router
from .endpoints.weather import router as weather_router
from .endpoints.streams import router as streams_router
from .endpoints.aggregate import router as aggregate_router
from .endpoints.leaderboards import router as leaderboards_router
from .endpoints.eventbrite_oauth import router as eventbrite_oauth_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(events_router, prefix="/events", tags=["events"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(sports_router, prefix="/sports", tags=["sports"])
api_router.include_router(weather_router, prefix="/weather", tags=["weather"])
api_router.include_router(streams_router, prefix="/streams", tags=["streams"])
api_router.include_router(aggregate_router, prefix="/aggregate", tags=["aggregate"])
api_router.include_router(leaderboards_router, prefix="/leaderboards", tags=["leaderboards"])
api_router.include_router(eventbrite_oauth_router, prefix="/eventbrite", tags=["eventbrite"])