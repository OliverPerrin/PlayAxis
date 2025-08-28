
import os
from fastapi import APIRouter, FastAPI
from .endpoints import events, streams, sports, weather, auth, users, recommendations

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Define the list of allowed origins (your frontend domains)
origins = [
    "https://your-netlify-site-name.netlify.app",  # Your production frontend URL
    "http://localhost:3000",                      # Common port for local React dev
    "http://localhost:5173",                      # Common port for local Vite dev
    # You can also add Netlify deploy preview URLs using a wildcard if needed,
    # but be specific for better security.
]

# Add the CORS middleware to your application
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(streams.router, prefix="/streams", tags=["streams"])
api_router.include_router(sports.router, prefix="/sports", tags=["sports"])
api_router.include_router(weather.router, prefix="/weather", tags=["weather"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
