"""Run local PlayAxis with durable SQLite and the provider keys from .env."""

import os
from pathlib import Path
import uvicorn

if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    os.environ.setdefault("DATABASE_URL", "sqlite:///" + str(root / "playaxis.db"))
    os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=[str(root / "app")],
    )
