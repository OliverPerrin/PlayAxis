# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# 1) Instantiate your FastAPI app
app = FastAPI(
    title="Multi-Event Calendar API",
    version="0.1.0",
    docs_url="/docs",
)

# 2) Configure CORS - CRITICAL: This must be done BEFORE importing routers
# Allow multiple origins for different environments
allowed_origins = [
    "http://localhost:3000",  # Local development
    "http://127.0.0.1:3000",  # Alternative local
    "https://localhost:3000", # HTTPS local
]

# Add production frontend URL if provided
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    # Remove trailing slash and % if present
    frontend_url = frontend_url.rstrip('/%')
    allowed_origins.append(frontend_url)
    allowed_origins.append("https://prismatic-sawine-b2188b.netlify.app")

# For development, you might want to allow all origins
# Remove this in production for security
if os.getenv("ENVIRONMENT") == "development":
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language", 
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Cache-Control",
        "Pragma"
    ],
    expose_headers=["*"],
    max_age=3600,
)

# 3) Import your routers *after* CORS is configured
from app.api.v1.api import api_router

# 4) Register routers
app.include_router(api_router, prefix="/api/v1")

# 5) Health check endpoints
@app.get("/", tags=["health"])
async def root():
    return {"message": "MultiSportApp API is running", "status": "ok"}

@app.get("/healthz", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "multisport-api"}

@app.get("/api/health", tags=["health"])
async def api_health():
    return {"status": "healthy", "api_version": "v1"}