
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.schemas.user import User
from app.services.eventbrite import get_eventbrite_events
from app.services.twitch import get_twitch_streams
from app.services.sportsdataio import get_sportsdataio_events
from typing import List, Dict, Any

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
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
            for event in eventbrite_data.events:
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
                for stream in twitch_data.data:
                    recommended_events.append({"type": "twitch", "data": stream})
            except Exception as e:
                print(f"Error fetching Twitch streams for {interest.name}: {e}")

        # SportsData.io events (example mapping)
        sportsdataio_sport_mapping = {
            'american football': 'NFL',
            'soccer': 'Soccer',
            'tennis': 'Tennis',
        }
        if interest.name.lower() in sportsdataio_sport_mapping:
            try:
                sportsdataio_data = await get_sportsdataio_events(sportsdataio_sport_mapping[interest.name.lower()])
                for sport_event in sportsdataio_data:
                    recommended_events.append({"type": "sportsdataio", "data": sport_event})
            except Exception as e:
                print(f"Error fetching SportsData.io events for {interest.name}: {e}")

    return recommended_events
