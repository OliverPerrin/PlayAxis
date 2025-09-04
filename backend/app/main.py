from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .api.v1 import auth as auth_router

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MultiSportApp API", version="1.0.0")

# CORS: allow Netlify origin and local dev
origins = [
    "http://localhost:3000",
    "https://*.netlify.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1")

@app.get("/api/v1/healthz")
def health():
    return {"ok": True}