from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

# From app/api/v1/endpoints -> up to app/
from ....deps import get_db
from .... import models, schemas, security

router = APIRouter()

@router.post("/register", response_model=schemas.UserOut)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        username=body.username,
        email=body.email,
        password_hash=security.hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=schemas.Token)
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    if not body.username and not body.email:
        raise HTTPException(status_code=400, detail="Provide username or email")
    q = db.query(models.User)
    user = None
    if body.username:
        user = q.filter(models.User.username == body.username).first()
    if not user and body.email:
        user = q.filter(models.User.email == body.email).first()
    if not user or not security.verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")
    token = security.create_access_token(sub=str(user.id))
    return {"access_token": token}

@router.get("/me", response_model=schemas.UserOut)
def me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = security.decode_token(token)
        uid = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.get(models.User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user