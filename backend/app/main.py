from contextlib import asynccontextmanager
from pathlib import Path
import os
import subprocess
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import DB_KIND, engine, Base
from app.api.v1.api import api_router
from app.models import *
from app.models.community import CommunityPost, CommunityLike, CommunityComment


@asynccontextmanager
async def lifespan(app):
    if os.getenv("RUN_MIGRATIONS", "0") == "1":
        subprocess.check_call(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=Path(__file__).resolve().parents[1],
        )
    elif DB_KIND == "sqlite":
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="PlayAxis API", version="3.0.0", lifespan=lifespan)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://playaxis.netlify.app",
]
if settings.FRONTEND_URL:
    origins.append(settings.FRONTEND_URL.rstrip("/"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
app.include_router(api_router, prefix="/api/v1")


@app.get("/healthz")
@app.get("/api/v1/healthz")
def health():
    return {"ok": True, "db": DB_KIND, "version": "3.0.0"}
