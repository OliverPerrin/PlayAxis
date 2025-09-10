from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from urllib.parse import urlencode
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.eventbrite import exchange_eventbrite_code, refresh_eventbrite_token
from app.core.config import settings

router = APIRouter()

@router.get("/authorize")
async def eventbrite_authorize(state: str | None = None):
    """Redirect user to Eventbrite authorization page."""
    client_id = settings.EVENTBRITE_CLIENT_ID or settings.EVENTBRITE_API_KEY
    redirect_uri = settings.EVENTBRITE_REDIRECT_URI
    if not client_id or not redirect_uri:
        raise HTTPException(status_code=500, detail="Eventbrite OAuth not configured")
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
    }
    if state:
        params["state"] = state
    auth_url = f"https://www.eventbrite.com/oauth/authorize?{urlencode(params)}"
    return RedirectResponse(auth_url)

@router.get("/callback")
async def eventbrite_callback(request: Request, code: str | None = None, state: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not code:
        return HTMLResponse("<h3>Missing code parameter</h3>", status_code=400)
    try:
        data = await exchange_eventbrite_code(code)
        current_user.eventbrite_access_token = data.get("access_token")
        current_user.eventbrite_refresh_token = data.get("refresh_token")
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        # Simple success page that can be refined later
        return HTMLResponse("<html><body><h3>Eventbrite connected.</h3><script>setTimeout(()=>{window.location='/'},1200)</script></body></html>")
    except Exception as e:
        return HTMLResponse(f"<h3>Auth failed: {e}</h3>", status_code=400)

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