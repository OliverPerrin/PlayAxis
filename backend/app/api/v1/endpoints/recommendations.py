"""Explainable next actions using the member's interests and recorded activity."""

from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.workout import Workout
from app.models.participation import Goal

router = APIRouter()


@router.get("")
@router.get("/")
def recommendations(user=Depends(get_current_user), db=Depends(get_db)):
    interests = {i.name.casefold() for i in user.interests}
    items = []
    if interests & {"running", "walking", "cycling", "swimming", "tennis", "hiking"}:
        items.append(
            {
                "title": "Find people to move with",
                "path": "/local",
                "reason": "Matches the activities you enjoy.",
            }
        )
    if "esports" in interests:
        items.append(
            {
                "title": "Catch an esports broadcast",
                "path": "/watch?category=esports",
                "reason": "You selected esports in your interests.",
            }
        )
    sports = {
        "football": "epl",
        "american football": "nfl",
        "basketball": "nba",
        "baseball": "mlb",
        "ice hockey": "nhl",
        "motorsport": "f1",
    }
    for interest, league in sports.items():
        if interest in interests:
            items.append(
                {
                    "title": "Follow your next " + interest + " fixture",
                    "path": "/matches?sport=" + league,
                    "reason": "Based on your selected sport.",
                }
            )
    if not db.query(Goal).filter_by(user_id=user.id).first():
        items.append(
            {
                "title": "Give your week a goal",
                "path": "/goals",
                "reason": "Create a target for sessions, time or distance.",
            }
        )
    if not db.query(Workout).filter_by(user_id=user.id).first():
        items.append(
            {
                "title": "Make your first training entry",
                "path": "/log-workout",
                "reason": "Your progress starts with one recorded activity.",
            }
        )
    if not interests:
        items.append(
            {
                "title": "Choose the sports you enjoy",
                "path": "/profile",
                "reason": "Your interests shape the suggestions you see.",
            }
        )
    return {"recommendations": items[:4]}
