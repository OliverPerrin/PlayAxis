# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1) Instantiate your FastAPI app
app = FastAPI(
    title="Multi-Event Calendar API",
    version="0.1.0",
    docs_url="/docs",
)

# 2) Configure CORS so React (at http://localhost:3000) can call you
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3) Import your routers *after* app exists
from app.api.events import router as events_router
from app.api.imports import router as imports_router

# 4) Register routers
app.include_router(events_router, prefix="/events", tags=["events"])
app.include_router(imports_router)

# 5) (Optional) health check
@app.get("/healthz", tags=["health"])
async def health_check():
    return {"status": "ok"}

