from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import httpx
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.core.config import settings

router = APIRouter()

@router.get("/debug")
async def eventbrite_debug(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    token_chain = {
        "user": getattr(current_user, "eventbrite_access_token", None),
        "private": settings.EVENTBRITE_PRIVATE_TOKEN,
        "public": settings.EVENTBRITE_PUBLIC_TOKEN,
    }
    base = settings.EVENTBRITE_API_URL.rstrip("/")
    used = None
    headers = None
    for name in ("user", "private", "public"):
        if token_chain[name]:
            used = name
            headers = {"Authorization": f"Bearer {token_chain[name]}", "Accept": "application/json"}
            break
    results: dict = {"selected_token_type": used, "base": base}
    async with httpx.AsyncClient(timeout=15.0) as client:
        if headers:
            me = await client.get(f"{base}/users/me/", headers=headers)
            results["users_me_status"] = me.status_code
            if me.status_code == 200:
                data = me.json()
                results["organizations_count"] = len(data.get("organizations", []) or [])
            search = await client.get(f"{base}/events/search/", headers=headers, params={"q": "test", "location.address": "United States"})
            results["search_status"] = search.status_code
            if search.status_code != 200:
                results["search_body_prefix"] = search.text[:160]
        else:
            results["error"] = "No token available"
    return results
