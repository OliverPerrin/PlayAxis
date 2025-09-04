from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
import logging

from ....deps import get_db  # used by auth endpoints
from ....models.user import User
from .... import schemas, security

logger = logging.getLogger("auth")
router = APIRouter()

def derive_username(preferred: Optional[str], email: str, full_name: Optional[str]) -> str:
    return (preferred or full_name or (email.split("@")[0] if "@" in email else email)).strip()

@router.post("/register", response_model=schemas.UserOut)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    try:
        # Enforce email uniqueness only (DB model doesn't have a username column)
        if db.query(User).filter(User.email == body.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")

        user = User(
            email=body.email,
            hashed_password=security.hash_password(body.password),
            full_name=body.username,  # store provided username as full_name for now
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

        # Try email first; if not, try full_name (where we put "username")
        user = db.query(User).filter(User.email == identifier).first()
        if not user:
            user = db.query(User).filter(User.full_name == identifier).first()

        if not user or not security.verify_password(body.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid username/email or password")

        # Encode sub=email so app.core.dependencies.get_current_user works
        token = security.create_access_token(sub=user.email)
        return {"access_token": token}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("login failed")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.") from e

# OAuth2-compatible: form-encoded username/password
@router.post("/token", response_model=schemas.Token)
def login_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    identifier = (form_data.username or "").strip()

    user = db.query(User).filter(User.email == identifier).first()
    if not user:
        user = db.query(User).filter(User.full_name == identifier).first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    token = security.create_access_token(sub=user.email)
    return {"access_token": token}

@router.get("/me", response_model=schemas.UserOut)
def me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = security.decode_token(token)
        email = payload.get("sub") or ""
        if not email:
            raise ValueError("Missing sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "username": derive_username(None, user.email, user.full_name),
        "email": user.email,
    }