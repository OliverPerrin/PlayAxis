from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
import logging

from ....deps import get_db
# Use the canonical User model (email + hashed_password + full_name)
from ....models.user import User
# Use the lightweight auth schemas; we will shape responses to match
from ....schemas import RegisterIn, LoginIn, UserOut, Token
from .... import security

logger = logging.getLogger("auth")
router = APIRouter()

def derive_username(preferred: Optional[str], email: str, full_name: Optional[str]) -> str:
    return preferred or full_name or (email.split("@")[0] if "@" in email else email)

@router.post("/register", response_model=UserOut)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    try:
        # Enforce email uniqueness only (model doesn't have username)
        if db.query(User).filter(User.email == body.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")

        # Map provided username to full_name for now
        full_name = body.username

        user = User(
            email=body.email,
            hashed_password=security.hash_password(body.password),
            full_name=full_name,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Shape response to include a username value
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

@router.post("/login", response_model=Token)
def login(body: LoginIn, db: Session = Depends(get_db)):
    try:
        if not body.username and not body.email:
            raise HTTPException(status_code=400, detail="Provide username or email")

        # Treat username field as an email identifier if provided
        identifier = (body.email or body.username or "").strip()
        user = db.query(User).filter(User.email == identifier).first()
        if not user or not security.verify_password(body.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid username/email or password")

        token = security.create_access_token(sub=str(user.id))
        return {"access_token": token}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("login failed")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.") from e

@router.get("/me", response_model=UserOut)
def me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = security.decode_token(token)
        uid = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "username": derive_username(None, user.email, user.full_name),
        "email": user.email,
    }