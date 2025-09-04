from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db.database import Base, engine, DB_KIND
from . import models  # ensure models are imported so tables register
from .api.v1.api import api_router

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MultiSportApp API", version="1.0.0")

# CORS for local dev and Netlify
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1
app.include_router(api_router, prefix="/api/v1")

@app.get("/api/v1/healthz")
def health():
    return {"ok": True, "db": DB_KIND}