from fastapi import FastAPI

app = FastAPI(
    title="MultiSport API",
    version="0.1.0",
    docs_url="/docs",
)

@app.get("/healthz", tags=["Health"])
async def health_check():
    return {"status": "ok"}