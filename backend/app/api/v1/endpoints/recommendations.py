
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.schemas.user import User
from app.schemas.recommendation import Recommendation
from app.services.eventbrite import get_eventbrite_events
from app.services.twitch import get_twitch_streams
from backend.app.services.sportsbook import get_sportsbook_events
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
        # Eventbrite events
        try:
            eventbrite_query = interest.name
            eventbrite_data = await get_eventbrite_events(eventbrite_query)
            if "events" in eventbrite_data:
                for event in eventbrite_data["events"]:
                    recommended_events.append({"type": "eventbrite", "data": event})
        except Exception as e:
            print(f"Error fetching Eventbrite events for {interest.name}: {e}")

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

        # Sportsbook events (example mapping)
        sportsbook_sport_mapping = {
            'american football': 'americanfootball_nfl',
            'soccer': 'soccer_usa_mls',
            'tennis': 'tennis_atp',
        }
        if interest.name.lower() in sportsbook_sport_mapping:
            try:
                sportsbook_data = await get_sportsbook_events(sportsbook_sport_mapping[interest.name.lower()])
                for sport_event in sportsbook_data:
                    recommended_events.append({"type": "sportsbook", "data": sport_event})
            except Exception as e:
                print(f"Error fetching Sportsbook events for {interest.name}: {e}")

    return recommended_events
