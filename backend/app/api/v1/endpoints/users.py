from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import User, UserUpdate
from app.schemas.interest import InterestCreate
from typing import List
from app.models.user import User as UserModel
from app.crud.interest import get_or_create_interest
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("/me", response_model=User)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/me/interests", response_model=User)
def update_user_interests(
    interests: List[InterestCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # Clear existing interests
        current_user.interests.clear()

        # Add new interests
        for interest_data in interests:
            interest = get_or_create_interest(db, interest_data.name)
            current_user.interests.append(interest)

        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        return current_user
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail="Unable to save your interests. Please try again."
        )


@router.put("/me", response_model=User)
def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if user_in.full_name is not None:
            duplicate = (
                db.query(UserModel)
                .filter(
                    UserModel.full_name == user_in.full_name,
                    UserModel.id != current_user.id,
                )
                .first()
            )
            if duplicate:
                raise HTTPException(409, "This username is already in use")
            current_user.full_name = user_in.full_name

        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        return current_user
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail="Unable to save your profile. Please try again."
        )


@router.get("/me/export")
def export_account(
    current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    from datetime import datetime, timezone
    from app.models.workout import Workout
    from app.models.participation import (
        Goal,
        Club,
        ClubMember,
        SessionEvent,
        SessionAttendee,
    )
    from app.models.community import CommunityPost, CommunityComment
    from app.schemas.athlete import WorkoutRead

    def fields(obj, names):
        result = {}
        for name in names:
            value = getattr(obj, name)
            if isinstance(value, datetime) and value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            result[name] = value
        return result

    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "profile": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.full_name,
            "interests": [i.name for i in current_user.interests],
        },
        "workouts": [
            WorkoutRead.model_validate(w).model_dump(mode="json")
            for w in db.query(Workout).filter_by(user_id=current_user.id).all()
        ],
        "goals": [
            fields(g, ["id", "title", "sport", "metric", "target", "period"])
            for g in db.query(Goal).filter_by(user_id=current_user.id).all()
        ],
        "clubs": [
            fields(c, ["id", "name", "sport", "city"])
            for c in db.query(Club)
            .join(ClubMember, ClubMember.club_id == Club.id)
            .filter(ClubMember.user_id == current_user.id)
            .all()
        ],
        "organised_sessions": [
            fields(
                s,
                [
                    "id",
                    "title",
                    "sport",
                    "description",
                    "city",
                    "venue",
                    "starts_at",
                    "latitude",
                    "longitude",
                ],
            )
            for s in db.query(SessionEvent).filter_by(host_id=current_user.id).all()
        ],
        "joined_sessions": [
            a.session_id
            for a in db.query(SessionAttendee).filter_by(user_id=current_user.id).all()
        ],
        "posts": [
            fields(p, ["id", "content", "sport", "created_at"])
            for p in db.query(CommunityPost).filter_by(user_id=current_user.id).all()
        ],
        "comments": [
            fields(c, ["id", "post_id", "content", "created_at"])
            for c in db.query(CommunityComment).filter_by(user_id=current_user.id).all()
        ],
    }
