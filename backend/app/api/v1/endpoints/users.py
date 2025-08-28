
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import User, UserUpdate
from app.crud.user import get_user_by_email
from app.schemas.interest import InterestCreate
from typing import List
from app.crud.interest import get_interest_by_name, create_interest
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
    current_user.interests.clear()
    for interest_data in interests:
        interest = get_interest_by_name(db, name=interest_data.name)
        if not interest:
            interest = create_interest(db, interest=interest_data)
        current_user.interests.append(interest)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me", response_model=User)
def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
