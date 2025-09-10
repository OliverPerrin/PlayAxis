from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.eventbrite import exchange_eventbrite_code, refresh_eventbrite_token

router = APIRouter()

@router.post("/exchange")
async def eventbrite_exchange(code: str = Query(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        data = await exchange_eventbrite_code(code)
        current_user.eventbrite_access_token = data.get("access_token")
        current_user.eventbrite_refresh_token = data.get("refresh_token")
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        return {"ok": True, "access_token": bool(current_user.eventbrite_access_token)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/refresh")
async def eventbrite_refresh(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.eventbrite_refresh_token:
        raise HTTPException(status_code=400, detail="No refresh token stored")
    try:
        data = await refresh_eventbrite_token(current_user.eventbrite_refresh_token)
        current_user.eventbrite_access_token = data.get("access_token")
        # refresh tokens may rotate
        if data.get("refresh_token"):
            current_user.eventbrite_refresh_token = data.get("refresh_token")
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))