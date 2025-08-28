import os
from fastapi import APIRouter
from .endpoints import events, streams, sports, weather, auth, users, recommendations

# Create API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(streams.router, prefix="/streams", tags=["streams"])
api_router.include_router(sports.router, prefix="/sports", tags=["sports"])
api_router.include_router(weather.router, prefix="/weather", tags=["weather"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])

# Add a test endpoint
@api_router.get("/test")
async def test_endpoint():
    return {"message": "API is working", "status": "success"}