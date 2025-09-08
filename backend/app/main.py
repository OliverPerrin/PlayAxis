from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db.database import Base, engine, DB_KIND
from .db import base as _models
from .api.v1.api import api_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MultiSportApp API", version="1.0.0", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https?://([a-z0-9-]+\.)*(netlify\.app|vercel\.app|koyeb\.app)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/api/v1/healthz")
def health():
    return {"ok": True, "db": DB_KIND}