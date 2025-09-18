
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.schemas.user import User
from app.schemas.recommendation import Recommendation
from app.services.twitch import get_twitch_streams
from app.services.sportsdb import unified_events
from typing import List

router = APIRouter()

@router.get("/", response_model=List[Recommendation])
async def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.interests:
        return []

    recommended_events = []

    # Simple recommendation based on interests
    for interest in current_user.interests:

        # Twitch streams (example mapping)
        twitch_game_mapping = {
            'esports': '509658', # Apex Legends
        }
        if interest.name.lower() in twitch_game_mapping:
            try:
                twitch_data = await get_twitch_streams(twitch_game_mapping[interest.name.lower()])
                if "data" in twitch_data:
                    for stream in twitch_data["data"]:
                        recommended_events.append({"type": "twitch", "data": stream})
            except Exception as e:
                print(f"Error fetching Twitch streams for {interest.name}: {e}")

        # Sports events via TheSportsDB
        sports_mapping = {
            'american football': 'nfl',
            'soccer': 'epl',
            'tennis': 'tennis',  # fallback will have empty league mapping currently
        }
        if interest.name.lower() in sports_mapping:
            try:
                sport_key = sports_mapping[interest.name.lower()]
                snapshot = await unified_events(sport_key)
                for ev in snapshot.get('upcoming', [])[:5]:
                    recommended_events.append({"type": "sport_upcoming", "data": ev})
                for ev in snapshot.get('recent', [])[:3]:
                    recommended_events.append({"type": "sport_recent", "data": ev})
            except Exception as e:
                print(f"Error fetching sports data for {interest.name}: {e}")

    return recommended_events
