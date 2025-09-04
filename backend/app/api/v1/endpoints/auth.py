from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
import logging

from ....deps import get_db
from ....models.user import User
from .... import schemas, security

logger = logging.getLogger("auth")
router = APIRouter()

def derive_username(preferred: Optional[str], email: str, full_name: Optional[str]) -> str:
    return (preferred or full_name or (email.split("@")[0] if "@" in email else email)).strip()

@router.post("/register", response_model=schemas.UserOut)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    try:
        if db.query(User).filter(User.email == body.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")

        # Store provided username as full_name for now
        user = User(
            email=body.email,
            hashed_password=security.hash_password(body.password),
            full_name=body.username,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "id": user.id,
            "username": derive_username(body.username, user.email, user.full_name),
            "email": user.email,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("register failed")
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.") from e

@router.post("/login", response_model=schemas.Token)
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    try:
        if not body.username and not body.email:
            raise HTTPException(status_code=400, detail="Provide username or email")

        identifier = (body.email or body.username or "").strip()

        # Try email first
        user = db.query(User).filter(User.email == identifier).first()
        # If not found, allow logging in by full_name (used to store username)
        if not user:
            user = db.query(User).filter(User.full_name == identifier).first()

        if not user or not security.verify_password(body.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid username/email or password")

        token = security.create_access_token(sub=str(user.id))
        return {"access_token": token}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("login failed")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.") from e

# OAuth2-compatible token endpoint (form-encoded)
@router.post("/token", response_model=schemas.Token)
def login_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    identifier = (form_data.username or "").strip()

    # Try email first, then full_name
    user = db.query(User).filter(User.email == identifier).first()
    if not user:
        user = db.query(User).filter(User.full_name == identifier).first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    token = security.create_access_token(sub=str(user.id))
    return {"access_token": token}